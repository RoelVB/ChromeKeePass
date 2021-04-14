import * as $ from 'jquery-slim';
import Client from './classes/BackgroundClient';
import { loadSettings, saveSettings } from './Settings';

$(()=>{
    fillSettings();
    // noinspection JSIgnoredPromiseFromCall
    getExtensionCommands();

    Client.testAssociate().then((association)=>{
        if(association.Associated)
            $('#connectionStatus').text(`Connected as '${association.Id}'`);
        else
        {
            const associateButton = $('<button>').text('Connect').on('click', associate).css({
                'margin-left': '10px'
            });
            $('#connectionStatus').text('Not connected ').append(associateButton);
        }
    }).catch((error)=>{
        console.error(error);
        $('#connectionStatus').text('Something went wrong... is KeePass running and is the KeePassHttp plugin installed?');
    });

    $('#save').on('click', doSave);
    if (navigator.userAgent.indexOf('Edg/') !== -1) // Edge doesn't support closing
        $('#cancel').remove();
    else
        $('#cancel').on('click', closeOptionDialog);
    $('#openShortcuts').on('click', openShortcuts);
});

function associate()
{
    $('#connectionStatus').text('Waiting for confirmation... (check if a KeePass window opened)');

    Client.associate().then((association)=>{
        if(association.Associated)
            $('#connectionStatus').text(`Connected as '${association.Id}'`);
        else
        {
            const associateButton = $('<button>').text('Connect').on('click', associate);
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
        $('#showDropdownOnDetectionFocus').prop('checked', settings.showDropdownOnDetectionFocus);
        $('#showDropdownOnClick').prop('checked', settings.showDropdownOnClick);
        $('#autoFillSingleCredential').prop('checked', settings.autoFillSingleCredential);
        $('#searchForInputsOnUpdate').prop('checked', settings.searchForInputsOnUpdate);
        $('#autoComplete').prop('checked', settings.autoComplete);
        $('#keePassHost').val(settings.keePassHost);
        $('#keePassPort').val(settings.keePassPort);
        $('#enableDropdownFooter').prop('checked', settings.theme.enableDropdownFooter);
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
        showDropdownOnDetectionFocus: $('#showDropdownOnDetectionFocus').prop('checked'),
        showDropdownOnClick: $('#showDropdownOnClick').prop('checked'),
        autoFillSingleCredential: $('#autoFillSingleCredential').prop('checked'),
        searchForInputsOnUpdate: $('#searchForInputsOnUpdate').prop('checked'),
        autoComplete: $('#autoComplete').prop('checked'),
        keePassHost: $('#keePassHost').val() as string,
        keePassPort: parseInt($('#keePassPort').val() as any),
        theme: {
            enableDropdownFooter: $('#enableDropdownFooter').prop('checked'),
        },
    }).then(() => {
        const saveStatus = $('#saveStatus');
        saveStatus.text('Options saved');
        setTimeout(() => saveStatus.text(''), 1500);
    });
}

/**
 * Close the options dialog.
 */
function closeOptionDialog() {
    window.close();
}

/**
 * Open the Chrome shortcut manager in a new tab.
 */
function openShortcuts() {
    chrome.tabs.create({
        url: 'chrome://extensions/shortcuts'
    })
}

/**
 * Get extension commands/shortcuts
 */
async function getExtensionCommands()
{
    const commands = await Client.getExtensionCommands();
    $('#shortcuts').empty();

    commands.forEach((command)=>{
        if(command.description) {
            $('#shortcuts').append($('<div>').text(`${command.description}: ${command.shortcut || '<Unassigned>'}`));
        }
    });
}
