<<<<<<< HEAD
const consts = require('../actions/CoreActionConsts');
const fs = require('fs-extra');
const pathex = require('path-extra');
const PARENT = pathex.datadir('translationCore')
const PACKAGE_COMPILE_LOCATION = pathex.join(PARENT, 'packages-compiled');
const dir = pathex.join(PACKAGE_COMPILE_LOCATION, 'settings.json');
var lastSettings = null;
try {
  lastSettings = fs.readJsonSync(dir);
} catch (e) {
}
const initialState = {
  currentSettings: lastSettings,
=======
import consts from '../actions/CoreActionConsts'

const initialState = {
  currentSettings: {
    showTutorial: false,
    textSelect: 'drag',
    developerMode: false
  }
>>>>>>> develop
};

const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case consts.CHANGE_SETTINGS:
      return { ...state, currentSettings: action.val }
    default:
      return state;
  }
}

export default settingsReducer
