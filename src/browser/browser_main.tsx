import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumBrowser} from './ts/ArboretumBrowser';

require('./css/browser.scss');

ReactDOM.render(
    <ArboretumBrowser serverState="active" urls={['http://www.umich.edu/']} />,
    document.getElementById('arboretum_main')
);
