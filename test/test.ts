import fs from 'fs';
import 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Browser from './classes/Browser';
import MockKeePassHttp from './classes/MockKeePassHttp';

chai.use(chaiAsPromised);
chai.config.truncateThreshold = 0; // disable truncating

export let browser: Awaited<ReturnType<typeof Browser.launch>>;

// CLI arguments
const skipStandard = process.argv.includes('--skipStandard');
const includeSites = process.argv.find(f=>f.startsWith('--includeSites'))?.substring(15).split(',').filter(f=>f); // Parse "--includeSites=Google,Microsoft" to array "['Google','Microsoft']"

// Make screenshot directory
try {
    fs.mkdirSync('./test/screenshots');
} catch(error) {
    // ignore error
}

describe('ChromeKeePass', function(){
    this.slow('10s');

    before('Setup Mock-KeePassHttp', async function(){
        this.timeout('10s'); // Starting and setting up Mock-KeePassHttp should not take more than 10 seconds

        await expect(MockKeePassHttp.start(), 'Failed to start Mock-KeePassHttp').to.be.eventually.fulfilled;
        await expect(MockKeePassHttp.autoSetup(), 'Failed to setup Mock-KeePassHttp').to.be.eventually.fulfilled;

    });

    before('Start browser', async function(){
        // Start the browser
        browser = await expect(Browser.launch()).to.eventually.be.fulfilled;
    });

    // Setup ChromeKeePass
    require('./setup');

    // Test different settings
    (skipStandard ? describe.skip : describe)('Standard tests', function(){
        this.timeout('15s');

        // Run all files inside `./test/sites`
        fs.readdirSync('./test/standard').forEach(file=>require(`./standard/${file}`));
    });

    // Test some sites (if enabled through the CLI parameter `--includeSites`)
    (includeSites ? describe : describe.skip)('Test sites', function(){
        this.timeout('30s');

        // Run files inside `./test/sites`
        fs.readdirSync('./test/sites').forEach(file=>{
            const siteName = file.substring(0, file.length-3);

            if(!includeSites?.length || includeSites.includes(siteName)) // Check if this site is included in the CLI argument
                require(`./sites/${file}`);
            else
                it.skip(siteName);
        });
    });

    after('Close browser', async function(){
        await browser?.close();
    });

    after('Close Mock-KeePassHttp', async function(){
        MockKeePassHttp.close();
    });

});
