import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import fs from 'fs-extra';
import path from 'path-extra';
import App from './js/pages/root';
import * as serviceWorker from './serviceWorker';
import { createElectronHandler, registerLogHandler } from './logger';

// forward logs to electron's main thread
registerLogHandler(createElectronHandler('log-event'));

// log versions
console.log('Electron', process.versions.electron);
console.log('Chrome', process.versions.chrome);
console.log('Node', process.versions.node);

let currentPath = path.join(__dirname);
let currentPath2 = path.join(__dirname, 'static');
console.log('currentPath', fs.readdirSync(currentPath));
console.log('currentPath2', fs.readdirSync(currentPath2));

// currentPath = path.join('./src');
// files = fs.readdirSync(currentPath);
// console.log(currentPath + ': ' + JSON.stringify(files));


ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
