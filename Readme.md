> ⚠️ **Status: Archived — No Longer Maintained**  
> Licensed under **GPLv3**. Forks and continued development are welcome!

This project is no longer actively maintained.  
Due to limited time and a lack of motivation to continue development, I have decided to discontinue work on it.  

I have personally transitioned to using (self-hosted) [**Vaultwarden**](https://github.com/dani-garcia/vaultwarden). I can see some room for improvent on the browser extension there and since it is also open source I would contribute there when I find time.

Since ChromeKeePass is licensed under **GPLv3**, you are free to:

- Fork the repository
- Modify the code
- Continue development
- Share your own versions, provided you comply with the GPLv3 license terms

If you are interested in continuing development, please fork the project and make it your own.
Thank you to everyone who has contributed or used this project!

# ChromeKeePass / EdgeKeePass

> Setup instructions below (or see [https://youtu.be/0cVEjYQXrHc](https://youtu.be/0cVEjYQXrHc)) (NOTE! This shows an old version of the extension)

ChromeKeePass/EdgeKeePass is an open source Chrome extension to automatically entering credentials into websites.

To use this extension you **need to have KeePass installed** and the [KeePassHttp](https://github.com/pfn/keepasshttp) plugin, using this KeePass plugin we're able to create secure communication between the browser and KeePass.

![Demo](Documents/Images/DemoMicrosoft.gif)

## Setup

1. Make sure you have KeePassHttp installed. Instruction on [how to install](Documents/Manuals/KeePassHttp%20installation.md) KeePassHttp.

2. Make sure KeePass is running, and a password database is opened

3. Click the extension's icon next to the address bar, it'll show 'Disconnected', click the gear to go to the options

   ![ChromeKeePass Popup](Documents/Images/CKPPopup.png)

4. The options window opens, click the `Connect` button

   ![ChromeKeePass options](Documents/Images/CKPNotConnected.png)

5. A KeePass dialog will open, enter a desired name and click `Save`

   ![KeePassHttp Associate](Documents/Images/CKPAssociation.png)

6. The options dialog will now show it is connected

   ![ChromeKeePass Connected](Documents/Images/CKPOptionsConnected.png)

7. The encryption key (for secure communication between KeePass and the browser) is stored inside your KeePass database under the entry 'KeePassHttp Settings'

## Contribute to ChromeKeePass

- When contributing, always base you changes on the `dev-v2` branch. Pull requests will also be merged into the `dev-v2` branch
- Try to keep the coding style as consistant as possible
- You can find build instructions [over here](Documents/Manuals/Buildinstructions.md)

## Donate

I'm creating this in my spare time. If you like it, please consider a small donation.
It's very much appreciated.
[![Donate](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=C9H7NGKDULKDN)
