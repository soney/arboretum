import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

require('./css/client.scss');
const {url, userID, isAdmin} = window['clientOptions'];
ReactDOM.render(
    <ArboretumClient url={url} isAdmin={isAdmin} userID={userID} />,
    document.getElementById('client_main')
);
