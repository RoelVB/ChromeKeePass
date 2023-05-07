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
export const debug = process.argv.includes('--debug') || Boolean(Number(process.env.RUNNER_DEBUG));
const skipStandard = process.argv.includes('--skipStandard');
const includeSites = process.argv.find(f=>f.startsWith('--includeSites'))?.substring(15).split(',').filter(f=>f); // Parse "--includeSites=Google,Microsoft" to array "['Google','Microsoft']"

// Make screenshot directory
try {
    fs.mkdirSync('./test/screenshots');
} catch(error) {
    // ignore error
}

if(debug)
{
    beforeEach(function(){
        console.log(`Starting test: ${this.currentTest?.title}`);
    });
}

describe('ChromeKeePass', function(){
    this.slow('10s');

    before('Setup Mock-KeePassHttp', async function(){
        if(debug) console.log('Starting Mock-KeePassHttp setup');
        this.timeout('10s'); // Starting and setting up Mock-KeePassHttp should not take more than 10 seconds

        await expect(MockKeePassHttp.start(!debug), 'Failed to start Mock-KeePassHttp').to.be.eventually.fulfilled;
        await expect(MockKeePassHttp.autoSetup(), 'Failed to setup Mock-KeePassHttp').to.be.eventually.fulfilled;

    });

    before('Start browser', async function(){
        this.timeout('30s');

        // Start the browser
        if(debug) console.log('Starting browser');
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
        if(browser?.isConnected())
        {
            if(debug) console.log('Closing browser');
            browser.close();
        }
        else if(browser?.process())
        {
            if(debug) console.log('Kill browser process');
            browser.process()?.kill();
        }
        else
        {
            if(debug) console.log('Browser already closed (unexpectedly)');
            setTimeout(() => process.exit(1234), 10000); // We exit the test process after 10 seconds in this unusual situation, because if the browser is actually open the test process will freeze
        }
    });

    after('Close Mock-KeePassHttp', async function(){
        if(debug) console.log('Closing Mock-KeePassHttp');
        MockKeePassHttp.close();
    });

});
