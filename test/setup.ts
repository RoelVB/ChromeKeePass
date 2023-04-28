import { expect } from 'chai';
import { ElementHandle } from 'puppeteer';
import { browser } from './test';
import { sleep } from './Helpers';
import MockKeePassHttp from './classes/MockKeePassHttp';

describe('Setup CKP', async function()
{
    this.bail(true);

    it('Change CKP port', async function()
    {
        this.timeout(5000);

        const optionsPage = await browser.getOptionsPage();
        const portInput: ElementHandle = await expect(optionsPage.waitForSelector('#portField'), "Couldn't find port input field").to.eventually.be.fulfilled;
        portInput.click({clickCount: 3}); // Select the input's content
        await sleep(500); // Wait 0.5 second, selecting doesn't seem to be instant
        portInput.type(String(MockKeePassHttp.kphPort));
        await sleep(500); // Wait 0.5 second
        await expect(optionsPage.click('#applyBtn:not([disabled])'), "Couldn't find apply button (maybe it's disabled)").to.eventually.be.fulfilled;
        await sleep(1000); // Wait 1 second to apply the settings
    });

    it('Connect with KeePassHttp', async function()
    {
        this.timeout(5000);
        
        const optionsPage = await browser.getOptionsPage();
        await expect(optionsPage.waitForSelector('#connectBtn'), "Couldn't find connect button").to.eventually.be.fulfilled;
        await optionsPage.click('#connectBtn');
        const associationIdElement: ElementHandle = await expect(optionsPage.waitForSelector('text/Connected as '), 'Unable to find DIV containing "Connected as.." text').to.be.eventually.fulfilled;
        const associationIdInnerText = (await (await associationIdElement.getProperty('innerText')).jsonValue()) as string;
        const assocationId = /'(.+)'/.exec(associationIdInnerText)?.[1];

        expect(assocationId, 'Not assocation ID found').to.be.string;
    });
});
