import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumClient} from './ts/ArboretumClient';

// const arboretumClient = new ArboretumClient();
// window.addEventListener('beforeunload', () => {
//     arboretumClient.destroy();
// });

ReactDOM.render(
    <ArboretumClient />,
    document.getElementsByTagName('body')[0]
);
