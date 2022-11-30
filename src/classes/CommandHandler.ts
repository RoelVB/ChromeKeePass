import * as IMessage from "../IMessage";
import * as C from "./Constants";


export default class CommandHandler {
    public static async handleCommand(command: string) {
        if(command === 're_detect_fields')
        {
            const activeTab = await C.getActiveTab();
            if (activeTab) {
                CommandHandler.sendReDetect(activeTab);
            }
        }
    }

    public static sendReDetect(tab: chrome.tabs.Tab) {
        // Send re-detect command to active tab
        chrome.tabs.sendMessage(tab.id as number, {
            type: IMessage.RequestType.reDetectFields,
        } as IMessage.Request).catch((reason) => console.error(`Failed to send re-detect to tab ${tab.id}: ${reason}`));
    }
}
