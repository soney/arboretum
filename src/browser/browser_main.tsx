import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Arboretum} from './ts/arboretum';

require('./css/browser.scss');

ReactDOM.render(
    <Arboretum serverState="active" urls={['file:///home/soney/code/arboretum/test/simple_iframe_content.html']} />,
    document.getElementById('arboretum_main')
);
