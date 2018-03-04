import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

// const arboretumClient = new ArboretumClient();
// window.addEventListener('beforeunload', () => {
//     arboretumClient.destroy();
// });
const {userID, frameID, tabID, viewType} = window['clientOptions'];
ReactDOM.render(
    <ArboretumClient userID={userID} frameID={frameID} tabID={tabID} viewType={viewType} />,
    document.getElementsByTagName('body')[0]
);
