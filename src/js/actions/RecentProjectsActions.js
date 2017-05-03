import consts from './CoreActionConsts';
import sync from '../components/core/SideBar/GitSync.js';
import fs from 'fs-extra';
import path from 'path-extra';
import gogs from '../components/core/login/GogsApi.js';
import { remote } from 'electron';
const { dialog } = remote;
// actions
import * as getDataActions from './GetDataActions';
// contant declarations
const DEFAULT_SAVE = path.join(path.homedir(), 'translationCore');

export function onLoad(filePath) {
  return ((dispatch) => {
    dispatch(getDataActions.openProject(filePath));
  })
}

export function syncProject(projectPath, manifest, lastUser) {
  return ((dispatch) => {
    var Token = api.getAuthToken('gogs');
    gogs(Token).login(lastUser).then((authenticatedUser) => {
      sync(projectPath, manifest, authenticatedUser);
       dispatch({
        type: consts.SYNC_PROJECT
      })
    }).catch(function (reason) {
        dialog.showErrorBox('Error Uploading', "You must be logged in to upload");
    });
  });
}

export function getProjectsFromFolder() {
  const recentProjects = fs.readdirSync(DEFAULT_SAVE);
  return {
    type: consts.GET_RECENT_PROJECTS,
    recentProjects: recentProjects
  }
}
