import * as $ from 'jquery-slim';

import PageControl from './classes/PageControl';
const pageControl = new PageControl();

$(()=>{
    pageControl.detectFields();
    if (pageControl.settings.searchForInputsOnUpdate) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                for (let node of mutation.addedNodes) {
                    let passwordFields = $(node).find('input[type="password"]');
                    if (passwordFields.length) {
                        setTimeout(() => pageControl.detectNewFields(passwordFields), 100);
                    }
                }
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
});
