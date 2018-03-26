import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

require('./css/client.scss');
const {userID, isAdmin} = window['clientOptions'];
console.log(isAdmin);
ReactDOM.render(
    <ArboretumClient isAdmin={isAdmin} userID={userID} />,
    document.getElementById('client_main')
);
