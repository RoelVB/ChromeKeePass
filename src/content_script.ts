import * as $ from 'jquery-slim';

import PageControl from './classes/PageControl';
const pageControl = new PageControl();

$(()=>{
    pageControl.detectFields();
});
