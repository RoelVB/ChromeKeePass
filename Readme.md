# ChromeKeePass / EdgeKeePass

> Setup instructions below (or see [https://youtu.be/0cVEjYQXrHc](https://youtu.be/0cVEjYQXrHc))

ChromeKeePass/EdgeKeePass is an open source Chrome extension to automatically entering credentials into websites.

The extension depends on [KeePassHttp](https://github.com/pfn/keepasshttp), using this KeePass plugin we're able to create a secure communication between the browserextension and KeePass.

![Demo](Documents/Images/DemoMicrosoft.gif)

The goal of this project is to create a user-friendly KeePass integration. With an easily readable and understandable sourcecode.

## Features

- Automatically entering credentials from KeePass into your browser
- Autocomplete while typing in the username field
- More to come

## Setup

1. Make sure you have KeePassHttp installed. Instruction on [how to install](Documents/Manuals/KeePassHttp%20installation.md) KeePassHttp.

2. Make sure KeePass is running, and a password database is opened

3. Click the ChromeKeePass icon next to the address bar, it'll show 'Disconnected', click the gear to go to the options

   ![ChromeKeePass Popup](Documents/Images/CKPPopup.png)

4. The ChromeKeePass options open, click the `Connect` button

   ![ChromeKeePass options](Documents/Images/CKPOptions.png)

5. A KeePass dialog will open, enter a desired name and click `Save`

   ![KeePassHttp Associate](Documents/Images/CKPAssociation.png)

6. The ChromeKeePass options dialog will now show it is connected

   ![ChromeKeePass Connected](Documents/Images/CKPOptionsConnected.png)

7. The encryption key (for secure communication between KeePass en ChromeKeePass) is stored inside your KeePass database under the entry 'KeePassHttp Settings'

## Contribute to ChromeKeePass

- When contributing, always base you changes on the `dev` branch. The `master` branch contains the currently released version. Pull requests will be merged into the `dev` branch
- Try to keep the coding style as consistant as possible
- You can find build instructions [over here](Documents/Manuals/Buildinstructions.md)

## Donate

I'm creating this in my spare time. If you like it, please consider a small donation.
It's very much appreciated.
[![Donate](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=C9H7NGKDULKDN)
