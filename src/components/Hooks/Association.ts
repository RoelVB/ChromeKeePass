import React from 'react';
import Client from '../../classes/BackgroundClient';

export type AssociationStatus = 'checking'|'associating'|'notAssociated'|'associated';

/**
 * Get association status
 * @param deps Association is re-checked if values in this list change
 * @returns [status, association ID, error message, associate method]
 */
export const useAssociation = (deps?: React.DependencyList): [AssociationStatus|undefined, string|undefined, string|undefined, ()=>void] =>
{
    const [status, setStatus] = React.useState<AssociationStatus>('checking');
    const [assocId, setAssocId] = React.useState<string>();
    const [errorMsg, setErrorMsg] = React.useState<string>();
    
    React.useEffect(()=>{
        setStatus('checking');
        setAssocId(undefined);
        setErrorMsg(undefined);

        (async ()=>{
            try {
                const assoc = await Client.testAssociate();

                setStatus(assoc.Associated?'associated':'notAssociated');
                setAssocId(assoc.Id);
            } catch(error) {
                setStatus('notAssociated');
                setErrorMsg(String(error));
            }            
        })();
    }, deps || []);

    const associate = React.useCallback(()=>{
        setStatus('associating');
        setErrorMsg(undefined);

        (async ()=>{
            try {
                const assoc = await Client.associate();

                setStatus(assoc.Associated?'associated':'notAssociated');
                setAssocId(assoc.Id);
            } catch(error) {
                setStatus('notAssociated');
                setErrorMsg(String(error));
            }
        })();
    }, []);

    return [status, assocId, errorMsg, associate];
};
