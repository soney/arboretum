import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Arboretum} from './ts/arboretum';

require('./css/browser.scss');

ReactDOM.render(
    <Arboretum serverState="active" urls={['http://www.umich.edu/']} />,
    document.getElementById('arboretum_main')
);
