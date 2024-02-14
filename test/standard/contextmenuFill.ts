import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { findLogins, findPasswordField, findUsernameField } from "../Helpers";
import { openLoginPage, validateLoginResult, webserver } from "./_init";
import { MenuItems } from '../../src/classes/ContextMenu';
import * as IMessage from '../../src/IMessage';
import type { ILogin } from "mock-keepasshttp/src";

async function runTest(page: Page, action: MenuItems, selector?: 'user'|'pass', selectLoginIndex: number = 0, validateLogin?: ILogin)
{
    // Find the input fields
    const usernameInput = await findUsernameField(page);
    const passwordInput = await findPasswordField(page);

    // Open the contextmenu so CKP knows which field was clicked
    if(selector === 'user')
        await usernameInput.click({button: 'right'});
    else if(selector === 'pass')
        await passwordInput.click({button: 'right'});
    else
        await page.click('body', {button: 'right'});

    // Call the contextmenu method
    switch(action)
    {
        case MenuItems.FILL_USER:
            await page.evaluate((msgData)=>{
                window.postMessage(msgData);
            }, {type: IMessage.RequestType.contextMenuFillUser} as IMessage.Request);
            break;
        case MenuItems.FILL_PASS:
            await page.evaluate((msgData)=>{
                window.postMessage(msgData);
            }, {type: IMessage.RequestType.contextMenuFillPass} as IMessage.Request);
            break;
        case MenuItems.FILL_USER_PASS:
            await page.evaluate((msgData)=>{
                window.postMessage(msgData);
            }, {type: IMessage.RequestType.contextMenuFillUserPass} as IMessage.Request);
            break;
        default:
            throw `Unknown menuitem "${action}"`;
    }

    // Wait for picker banner ot open
    const pickerBanner: ElementHandle<HTMLDivElement> = await expect(page.waitForSelector('#ckpEmbeddedPicker'), 'Picker banner not found').to.eventually.be.fulfilled;

    // Find and select login
    const logins = await findLogins(page);
    expect(logins.length, `Expected at least ${selectLoginIndex+1} logins`).to.be.greaterThan(selectLoginIndex);
    await logins[selectLoginIndex].click();

    // Select inputs when needed
    if(action === MenuItems.FILL_USER && !selector)
    {
        // Wait for "select field" prompt and select the field
        await pickerBanner.waitForSelector('xpath///div[contains(., "username")]', {timeout: 2000});
        await usernameInput.click();
    }
    else if(action === MenuItems.FILL_PASS && !selector)
    {
        // Wait for "select field" prompt and select the field
        await pickerBanner.waitForSelector('xpath///div[contains(., "password")]', {timeout: 2000});
        await passwordInput.click();
    }
    else if(action === MenuItems.FILL_USER_PASS)
    {
        if(!selector)
        {
            // Wait for "select field" prompt and select the field
            await pickerBanner.waitForSelector('xpath///div[contains(., "username")]', {timeout: 2000});
            await usernameInput.click();
        }
        // Wait for "select field" prompt and select the field
        await pickerBanner.waitForSelector('xpath///div[contains(., "password")]', {timeout: 2000});
        await passwordInput.click();
    }

    // Check input contents
    if(validateLogin)
    {
        if(action === MenuItems.FILL_USER || action === MenuItems.FILL_USER_PASS)
        {
            const usenameValue = await usernameInput.evaluate(el=>el.value);
            expect(usenameValue, 'Username field wasn\'t filled').to.equal(validateLogin.username);
        }
        if(action === MenuItems.FILL_PASS || action === MenuItems.FILL_USER_PASS)
        {
            const passwordValue = await passwordInput.evaluate(el=>el.value);
            expect(passwordValue, 'Password field wasn\'t filled').to.equal(validateLogin.password);
        }
    }

}

const testLogin: ILogin = {name: 'Testuser', uuid: '1337', username: 'Contextmenutest', password: 'Contextmenupass'};

describe('Contextmenu fill', async function(){

    it('Fill user - Triggered on field', async function()
    {
        webserver.setLogins(5, undefined, [testLogin]);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_USER, 'user', 5, testLogin);

        // Close the page
        await page.close();
    });

    it('Fill user - Without field clicked', async function()
    {
        webserver.setLogins(5, undefined, [testLogin]);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_USER, undefined, 5, testLogin);

        // Close the page
        await page.close();
    });

    it('Fill password - Triggered on field', async function()
    {
        webserver.setLogins(5, undefined, [testLogin]);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_PASS, 'pass', 5, testLogin);

        // Close the page
        await page.close();
    });

    it('Fill password - Without field clicked', async function()
    {
        webserver.setLogins(5, undefined, [testLogin]);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_PASS, undefined, 5, testLogin);

        // Close the page
        await page.close();
    });

    it('Fill user + password - Triggered on field', async function()
    {
        webserver.setLogins(5);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_USER_PASS, 'user');

        // Login and check if it was successful
        const passwordInput = await findPasswordField(page);
        await passwordInput.press('Enter');
        await validateLoginResult(page);

        // Close the page
        await page.close();
    });

    it('Fill user + password - Without field clicked', async function()
    {
        webserver.setLogins(5);

        // Open login page
        const page = await openLoginPage('TextOnly');

        await runTest(page, MenuItems.FILL_USER_PASS);

        // Login and check if it was successful
        const passwordInput = await findPasswordField(page);
        await passwordInput.press('Enter');
        await validateLoginResult(page);

        // Close the page
        await page.close();
    });

});
