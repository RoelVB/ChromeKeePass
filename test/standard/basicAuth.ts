import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { browser } from "../test";
import { ensureBehaviourSettings } from "../Helpers";
import { webserver } from "./_init";

/**
 * 
 * @param loginsCount The number of logins to generate
 * @param validLogins Which of the logins (indexes) will be valid (default = all)
 * @param useLoginIndex Which login to use
 * @param successText Expected text to find on the page after logging in
 */
const tryBasicAuth = async (loginsCount: number, validLogins?: number[], useLoginIndex: number = 0, successText: string = 'successful')=>
{
    // Set logins
    webserver.setLogins(loginsCount, validLogins);

    // Open login page
    const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
    page.goto(webserver.urlBasicAuth); // Don't wait for this to complete! Because it completed after logging in

    // Find login popup
    const loginPage: Page = await expect(browser.findPage('html/credentialSelector.html'), 'An error occured looking for the login popup').to.be.eventually.fulfilled;
    expect(loginPage, 'Login popup not found').to.not.be.undefined;

    // Check the expected number of logins
    const logins: ElementHandle<HTMLDivElement>[] = await expect(loginPage.$$('div[tabindex="0"]'), 'Failed to find logins').to.eventually.be.fulfilled;
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Select login
    await logins[useLoginIndex].click();

    // Check if login was successful
    await expect(page.waitForSelector(`text/${successText}`, {timeout: 2000}), `Unable to find "${successText}" text`).to.be.eventually.fulfilled;

    // Close the page
    await page.close();
};

describe('Basic auth', function()
{
    it('Single login - autofill', async function()
    {
        await ensureBehaviourSettings({
            autoFillSingleCredential: true,
        });

        // Create and set a single login
        webserver.setLogins(1);

        // Open login page
        const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
        await page.goto(webserver.urlBasicAuth);

        // Check if login was successful
        await expect(page.waitForSelector('text/successful', {timeout: 2000}), 'Unable to find "successful" text').to.be.eventually.fulfilled;

        // Close the page
        await page.close();
    });

    it('Single login - NO autofill', async function()
    {
        await ensureBehaviourSettings({
            autoFillSingleCredential: false,
        });

        // Try logging in
        await tryBasicAuth(1);
    });

    it('Multiple logins', async function()
    {
        // Try logging in
        await tryBasicAuth(3);
    });

    it('Invalid login', async function()
    {
        await tryBasicAuth(2, [], undefined, 'Unauthorized');
    });
});
