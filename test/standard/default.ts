import { expect } from "chai";
import { ensureBehaviourSettings, findLogins, findUsernameField } from '../Helpers';
import { openLoginPage, validateLoginResult, webserver } from "./_init";

it('99 logins', async function()
{
    const loginsCount = 99, useLoginIndex = 42;
    webserver.setLogins(loginsCount, [42]);

    // Open login page
    const page = await openLoginPage();

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
    const page = await openLoginPage();

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
    const page = await openLoginPage();

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
