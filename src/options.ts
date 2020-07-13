import * as $ from 'jquery-slim';
import Client from './classes/BackgroundClient';
import { ISettings, defaultSettings } from './ISettings';

$(document).ready(()=>{
    loadSettings();
    getExtensionCommands();

    Client.testAssociate().then((association)=>{
        if(association.Associated)
            $('#connectionStatus').text(`Connected as '${association.Id}'`);
        else
        {
            const associateButton = $('<button>').text('Connect').click(associate);
            $('#connectionStatus').text('Not connected ').append(associateButton);
        }
    }).catch((error)=>{
        console.error(error);
        $('#connectionStatus').text('Something went wrong... is KeePass running and is the KeePassHttp plugin installed?');
    });

    $('#save').click(saveSettings);
});

function associate()
{
    $('#connectionStatus').text('Waiting for confirmation... (check if a KeePass window opened)');

    Client.associate().then((association)=>{
        if(association.Associated)
            $('#connectionStatus').text(`Connected as '${association.Id}'`);
        else
        {
            const associateButton = $('<button>').text('Connect').click(associate);
            $('#connectionStatus').text('Not connected ').append(associateButton);
        }
    }).catch((error)=>{
        $('#connectionStatus').text(error);
    });
}

/**
 * Method called when settings need to be loaded
 */
function loadSettings()
{
    chrome.storage.sync.get(defaultSettings, (items)=>{
        $('#showUsernameIcon').prop('checked', (items as ISettings).showUsernameIcon);
        $('#showDropdownOnFocus').prop('checked', (items as ISettings).showDropdownOnFocus);
        $('#autoFillSingleCredential').prop('checked', (items as ISettings).autoFillSingleCredential);
        $('#autoComplete').prop('checked', (items as ISettings).autoComplete);
    });
}

/**
 * Method called when save button is pressed
 */
function saveSettings()
{
    chrome.storage.sync.set({
        showUsernameIcon: $('#showUsernameIcon').prop('checked'),
        showDropdownOnFocus: $('#showDropdownOnFocus').prop('checked'),
        autoFillSingleCredential: $('#autoFillSingleCredential').prop('checked'),
        autoComplete: $('#autoComplete').prop('checked'),
    } as ISettings, ()=>{
        $('#saveStatus').text('Options saved');
        setTimeout(()=>$('#saveStatus').text(''), 1500);
    });
}

/**
 * Get extension commands/shortcuts
 */
async function getExtensionCommands()
{
    const commands = await Client.getExtensionCommands();
    $('#shortcuts').empty();

    commands.forEach((command)=>{
        if(command.description)
            $('#shortcuts').append($('<div>').text(`${command.description}: ${command.shortcut}`));
    });
}
