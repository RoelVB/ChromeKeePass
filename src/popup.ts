import Client from './classes/BackgroundClient';
import { onDocumentReady } from './classes/Constants';

onDocumentReady(()=>{
    document.getElementById('optionsIcon')?.addEventListener('click', ()=>chrome.runtime.openOptionsPage());

    Client.testAssociate().then((association)=>{
        if(association.Associated)
            document.getElementById('connectionStatus')!.textContent  = 'Connected';
        else
        document.getElementById('connectionStatus')!.textContent = 'Disconnected';
    }).catch(()=>{
        document.getElementById('connectionStatus')!.textContent  = 'Disconnected';
    });
});
