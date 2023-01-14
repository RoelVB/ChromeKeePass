import React from 'react';
import Client from '../../classes/BackgroundClient';
import { usePageVisibility } from './PageVisibility';

/**
 * Get extension shortcuts/commands
 * @returns [shortcuts, error message]
 */
export const useShortcuts = (): [chrome.commands.Command[]|undefined, string|undefined] =>
{
    const pageVisible = usePageVisibility();
    const [shortcuts, setShortcuts] = React.useState<chrome.commands.Command[]>();
    const [errorMsg, setErrorMsg] = React.useState<string>();
    
    React.useEffect(()=>{
        if(pageVisible)
        {
            setShortcuts(undefined);
            setErrorMsg(undefined);

            (async ()=>{
                try {
                    const commands = await Client.getExtensionCommands();
                    setShortcuts(commands.filter(f=>f.description)); // Only keep commands that have a description
                } catch(error) {
                    setErrorMsg(String(error));
                }            
            })();
        }
    }, [pageVisible]);

    return [shortcuts, errorMsg];
};
