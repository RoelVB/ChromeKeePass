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
    const rangeInputs = $('.range-input');
    rangeInputs.on('mouseover', (event) => {
        let valueBubble = event.delegateTarget.querySelector<HTMLElement>('.value-bubble');
        if (valueBubble) {
            valueBubble.style.visibility = 'visible';
        }
    });
    rangeInputs.on('mouseout', (event) => {
        let valueBubble = event.delegateTarget.querySelector<HTMLElement>('.value-bubble');
        if (valueBubble) {
            valueBubble.style.visibility = 'hidden';
        }
    });
    rangeInputs.on('input', (event) => {
        console.log('On Value')
        onRangeValueChange(event.delegateTarget);
    });
    setTimeout(() => {
        rangeInputs.each((_index, input) => onRangeValueChange(input));
    }, 100);
});

/**
 * Handle the value change of a range input.
 *
 * @param rangeInput The range input element that changed.
 */
function onRangeValueChange(rangeInput: HTMLElement) {
    const input = rangeInput.querySelector<HTMLInputElement>('input');
    if (!input) {
        return;
    }
    const value = parseInt(input.value);
    const percent = value / parseInt(input.max);
    input.style.setProperty('--percent', `${percent * 100}%`);
    let valueBubble = rangeInput.querySelector<HTMLElement>('.value-bubble');
    if (valueBubble) {
        valueBubble.textContent = `${value}`;
        console.log(`parent: ${input.offsetWidth}, bubble: ${valueBubble.offsetWidth}`);
        const knobSize = 10;
        const padding = 16;
        valueBubble.style.marginLeft = `${padding + knobSize / 2 + (input.offsetWidth - (
            padding * 2 + knobSize)) * (percent) - (valueBubble.offsetWidth / 2)}px`;
    }
}

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
        $('#dropdownSelectedItemColorStart').val(settings.theme.dropdownSelectedItemColorStart);
        $('#dropdownSelectedItemColorEnd').val(settings.theme.dropdownSelectedItemColorEnd);
        $('#dropdownBorderWidth').val(settings.theme.dropdownBorderWidth);
        $('#dropdownShadowWidth').val(settings.theme.dropdownShadowWidth);
        $('#dropdownItemPadding').val(settings.theme.dropdownItemPadding);
        $('#dropdownScrollbarColor').val(settings.theme.dropdownScrollbarColor);
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
            dropdownSelectedItemColorStart: $('#dropdownSelectedItemColorStart').val() as string,
            dropdownSelectedItemColorEnd: $('#dropdownSelectedItemColorEnd').val() as string,
            dropdownBorderWidth: $('#dropdownBorderWidth').val() as number,
            dropdownShadowWidth: $('#dropdownShadowWidth').val() as number,
            dropdownItemPadding: $('#dropdownItemPadding').val() as number,
            dropdownScrollbarColor: $('#dropdownScrollbarColor').val() as string,
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
