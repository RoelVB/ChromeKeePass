import { expect } from "chai";
import { ElementHandle, Page } from "puppeteer";
import { browser } from "./test";

export const sleep = (ms: number)=>new Promise(r=>setTimeout(r, ms));

export const findUsernameField = async (page: Page): Promise<ElementHandle<HTMLInputElement>> =>
{
    return await expect(page.waitForSelector('input[name="username"]', {timeout: 2000}), 'Username field not found').to.eventually.be.fulfilled;
};

export const findPasswordField = async (page: Page): Promise<ElementHandle<HTMLInputElement>> =>
{
    return await expect(page.waitForSelector('input[name="password"]', {timeout: 2000}), 'Password field not found').to.eventually.be.fulfilled;
};

/** Find logins in the CKP dropdown */
export const findLogins = async (page: Page): Promise<ElementHandle<HTMLDivElement>[]> =>
{
    const dropdown: ElementHandle<HTMLDivElement> = await expect(page.waitForSelector('div[id^="ckpInput-"]', {timeout: 2000}), 'Failed to find CKP dropdown').to.eventually.be.fulfilled;
    return await expect(dropdown.$$('div[tabindex="0"]'), 'Failed to find logins').to.eventually.be.fulfilled;
};

export const ensureBehaviourSettings = async (...args: Parameters<typeof browser['ensureBehaviourSettings']>) =>
{
    await expect(browser.ensureBehaviourSettings(...args), 'Failed to ensure options').to.eventually.be.fulfilled;
};
