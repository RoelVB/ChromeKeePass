import $ from 'jquery-slim';
import Client from './classes/BackgroundClient';
import {ConnectionType, ISettings, loadSettings, saveSettings} from './Settings';
import {MutexProtectedVariable} from './classes/MutexProtectedVariable';
import {Association} from './IMessage';

/** A view of the plugins association state with the KeePass database. */
interface AssociationState {
    /** The association id, if we are successfully associated. */
    id?: string;

    /** An error message, if the association or association test request failed. */
    error?: string

    /** A snapshot of the settings that are important for the connection that was used during association. */
    settings: any[]
}

/** A manager for the association state and UI in the options. */
class AssociationManager {
    /** The cached state of the association per connection type.  */
    private static _associationState = new Map<ConnectionType, MutexProtectedVariable<AssociationState>>();
    /** Whether the last request was an association request. */
    private static _lastRequestWasAssociate = false;

    /**
     * Request the association state or try to associate the client for the given settings and update the UI.
     * @param settings The currently active settings.
     * @param doAssociate Whether to try to associate or just check the association state.
     */
    static updateAssociationState(settings: ISettings, doAssociate?: boolean) {
        const connectionType = settings.connectionType;
        const pluginSettings = AssociationManager._getPluginSettings(connectionType, settings);
        let associationState = AssociationManager._associationState.get(connectionType);
        if (!associationState) {
            associationState = new MutexProtectedVariable(() => ({settings: pluginSettings} as AssociationState));
            AssociationManager._associationState.set(connectionType, associationState);
        }
        associationState.set(async (): Promise<AssociationState> => {
            AssociationManager._lastRequestWasAssociate = doAssociate === true;
            $('#connectionStatus').text(doAssociate ?
                'Waiting for confirmation... (check if a KeePass window opened)' : 'Getting status...');
            $('#connectButton').hide();
            $('#saveAndCheckButton').hide();
            $('#retryConnectionButton').hide();
            $('#checkConnectionButton').hide();
            let association: Association;
            try {
                association = await (doAssociate ? Client.associate() : Client.testAssociate());
            } catch (error) {
                console.error(error);
                let pluginName: string;
                switch (connectionType) {
                    case ConnectionType.HTTP:
                        pluginName = 'KeePassHttp';
                        break
                    case ConnectionType.Native:
                        pluginName = 'KeePassNatMsg';
                        break
                }
                return {
                    error: `Something went wrong... is KeePass running and is the ${pluginName} plugin installed?`,
                    settings: pluginSettings,
                }
            }
            return {
                id: association.Associated? association.Id : undefined,
                error: association.Error,
                settings: pluginSettings,
            }
        }).finally(AssociationManager.updateUiForCurrentState);
    }

    /** Retry the last request, which was either an association or test request. */
    static retryLastRequest() {
        loadSettings().then((settings) => AssociationManager.updateAssociationState(
            settings, AssociationManager._lastRequestWasAssociate));
    }

    /** Update the UI for the current association state and the users' selection. */
    static updateUiForCurrentState() {
        loadSettings().then(async (settings) => {
            const selectedConnectionType = ConnectionType[$('#connectionType').val() as keyof typeof ConnectionType];
            const associationState = await AssociationManager._associationState.get(selectedConnectionType)?.get();
            const pluginSettings = AssociationManager._getPluginSettings(selectedConnectionType);
            const connectionStatus = $('#connectionStatus');
            const connectButton = $('#connectButton');
            const saveAndCheckButton = $('#saveAndCheckButton');
            const retryConnectionButton = $('#retryConnectionButton');
            const checkConnectionButton = $('#checkConnectionButton')
            if (!associationState) {
                const haveSettingChanges = selectedConnectionType !== settings.connectionType;
                checkConnectionButton.toggle(!haveSettingChanges);
                connectButton.hide();
                saveAndCheckButton.toggle(haveSettingChanges);
                retryConnectionButton.hide();
                connectionStatus.text('');
            } else {
                const haveSettingChanges = selectedConnectionType !== settings.connectionType ||
                    !AssociationManager._arrayEquals(pluginSettings, associationState.settings);
                if (associationState.error) {
                    connectionStatus.text(associationState.error);
                    checkConnectionButton.hide();
                    connectButton.hide();
                    saveAndCheckButton.toggle(haveSettingChanges);
                    retryConnectionButton.toggle(!haveSettingChanges);
                } else if (associationState.id) {
                    connectionStatus.text(`Connected as '${associationState.id}'`);
                    checkConnectionButton.hide();
                    connectButton.hide();
                    // If we already know about our association state after switching to another connection type,
                    // we don't want to show the save and check button. The user can use the normal save button instead.
                    saveAndCheckButton.toggle(
                        !AssociationManager._arrayEquals(pluginSettings, associationState.settings));
                    retryConnectionButton.hide();
                } else {
                    connectionStatus.text('Not connected');
                    checkConnectionButton.hide();
                    connectButton.toggle(!haveSettingChanges);
                    saveAndCheckButton.toggle(haveSettingChanges);
                    retryConnectionButton.hide();
                }
            }
        }).catch((error) => console.warn(`Failed to update association UI: ${error}`));
    }

    /**
     * Get the setting values that are important for the given connection type.
     * @param connectionType The connection type.
     * @param settings If given, the values are taken from these settings, otherwise they are loaded from the UI.
     * @returns The important setting values for the connection type.
     */
    private static _getPluginSettings(connectionType: ConnectionType, settings?: ISettings): any[] {
        switch (connectionType) {
            case ConnectionType.HTTP:
                return settings ?
                    [settings.keePassHost, settings.keePassPort] :
                    [$('#keePassHost').val() as string, parseInt($('#keePassPort').val() as any)];
            case ConnectionType.Native:
                return settings ?
                    [settings.keePassNativeAppId] :
                    [$('#keePassNativeAppId').val() as string];
        }
    }

    /**
     * Check whether the two arrays are equal (have the same length and contain the same values).
     * @param firstArray The first array to compare against.
     * @param secondArray The other array to compare the first against.
     * @returns Whether both arrays are equal.
     */
    private static _arrayEquals(firstArray: any[], secondArray: any[]): boolean {
        return firstArray.length === secondArray.length &&
            firstArray.every((element, index) => element === secondArray[index]);
    }
}

$(()=>{
    fillSettings();
    getExtensionCommands().catch(error => console.warn(`Failed to get extension commands: ${error}`));

    $('#connectButton').on('click', () => loadSettings().then(
        (settings) => AssociationManager.updateAssociationState(settings, true)));
    $('#saveAndCheckButton').on('click', doSave);
    $('#retryConnectionButton').on('click', AssociationManager.retryLastRequest);
    $('#checkConnectionButton').on('click', () => loadSettings().then(AssociationManager.updateAssociationState));
    $('#save').on('click', doSave);
    if (navigator.userAgent.indexOf('Edg/') !== -1) // Edge doesn't support closing
        $('#cancel').remove();
    else
        $('#cancel').on('click', closeOptionDialog);
    $('#openShortcuts').on('click', openShortcuts);

    const connectionTypeSelect = $('#connectionType');
    connectionTypeSelect.on('change', () => {
        _updateUiForConnectionType(ConnectionType[connectionTypeSelect.val() as keyof typeof ConnectionType]);
    });
    $('#keePassHost').on('input', AssociationManager.updateUiForCurrentState);
    $('#keePassPort').on('input', AssociationManager.updateUiForCurrentState);
    $('#keePassNativeAppId').on('input', AssociationManager.updateUiForCurrentState);

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
        const knobSize = 10;
        const padding = 16;
        valueBubble.style.marginLeft = `${padding + knobSize / 2 + (input.offsetWidth - (
            padding * 2 + knobSize)) * (percent) - (valueBubble.offsetWidth / 2)}px`;
    }
}

/**
 * Update the UI components when the connection type changes.
 * @param connectionType The new connection type.
 */
function _updateUiForConnectionType(connectionType: ConnectionType) {
    $('#keePassHttpOptions').toggle(connectionType === ConnectionType.HTTP);
    $('#keePassNativeOptions').toggle(connectionType === ConnectionType.Native);
    AssociationManager.updateUiForCurrentState();
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
        $('#connectionType').val(settings.connectionType.valueOf());
        $('#keePassNativeAppId').val(settings.keePassNativeAppId);
        AssociationManager.updateAssociationState(settings);
        _updateUiForConnectionType(settings.connectionType);
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
        connectionType: ConnectionType[$('#connectionType').val() as keyof typeof ConnectionType],
        keePassNativeAppId: $('#keePassNativeAppId').val() as string,
    }).then(() => {
        const saveStatus = $('#saveStatus');
        saveStatus.text('Options saved');
        setTimeout(() => saveStatus.text(''), 1500);
        loadSettings().then(AssociationManager.updateAssociationState);
    });
}

/**
 * Close the "Options" dialog.
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
    }).catch((reason) => console.error(`Failed to open shortcuts: ${reason}`));
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
