import Client from './classes/BackgroundClient';
import { onDocumentReady } from './classes/Constants';
import { loadSettings, saveSettings } from './Settings';
import { mount as mountOptions } from './components/Options/Options';

// Mount React options component
mountOptions(document.getElementById('root')!, {});

// onDocumentReady(()=>{
//     fillSettings();
//     getExtensionCommands();

//     Client.testAssociate().then((association)=>{
//         const connectionStatus = document.getElementById('connectionStatus')!;

//         if(association.Associated)
//             connectionStatus.textContent = `Connected as '${association.Id}'`;
//         else
//         {
//             const associateButton = document.createElement('button');
//             associateButton.textContent = 'Connect';
//             associateButton.style.marginLeft = '10px';
//             associateButton.addEventListener('click', associate);

//             connectionStatus.textContent = 'Not connected';
//             connectionStatus.append(associateButton);
//         }
//     }).catch((error)=>{
//         console.error(error);
//         document.getElementById('connectionStatus')!.textContent = 'Something went wrong... is KeePass running and is the KeePassHttp plugin installed?';
//     });

//     document.getElementById('save')?.addEventListener('click', doSave);
//     document.getElementById('openShortcuts')?.addEventListener('click', openShortcuts);

//     const rangeInputs = document.querySelectorAll<HTMLElement>('.range-input');
//     rangeInputs.forEach(rangeInput=>{
//         rangeInput.addEventListener('input', ev=>{
//             onRangeValueChange(ev.currentTarget as HTMLElement);
//         });
//     });

//     setTimeout(() => {
//         rangeInputs.forEach(rangeInput=>onRangeValueChange(rangeInput));
//     }, 100);
// });

// /**
//  * Handle the value change of a range input.
//  *
//  * @param rangeInput The range input element that changed.
//  */
// function onRangeValueChange(rangeInput: HTMLElement) {
//     const input = rangeInput.querySelector<HTMLInputElement>('input');
//     if (!input) {
//         return;
//     }
//     const value = parseInt(input.value);
//     const percent = value / parseInt(input.max);
//     input.style.setProperty('--percent', `${percent * 100}%`);
//     let valueBubble = rangeInput.querySelector<HTMLElement>('.value-bubble');
//     if (valueBubble) {
//         valueBubble.textContent = `${value}`;
//         const knobSize = 10;
//         const padding = 16;
//         valueBubble.style.marginLeft = `${padding + knobSize / 2 + (input.offsetWidth - (
//             padding * 2 + knobSize)) * (percent) - (valueBubble.offsetWidth / 2)}px`;
//     }
// }

// function associate()
// {
//     const connectionStatus = document.getElementById('connectionStatus')!;
//     connectionStatus.textContent = 'Waiting for confirmation... (check if a KeePass window opened)';

//     Client.associate().then((association)=>{
//         if(association.Associated)
//             connectionStatus. textContent = `Connected as '${association.Id}'`;
//         else
//         {
//             const associateButton = document.createElement('button');
//             associateButton.textContent = 'Connect';
//             associateButton.addEventListener('click', associate);
//             connectionStatus.textContent = 'Not connected ';
//             connectionStatus.append(associateButton);
//         }
//     }).catch((error)=>{
//         connectionStatus.textContent = error;
//     });
// }

// /**
//  * Method called when settings need to be loaded
//  */
// function fillSettings()
// {
//     loadSettings().then((settings)=>{
//         document.querySelector<HTMLInputElement>('#showUsernameIcon')!.checked = settings.showUsernameIcon;
//         document.querySelector<HTMLInputElement>('#showDropdownOnFocus')!.checked = settings.showDropdownOnFocus;
//         document.querySelector<HTMLInputElement>('#showDropdownOnDetectionFocus')!.checked = settings.showDropdownOnDetectionFocus;
//         document.querySelector<HTMLInputElement>('#showDropdownOnClick')!.checked = settings.showDropdownOnClick;
//         document.querySelector<HTMLInputElement>('#autoFillSingleCredential')!.checked = settings.autoFillSingleCredential;
//         document.querySelector<HTMLInputElement>('#searchForInputsOnUpdate')!.checked = settings.searchForInputsOnUpdate;
//         document.querySelector<HTMLInputElement>('#autoComplete')!.checked = settings.autoComplete;
//         document.querySelector<HTMLInputElement>('#keePassHost')!.value  = settings.keePassHost;
//         document.querySelector<HTMLInputElement>('#keePassPort')!.value = String(settings.keePassPort);
//         document.querySelector<HTMLInputElement>('#enableDropdownFooter')!.checked = settings.theme.enableDropdownFooter;
//         document.querySelector<HTMLInputElement>('#dropdownSelectedItemColorStart')!.value = settings.theme.dropdownSelectedItemColorStart;
//         document.querySelector<HTMLInputElement>('#dropdownSelectedItemColorEnd')!.value = settings.theme.dropdownSelectedItemColorEnd;
//         document.querySelector<HTMLInputElement>('#dropdownBorderWidth')!.value = String(settings.theme.dropdownBorderWidth);
//         document.querySelector<HTMLInputElement>('#dropdownShadowWidth')!.value = String(settings.theme.dropdownShadowWidth);
//         document.querySelector<HTMLInputElement>('#dropdownItemPadding')!.value = String(settings.theme.dropdownItemPadding);
//         document.querySelector<HTMLInputElement>('#dropdownScrollbarColor')!.value = String(settings.theme.dropdownScrollbarColor);
//     });
// }

// /**
//  * Method called when save button is pressed
//  */
// function doSave()
// {
//     saveSettings({
//         showUsernameIcon: document.querySelector<HTMLInputElement>('#showUsernameIcon')?.checked,
//         showDropdownOnFocus: document.querySelector<HTMLInputElement>('#showDropdownOnFocus')?.checked,
//         showDropdownOnDetectionFocus: document.querySelector<HTMLInputElement>('#showDropdownOnDetectionFocus')?.checked,
//         showDropdownOnClick: document.querySelector<HTMLInputElement>('#showDropdownOnClick')?.checked,
//         autoFillSingleCredential: document.querySelector<HTMLInputElement>('#autoFillSingleCredential')?.checked,
//         searchForInputsOnUpdate: document.querySelector<HTMLInputElement>('#searchForInputsOnUpdate')?.checked,
//         autoComplete: document.querySelector<HTMLInputElement>('#autoComplete')?.checked,
//         keePassHost: document.querySelector<HTMLInputElement>('#keePassHost')?.value,
//         keePassPort: parseInt(document.querySelector<HTMLInputElement>('#keePassPort')?.value as any),
//         theme: {
//             enableDropdownFooter: document.querySelector<HTMLInputElement>('#enableDropdownFooter')?.checked!,
//             dropdownSelectedItemColorStart: document.querySelector<HTMLInputElement>('#dropdownSelectedItemColorStart')?.value!,
//             dropdownSelectedItemColorEnd: document.querySelector<HTMLInputElement>('#dropdownSelectedItemColorEnd')?.value!,
//             dropdownBorderWidth: parseInt(document.querySelector<HTMLInputElement>('#dropdownBorderWidth')?.value as any),
//             dropdownShadowWidth: parseInt(document.querySelector<HTMLInputElement>('#dropdownShadowWidth')?.value as any),
//             dropdownItemPadding: parseInt(document.querySelector<HTMLInputElement>('#dropdownItemPadding')?.value as any),
//             dropdownScrollbarColor: document.querySelector<HTMLInputElement>('#dropdownScrollbarColor')?.value!,
//         },
//     }).then(() => {
//         const saveStatus = document.getElementById('saveStatus')!;
//         saveStatus.textContent = 'Options saved';
//         setTimeout(() => saveStatus.textContent = '', 1500);
//     });
// }

// /**
//  * Open the Chrome shortcut manager in a new tab.
//  */
// function openShortcuts() {
//     chrome.tabs.create({
//         url: 'chrome://extensions/shortcuts'
//     })
// }

// /**
//  * Get extension commands/shortcuts
//  */
// async function getExtensionCommands()
// {
//     const commands = await Client.getExtensionCommands();
//     document.getElementById('shortcuts')!.innerHTML = '';

//     commands.forEach((command)=>{
//         if(command.description) {
//             const shortcut = document.createElement('div');
//             shortcut.textContent = `${command.description}: ${command.shortcut || '<Unassigned>'}`;
//             document.getElementById('shortcuts')!.append(shortcut);
//         }
//     });
// }
