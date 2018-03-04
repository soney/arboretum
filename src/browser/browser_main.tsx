import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumBrowser} from './ts/ArboretumBrowser';

require('./css/browser.scss');

ReactDOM.render(
    <ArboretumBrowser serverState="active" urls={['file:///home/soney/code/arboretum/test/index.html']} />,
    document.getElementById('arboretum_main')
);
