import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { ensureBehaviourSettings, findLogins, sleep } from "../Helpers";
import { browser } from "../test";

it('Microsoft', async function()
{
    await ensureBehaviourSettings({
        showDropdownOnClick: true,
    });

    const page: Page = await expect(browser.newPage(), 'Failed to open a new page').to.eventually.be.fulfilled;
    await expect(page.goto('https://login.live.com', {waitUntil: 'networkidle2'}), 'Failed to load https://login.live.com').to.eventually.be.fulfilled;

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

    // Click "Do not stay signed in"
    const doNotRememberButton = await expect(page.waitForSelector('#idBtn_Back', {timeout: 2000, visible: true}), 'Failed to find "No" button').to.eventually.be.fulfilled;
    await doNotRememberButton.click();

    // Check if login was successful
    await expect(page.waitForSelector('#O365_MainLink_Me', {timeout: 15000}), 'Login seems to be unsuccessful').to.eventually.be.fulfilled;

    // Close the page
    await page.close();
});
