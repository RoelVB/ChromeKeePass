import { expect } from "chai";
import { ensureBehaviourSettings, findLogins, findUsernameField } from '../Helpers';
import { openLoginPage, webserver } from "./_init";

describe('Dropdown behaviour', function()
{
    it('Open on focus', async function()
    {
        await ensureBehaviourSettings({
            showDropdownOnFocus: true,
            showDropdownOnClick: false,
        });

        const loginsCount = 2;
        webserver.setLogins(loginsCount);

        // Open login page
        const page = await openLoginPage('Default');

        // Check if the dropdown is NOT there yet
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown is already there').to.eventually.be.rejected;

        // Find the input field and focus it
        const usernameInput = await findUsernameField(page);
        await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

        // Check if there is a dropdown with logins
        const logins = await findLogins(page);
        expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);
        
        // Close the page
        await page.close();
    });

    it('Open on click', async function()
    {
        await ensureBehaviourSettings({
            showDropdownOnFocus: false,
            showDropdownOnClick: true,
        });

        const loginsCount = 2;
        webserver.setLogins(loginsCount);

        // Open login page
        const page = await openLoginPage('Default');

        // Check if the dropdown is NOT there yet
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown is already there').to.eventually.be.rejected;

        // Find the input field and focus it
        const usernameInput = await findUsernameField(page);
        await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

        // Check if there is a dropdown with logins
        const logins = await findLogins(page);
        expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

        // Close the page
        await page.close();
    });

    it('Disabled open on focus or click', async function()
    {
        await ensureBehaviourSettings({
            showDropdownOnFocus: false,
            showDropdownOnClick: false,
        });

        const loginsCount = 2;
        webserver.setLogins(loginsCount);

        // Open login page
        const page = await openLoginPage('Default');

        // Check if the dropdown is NOT there yet
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown is already there').to.eventually.be.rejected;

        // Find the input field and focus it
        const usernameInput = await findUsernameField(page);
        await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

        // Check if the dropdown is still NOT there
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown is already there').to.eventually.be.rejected;

        // Close the page
        await page.close();
    });
});
