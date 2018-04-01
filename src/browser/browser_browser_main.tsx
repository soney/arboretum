import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumBrowser} from './ts/ArboretumBrowser';
import * as path from 'path';

require('./css/browser.scss');
// const START_URL:string = `file://${path.resolve(__dirname, '..', '..', 'test', 'simple.html')}`;
const START_URL:string = 'http://www.umich.edu/';
// const START_URL:string = 'http://www.msu.edu/';
// const START_URL:string = 'http://cromalab.net:7654/arb/foxnews.html';
// const START_URL:string = 'http://cromalab.net:7654/arb/cal1.html';
ReactDOM.render(
    <ArboretumBrowser urls={[START_URL]} />,
    document.getElementById('arboretum_main')
);
