import {ISettings} from "../Settings";


/**
 * Chrome doesn't send the right `Origin` header in `Fetch` requests.
 * Because of this, KeeWebHttp denies the request.
 * The class takes care of correcting the `Origin` header.
 */
export default class RequestHeaderModifier {
    /**
     * Register the request modifier.
     * @param settings The current settings.
     */
    public static async register(settings: ISettings) {
        const KEEPASS_RULE_ID = 1;
        // noinspection HttpUrlsUsage
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
                id: KEEPASS_RULE_ID,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                    requestHeaders: [{
                        header: 'Origin',
                        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                        value: `chrome-extension://${chrome.runtime.id}`
                    }]
                },
                condition: {
                    urlFilter: `http://${settings.keePassHost}:${settings.keePassPort}/*`
                }
            }],
            removeRuleIds: [KEEPASS_RULE_ID]
        });
    }
}
