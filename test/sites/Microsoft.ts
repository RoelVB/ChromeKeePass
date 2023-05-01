import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { ensureBehaviourSettings, findLogins, sleep } from "../Helpers";
import { browser } from "../test";

it('Microsoft', async function()
{
    await ensureBehaviourSettings({
        showDropdownOnClick: true,
        autoFillSingleCredential: false,
    });

    const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
    await expect(page.goto('https://login.live.com', {waitUntil: 'networkidle2'}), 'Failed to load https://login.live.com').to.eventually.be.fulfilled;

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

        // There's a transition/animation here, wait a few seconds for it to complete
        await sleep(2000);

        // Wait for password input
        const passwordInput: ElementHandle<HTMLInputElement> = await expect(page.waitForSelector('input[type="password"]', {timeout: 2000, visible: true}), 'Password field not found').to.eventually.be.fulfilled;
        expect(await page.evaluate(res=>res.value, passwordInput), 'Password field is empty').not.be.empty;
        await passwordInput.press('Enter');

        // Check if there's no passwordError
        // await expect(page.waitForSelector('#passwordError', {timeout: 2000}), 'We got a password error').to.eventually.be.rejected;

        // Click "Do not stay signed in"
        const doNotRememberButton = await expect(page.waitForSelector('#idBtn_Back', {timeout: 2000, visible: true}), 'Failed to find "No" button').to.eventually.be.fulfilled;
        await doNotRememberButton.click();

        // If the login was successful we will navigate to a different hostname
        await expect(page.waitForFunction(()=>location.host !== 'login.live.com', {timeout: 10000}), 'Expected browser to navigate away from login.live.com after successful login').to.eventually.be.fulfilled;

        // Close the page
        await page.close();
        
    } finally {
        if(!page.isClosed()) // Page is still open? Which means the login failed
            await page.screenshot({path: './test/screenshots/Google.png'});
    }
});