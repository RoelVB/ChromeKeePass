import { expect } from "chai";
import { ILogin } from "mock-keepasshttp/src/server/setup";
import { sleep } from "../Helpers";
import { ensureBehaviourSettings, findLogins, findUsernameField } from '../Helpers';
import { openLoginPage, validateLoginResult, webserver } from "./_init";

describe('Keyboard control', function()
{
    it('Autocomplete', async function()
    {
        await ensureBehaviourSettings({
            autoComplete: true,
            showDropdownOnClick: false,
            showDropdownOnFocus: false,
        });

        const loginsCount = 5, testLogin: ILogin = {uuid: 'target', name: 'Target login', username: 'targetuser', password: 'P@ssword'};
        webserver.setLogins(loginsCount, undefined, [testLogin]);

        // Open login page
        const page = await openLoginPage('Default');

        // Is there an input field?
        const usernameInput = await findUsernameField(page);
        await expect(usernameInput.click(), 'Failed to select username field').to.eventually.be.fulfilled;
        await usernameInput.press('ArrowDown');

        // Check the expected number of logins
        let logins = await findLogins(page);
        expect(logins.length, `Expected ${loginsCount+1} logins`).to.be.equals(loginsCount+1);

        // Try finding the login by name
        usernameInput.type(testLogin.name);
        await sleep(1000); // Wait for to autocomplete to filter
        logins = await findLogins(page);
        expect(logins.length, `Expected ${1} logins`).to.be.equals(1);

        // Clear the username input
        await usernameInput.evaluate(input=>input.value = '');
        await usernameInput.press('Backspace');
        await sleep(1000); // Give it a second to reset

        // Check if the dropdown got reset
        logins = await findLogins(page);
        expect(logins.length, `Expected ${loginsCount+1} logins`).to.be.equals(loginsCount+1);

        // Try finding the login by username
        usernameInput.type(testLogin.username);
        await sleep(1000); // Wait for to autocomplete to filter
        logins = await findLogins(page);
        expect(logins.length, `Expected as single login`).to.be.equals(1);

        // Select the login and Enter
        await logins[0].click();
        await usernameInput.press('Enter');

        // Check if login was successful
        await validateLoginResult(page);

        // Close the page
        await page.close();
    });

    it('Open/Close dropdown (by ArrowDown and Esc)', async function()
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

        // Check if the dropdown is still NOT there yet
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown is already there').to.eventually.be.rejected;

        // Try opening the dropdown
        await usernameInput.press('ArrowDown');

        // Check if there is a dropdown with logins
        const logins = await findLogins(page);
        expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

        // Try closing it
        await usernameInput.press('Escape');

        // Check if the dropdown closed
        await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 1000}), 'The CKP dropdown didn\'t close').to.eventually.be.rejected;
        
        // Close the page
        await page.close();
    });

    it('Select login (by ArrowDown and Enter)', async function()
    {
        const loginsCount = 5, validLoginIndex = 3;
        webserver.setLogins(loginsCount, [validLoginIndex]);

        // Open login page
        const page = await openLoginPage('Default');

        // Find the input field and focus it
        const usernameInput = await findUsernameField(page);
        await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

        // Select the correct login
        for(let i=-1; i<=validLoginIndex; i++)
            await usernameInput.press('ArrowDown');
        await usernameInput.press('Enter');

        // Check if login was successful
        await validateLoginResult(page);

        // Close the page
        await page.close();
    });
});
