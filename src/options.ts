import * as $ from 'jquery-slim';
import Client from './classes/BackgroundClient';
import { ISettings, loadSettings, saveSettings } from './Settings';

$(document).ready(()=>{
    fillSettings();
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

    $('#save').click(doSave);
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
function fillSettings()
{
    loadSettings().then((settings)=>{
        $('#showUsernameIcon').prop('checked', settings.showUsernameIcon);
        $('#showDropdownOnFocus').prop('checked', settings.showDropdownOnFocus);
        $('#autoFillSingleCredential').prop('checked', settings.autoFillSingleCredential);
        $('#autoComplete').prop('checked', settings.autoComplete);
        $('#keePassHost').val(settings.keePassHost);
        $('#keePassPort').val(settings.keePassPort);
    });
}

/**
 * Method called when save button is pressed
 */
function doSave()
{
    saveSettings({
        showUsernameIcon: $('#showUsernameIcon').prop('checked'),
        showDropdownOnFocus: $('#showDropdownOnFocus').prop('checked'),
        autoFillSingleCredential: $('#autoFillSingleCredential').prop('checked'),
        autoComplete: $('#autoComplete').prop('checked'),
        keePassHost: $('#keePassHost').val() as string,
        keePassPort: parseInt($('#keePassPort').val() as any),
    }).then(()=>{
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
