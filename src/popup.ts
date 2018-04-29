import * as $ from 'jquery-slim';
import Client from './classes/BackgroundClient';

$(document).ready(()=>{
    $('#optionsIcon').click(()=>chrome.runtime.openOptionsPage());

    Client.testAssociate().then((association)=>{
        if(association.Associated)
            $('#connectionStatus').text('Connected');
        else
            $('#connectionStatus').text('Disconnected');
    }).catch(()=>{
        $('#connectionStatus').text('Disconnected');
    });
});
