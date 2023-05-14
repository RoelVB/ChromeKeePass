/*
 * Start the test webserver for manual testing
 */

import Webserver from './classes/Webserver';

(async ()=>{
    const port = Number(process.argv.find(f=>f.startsWith('--port'))?.substring(7));

    const server = await Webserver.start(isNaN(port)?undefined:port);

    console.log('Test URLs:');
    console.log('Default: ', server.getUrl('Default'));
    console.log('HiddenPassword: ', server.getUrl('HiddenPassword'));
    console.log('PasswordOnly: ', server.getUrl('PasswordOnly'));
    console.log('HiddenForm: ', server.getUrl('HiddenForm'));
    console.log('GeneratedForm: ', server.getUrl('GeneratedForm'));
})();
