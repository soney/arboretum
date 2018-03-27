import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumBrowser} from './ts/ArboretumBrowser';

require('./css/browser.scss');

// const START_URL:string = 'file:///home/soney/code/arboretum/test/index.html';
//const START_URL:string = 'http://www.umich.edu/';
const START_URL:string = 'http://www.msu.edu/';
ReactDOM.render(<ArboretumBrowser urls={[START_URL]} />, document.getElementById('arboretum_main'));
