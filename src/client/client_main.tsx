import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

require('./css/client.scss');
const {userID, frameID, tabID, viewType, isAdmin} = window['clientOptions'];
console.log(isAdmin);
ReactDOM.render(
    <ArboretumClient isAdmin={isAdmin} userID={userID} frameID={frameID} tabID={tabID} viewType={viewType} />,
    document.getElementById('client_main')
);
