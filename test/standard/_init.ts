import { expect } from 'chai';
import { Page } from 'puppeteer';
import Webserver from "../classes/Webserver";
import { browser } from "../test";

export let webserver: Awaited<ReturnType<typeof Webserver.start>>;

export const openLoginPage = async (pageType: Parameters<typeof webserver.getUrl>[0]): Promise<Page> =>
{
    const url = webserver.getUrl(pageType);
    const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
    await expect(page.goto(url, {waitUntil: 'networkidle2', timeout: 5000}), `Failed to load ${url}`).to.eventually.be.fulfilled;

    return page;
};

export const validateLoginResult = async (page: Page, successful: boolean = true) =>
{
    if(successful)
        await expect(page.waitForSelector('text/successful', {timeout: 2000}), `Unable to find "successful" text`).to.be.eventually.fulfilled;
    else
        await expect(page.waitForSelector('text/Invalid', {timeout: 2000}), `Unable to find "Invalid" text`).to.be.eventually.fulfilled;
};

before('Start test webserver', async function()
{
    webserver = await expect(Webserver.start(), 'Failed to start test webserver').to.eventually.be.fulfilled;
});

after('Stop test webserver', async function()
{
    webserver.stop();
});
