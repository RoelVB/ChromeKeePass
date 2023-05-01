import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { ensureBehaviourSettings, findLogins } from "../Helpers";
import { browser } from "../test";

it('Google', async function()
{
    await ensureBehaviourSettings({
        showDropdownOnClick: true,
        autoFillSingleCredential: false,
    });

    const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
    await expect(page.goto('https://accounts.google.com', {waitUntil: 'networkidle2'}), 'Failed to load https://accounts.google.com').to.eventually.be.fulfilled;

    try {
        // Is there an input field?
        const usernameInput: ElementHandle<HTMLInputElement> = await expect(page.waitForSelector('input[type="email"]', {timeout: 2000}), 'Email field not found').to.eventually.be.fulfilled;
        await expect(usernameInput.click(), 'Failed to select email field').to.eventually.be.fulfilled;

        // Is the CKP dropdown open?
        const logins = await findLogins(page);
        expect(logins.length, 'No logins found').to.be.greaterThan(0);

        // Selecter first login and Enter
        await usernameInput.press('ArrowDown');
        await usernameInput.press('Enter');

        // Wait for password input
        const passwordInput: ElementHandle<HTMLInputElement> = await expect(page.waitForSelector('input[type="password"]', {timeout: 2000, visible: true}), 'Password field not found').to.eventually.be.fulfilled;
        await expect(passwordInput.click(), 'Failed to select password field').to.eventually.be.fulfilled;
        // Selecter first ogins and Enter
        await usernameInput.press('ArrowDown');
        await usernameInput.press('Enter');

        // If the login was successful we will navigate to a different URL
        await expect(page.waitForNavigation({timeout: 10000}), 'Expected browser to navigate after successful login').to.eventually.be.fulfilled;

        // Close the page
        await page.close();

    } finally {
        if(!page.isClosed()) // Page is still open? Which means the login failed
            await page.screenshot({path: './test/screenshots/Google.png'});
    }
});