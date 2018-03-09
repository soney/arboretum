import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

require('./css/client.scss');
const {userID, frameID, tabID, viewType} = window['clientOptions'];
ReactDOM.render(
    <ArboretumClient userID={userID} frameID={frameID} tabID={tabID} viewType={viewType} />,
    document.getElementById('client_main')
);
