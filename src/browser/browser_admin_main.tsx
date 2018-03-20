import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumAdminInterface} from './ts/ArboretumAdminInterface';

require('./css/browser.scss');

ReactDOM.render(
    <div className="window">
        <div className="window-content">
            <div className="pane-group">
                <ArboretumAdminInterface  />
            </div>
        </div>
    </div>,
    document.getElementById('arboretum_main')
);
