import { expect } from "chai";
import { ElementHandle } from "puppeteer";
import { ensureBehaviourSettings, findLogins, findPasswordField, findUsernameField, sleep } from '../Helpers';
import { openLoginPage, validateLoginResult, webserver } from "./_init";

it('99 logins', async function()
{
    const loginsCount = 99, useLoginIndex = 42;
    webserver.setLogins(loginsCount, [42]);

    // Open login page
    const page = await openLoginPage('Default');

    // Is there an input field?
    const usernameInput = await findUsernameField(page);
    await expect(usernameInput.click(), 'Failed to select username field').to.eventually.be.fulfilled;
    await usernameInput.press('ArrowDown');

    // Check the expected number of logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Select login and Enter
    await logins[useLoginIndex].click();
    await usernameInput.press('Enter');

    // Check if login was successful
    await validateLoginResult(page);

    // Close the page
    await page.close();
});

it('Single login - autofill', async function()
{
    await ensureBehaviourSettings({
        autoFillSingleCredential: true,
    });

    const loginsCount = 1;
    webserver.setLogins(loginsCount);

    // Open login page
    const page = await openLoginPage('Default');

    // Is there an input field?
    const usernameInput = await findUsernameField(page);
    await expect(usernameInput.click(), 'Failed to select username field').to.eventually.be.fulfilled;
    await usernameInput.press('Enter');

    // Check if login was successful
    await validateLoginResult(page);

    // Close the page
    await page.close();
});

it('Single login - NO autofill', async function()
{
    await ensureBehaviourSettings({
        autoFillSingleCredential: false,
    });

    const loginsCount = 1;
    webserver.setLogins(loginsCount);

    // Open login page
    const page = await openLoginPage('Default');

    // Is there an input field and is it empty?
    const usernameInput = await findUsernameField(page);
    expect(await usernameInput.evaluate(input=>input.value), 'Username field is not empty').to.be.empty;

    // Open the dropdown
    await expect(usernameInput.click(), 'Failed to select username field').to.eventually.be.fulfilled;
    await usernameInput.press('ArrowDown');

    // Check the expected number of logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Select login and Enter
    await logins[0].click();
    await usernameInput.press('Enter');

    // Check if login was successful
    await validateLoginResult(page);

    // Close the page
    await page.close();
});

it('Hidden password field', async function()
{
    await ensureBehaviourSettings({
        autoFillSingleCredential: false,
    });

    const loginsCount = 5;
    webserver.setLogins(loginsCount);

    // Open login page
    const page = await openLoginPage('HiddenPassword');

    // Is there an input field?
    const usernameInput = await findUsernameField(page);
    await expect(usernameInput.click(), 'Failed to select username field').to.eventually.be.fulfilled;
    await usernameInput.press('ArrowDown');

    // Check the expected number of logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Select login and Enter
    await logins[0].click();
    await usernameInput.press('Enter');

    // Check if login was successful
    await validateLoginResult(page);

    // Close the page
    await page.close();
});

it('Password only (no username)', async function()
{
    await ensureBehaviourSettings({
        autoFillSingleCredential: false,
    });

    const loginsCount = 1;
    webserver.setLogins(loginsCount, undefined, [{uuid: 'passonly', name: 'Pass only', username: '', password: 'P@ssword'}]);

    // Open login page
    const page = await openLoginPage('PasswordOnly');

    // Is there an input field?
    const passwordInput = await findPasswordField(page);
    await expect(passwordInput.click(), 'Failed to select password field').to.eventually.be.fulfilled;
    await passwordInput.press('ArrowDown');

    // Check the expected number of logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount+1} logins`).to.be.equals(loginsCount+1);

    // Select login and Enter
    await logins[loginsCount].click();
    await passwordInput.press('Enter');

    // Check if login was successful
    await validateLoginResult(page);

    // Close the page
    await page.close();
});

// TODO: Needs te be supported, currently isn't
it.skip('Hidden login form (becomes visible)', async function()
{
    await ensureBehaviourSettings({
        showDropdownOnFocus: true,
        showDropdownOnClick: true,
    });

    const loginsCount = 2;
    webserver.setLogins(loginsCount);

    // Open login page
    const page = await openLoginPage('HiddenForm');

    // Find the input field and try focusing it
    const usernameInput = await findUsernameField(page);
    await expect(usernameInput.click(), 'Username field should not be clickable').to.eventually.be.rejected;

    // Click show button
    const showButton: ElementHandle<HTMLButtonElement> = await expect(page.waitForSelector('#btnShowForm', {timeout: 1000}), 'Unable to find show button').to.eventually.be.fulfilled;
    await expect(showButton.click(), 'Failed to click show button').to.eventually.be.fulfilled;

    // Focus input field
    await sleep(2000); // Give CKP a few seconds to detect the field
    await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

    // Check if there is a dropdown with logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Close the page
    await page.close();
});

it('Async login form (gets created)', async function()
{
    await ensureBehaviourSettings({
        showDropdownOnFocus: true,
        showDropdownOnClick: true,
    });

    const loginsCount = 2;
    webserver.setLogins(loginsCount);

    // Open login page
    const page = await openLoginPage('GeneratedForm');

    // Username field should not exist
    await expect(page.waitForSelector('input[name="username"]', {timeout: 1000}), 'Didn\'t expect to find a username field').to.eventually.be.rejected;

    // Click generate button
    const generateButton: ElementHandle<HTMLButtonElement> = await expect(page.waitForSelector('#btnGenerateForm', {timeout: 1000}), 'Unable to find generate button').to.eventually.be.fulfilled;
    await expect(generateButton.click(), 'Failed to click generate button').to.eventually.be.fulfilled;

    // Find and focus input field
    await sleep(2000); // Give CKP a few seconds to detect the field
    const usernameInput = await findUsernameField(page);
    await expect(usernameInput.click(), 'Failed to focus username field').to.eventually.be.fulfilled;

    // Check if there is a dropdown with logins
    const logins = await findLogins(page);
    expect(logins.length, `Expected ${loginsCount} logins`).to.be.equals(loginsCount);

    // Close the page
    await page.close();
});
