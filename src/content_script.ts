import $ from 'jquery-slim';

import PageControl from './classes/PageControl';
const pageControl = new PageControl();

$(()=>{
    pageControl.detectFields();

    if(pageControl.settings.searchForInputsOnUpdate) // Should the MutationObserver be enabled?
    {
        // The MutationObserver implementation
        const observer = new MutationObserver((mutations)=>{
            for(const mutation of mutations)
            {
                for(const node of mutation.addedNodes)
                {
                    if(node instanceof HTMLElement)
                    {
                        const passwordFields = node.querySelectorAll('input[type="password"]');

                        if(passwordFields.length)
                            setTimeout(() => pageControl.detectNewFields(passwordFields), 100);
                    }
                }
            }
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
});
