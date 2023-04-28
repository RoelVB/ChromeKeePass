import path from 'path';
import puppeteer, { Browser as PuppeteerBrowser, ElementHandle, Page } from "puppeteer"
import type { ISettings } from '../../src/Settings';
import { sleep } from '../Helpers';

/** This class extends the Puppeteer browser object */
export default class Browser implements ProxyHandler<Browser>
{
    #extensionId?: string | null;
    #optionsPage?: Page | null;

    constructor(public readonly browser: PuppeteerBrowser)
    {
        
    }

    static async launch(options?: Parameters<typeof puppeteer.launch>[0]): Promise<PuppeteerBrowser & Browser>
    {
        const extensionPath = path.join(process.cwd(), 'dist');
        const browser = await puppeteer.launch({
            ...{
                headless: false,
                args: [`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`],
            },
            ...options
        });
        const browserExtension = new Browser(browser);

        return new Proxy(browser, browserExtension);
    }

    /** ProxyHandler getter */
    get(target: any, prop: string)
    {
        const value = prop in this ? this[prop] : this.browser[prop];
        if(value instanceof Function)
            return value.bind(prop in this ? this : this.browser);
        return value;
    }

    async getExtensionId(): Promise<string>
    {
        if(this.#extensionId === undefined)
        {
            // Wait for the background page
            const backgroundPageTarget = await this.browser.waitForTarget(target => target.type() === 'background_page');
            const backgroundPage = await backgroundPageTarget.page()
            // Capture logs from the background
            // backgroundPage?.on('console', msg => console.log(`[CKP-Background]: ${msg.type()}: ${msg.text()}`));
            // Get the extesion ID from the URL
            const extensionId = /^chrome-extension:\/\/(\w+)\//.exec(backgroundPageTarget?.url() || '')?.[1];
            this.#extensionId = extensionId ?? null;
        }

        if(!this.#extensionId) throw new Error('Unabled to find extension ID');
        return this.#extensionId;
    }

    async getOptionsPage(): Promise<Page>
    {
        if(this.#optionsPage === undefined)
        {
            try {
                const extensionId = await this.getExtensionId();
                const optionsPage = await this.browser.newPage();
                await optionsPage.goto(`chrome-extension://${extensionId}/html/options.html`);
                this.#optionsPage = optionsPage;
            } catch(error) {
                this.#optionsPage = null;
                throw error;
            }
        }
        
        if(!this.#optionsPage) throw new Error('Failed to open options page');
        return this.#optionsPage;
    }

    async ensureBehaviourSettings(settings: Partial<Omit<ISettings, 'keePassHost'|'keePassPort'|'theme'>>)
    {
        const optionsPage = await this.openOptionsTab('Behaviour');
        let somethingChanged = false;

        for(const optionName in settings)
        {
            if(typeof settings[optionName] === 'boolean')
            {
                try {
                    const option = (await optionsPage.waitForSelector(`#switchOption-${optionName} input`))!;
                    const isEnabled = await optionsPage.$eval(`#switchOption-${optionName} input`, option=>option.checked);
                    if(isEnabled !== settings[optionName])
                    {
                        await option.click();
                        somethingChanged = true;
                    }
                } catch(error) {
                    throw new Error(`Failed to toggle option "${optionName}". ${String(error)}`);
                }
            }
        }

        if(somethingChanged)
            await sleep(1000); // Give it a second to save the settings
    }

    async openOptionsTab(tabName: 'Connection'|'Behaviour'|'Appearance'): Promise<Page>
    {
        const optionsPage = await this.getOptionsPage();

        // Find and open the options tab
        let tab: ElementHandle<Element>;
        try {
            tab = (await optionsPage.waitForSelector(`#tab-${tabName}`, {timeout: 2000}))!;
            await tab.click();
        } catch(error) {
            throw new Error(`Failed to open the tab "${tabName}". ${String(error)}`);
        }

        return optionsPage;
    }

    /**
     * Search a page/tab by it's URL
     * @param url Part of the URL
     * @param timeout Keep trying for this number of seconds
     */
    async findPage(url: string, timeout: number = 5): Promise<Page | undefined>
    {
        for(let i=0; i<timeout; i++)
        {
            const pages = await this.browser.pages();
            for(const page of pages)
            {
                if(page.url().includes(url))
                    return page;
            }

            await sleep(1000);
        }
    }

}
