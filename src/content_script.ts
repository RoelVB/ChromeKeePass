import $ from 'jquery-slim';

import PageControl from './classes/PageControl';
const pageControl = new PageControl();

$(()=>{
    pageControl.detectFields();
    if (pageControl.settings.searchForInputsOnUpdate) { // Should the MutationObserver be enabled?
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) {
                        const inputFields = node.querySelectorAll<HTMLInputElement>('input[type="password"]');
                        if (inputFields.length) {
                            setTimeout(() => pageControl.detectNewFields(inputFields), 100);
                        }
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
