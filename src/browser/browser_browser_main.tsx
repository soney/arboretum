import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumBrowser} from './ts/ArboretumBrowser';
import * as path from 'path';

require('./css/browser.scss');
const START_URL:string = `file://${path.resolve(__dirname, '..', '..', 'test', 'index.html')}`;
// const START_URL:string = 'http://www.umich.edu/';
ReactDOM.render(
    <ArboretumBrowser urls={[START_URL]} />,
    document.getElementById('arboretum_main')
);
