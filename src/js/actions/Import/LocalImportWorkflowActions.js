import React from 'react';
import path from 'path-extra';
import ospath from 'ospath';
import {ipcRenderer} from 'electron';
import consts from '../ActionTypes';
// actions
import * as BodyUIActions from '../BodyUIActions';
import * as AlertModalActions from '../AlertModalActions';
import * as ProjectMigrationActions from '../Import/ProjectMigrationActions';
import * as ProjectValidationActions from '../Import/ProjectValidationActions';
import * as ProjectImportFilesystemActions from './ProjectImportFilesystemActions';
import * as ProjectImportStepperActions from '../ProjectImportStepperActions';
import * as MyProjectsActions from '../MyProjects/MyProjectsActions';
import * as ProjectLoadingActions from '../MyProjects/ProjectLoadingActions';
import * as TargetLanguageHelpers from '../../helpers/TargetLanguageHelpers';
// helpers
import * as FileConversionHelpers from '../../helpers/FileConversionHelpers';
import {getTranslate, getProjectManifest, getProjectSaveLocation} from '../../selectors';
import * as ProjectDetailsActions from "../ProjectDetailsActions";
import * as ProjectInformationCheckActions from "../ProjectInformationCheckActions";
// constants
export const ALERT_MESSAGE = (
  <div>
    No file was selected. Please click on the
    <span style={{color: 'var(--accent-color-dark)', fontWeight: "bold"}}>
      &nbsp;Import Local Project&nbsp;
    </span>
    button again and select the project you want to load.
  </div>
);
const IMPORTS_PATH = path.join(ospath.home(), 'translationCore', 'imports');

/**
 * @description Action that dispatches other actions to wrap up local importing
 */
export const localImport = () => {
//console.log("LocalImport: Entry");
  return async (dispatch, getState) => {
console.log("LocalImport: in dispatch");
    const translate = getTranslate(getState());
console.log("LocalImport: got state");
    // selectedProjectFilename and sourceProjectPath are populated by selectProjectMoveToImports()
    const {
      selectedProjectFilename,
      sourceProjectPath
    } = getState().localImportReducer;
console.log("LocalImport: got reducer");
    const importProjectPath = path.join(IMPORTS_PATH, selectedProjectFilename);

    /*await dispatch( */ ProjectImportFilesystemActions.deleteProjectFromImportsFolder(); //);
console.log("LocalImport: deleted folder");
    try {
      // convert file to tC acceptable project format
      const projectInfo = await FileConversionHelpers.convert(sourceProjectPath, selectedProjectFilename);
      ProjectMigrationActions.migrate(importProjectPath);
      dispatch(ProjectValidationActions.initializeReducersForProjectImportValidation(true, projectInfo.usfmProject));
      await dispatch(ProjectValidationActions.validate(importProjectPath));
      const manifest = getProjectManifest(getState());
      const updatedImportPath = getProjectSaveLocation(getState());
console.log("LocalImport: got path");
      if (!TargetLanguageHelpers.targetBibleExists(updatedImportPath, manifest)) {
console.log("LocalImport: got bible");
        TargetLanguageHelpers.generateTargetBibleFromTstudioProjectPath(updatedImportPath, manifest);
        await delay(400);
        dispatch(ProjectInformationCheckActions.setSkipProjectNameCheckInProjectInformationCheckReducer(true));
        await dispatch(ProjectValidationActions.validate(updatedImportPath));
console.log("LocalImport: validate");
      }
console.log("LocalImport: ready to move");
      await dispatch(ProjectImportFilesystemActions.move());
console.log("LocalImport: move");
      await dispatch(ProjectDetailsActions.updateProjectNameIfNecessary());
      dispatch(MyProjectsActions.getMyProjects());
      await dispatch(ProjectLoadingActions.displayTools());
console.log("LocalImport: migrated, validated aka converted");
    } catch (error) { // Catch all errors in nested functions above
      const errorMessage = FileConversionHelpers.getSafeErrorMessage(error, translate('projects.import_error', {fromPath: sourceProjectPath, toPath: importProjectPath}));
      // clear last project must be called before any other action.
      // to avoid triggering auto-saving.
      dispatch(ProjectLoadingActions.clearLastProject());
      dispatch(AlertModalActions.openAlertDialog(errorMessage));
      dispatch(ProjectImportStepperActions.cancelProjectValidationStepper());
      // remove failed project import
      /*dispatch(*/ ProjectImportFilesystemActions.deleteProjectFromImportsFolder(); //);
console.log("LocalImport: failed");
    }
console.log("LocalImport: skipped try/catch");
  };
};

/**
 * @description selects a project from the filesystem and moves it to tC imports folder.
 * @param startLocalImport - optional parameter to specify new startLocalImport function (useful for testing).
 * Default is localImport()
 */
export function selectLocalProject(startLocalImport = localImport) {
  return (dispatch, getState) => {
    return new Promise(async (resolve) => {
      const translate = getTranslate(getState());
      dispatch(BodyUIActions.dimScreen(true));
      dispatch(BodyUIActions.toggleProjectsFAB());
      // TODO: the filter name and dialog text should not be set here.
      // we should instead send generic data and load the text in the react component with localization
      // or at least we could insert the locale keys here.
      await delay(500);
      const options = {
        properties: ['openFile'],
        filters: [
          {name: translate('supported_file_types'), extensions: ['usfm', 'sfm', 'txt', 'tstudio', 'tcore']}
        ]
      };
      let filePaths = ipcRenderer.sendSync('load-local', {options: options});
      dispatch(BodyUIActions.dimScreen(false));
      // if import was cancel then show alert indicating that it was cancel
      if (filePaths && filePaths[0]) {
        dispatch(AlertModalActions.openAlertDialog(translate('projects.importing_local_alert'), true));
        const sourceProjectPath = filePaths[0];
        const selectedProjectFilename = path.parse(sourceProjectPath).base.split('.')[0] || '';
        await delay(100);
        dispatch({type: consts.UPDATE_SOURCE_PROJECT_PATH, sourceProjectPath});
        dispatch({type: consts.UPDATE_SELECTED_PROJECT_FILENAME, selectedProjectFilename});
        await dispatch(startLocalImport());
        resolve();
      } else {
        dispatch(AlertModalActions.closeAlertDialog());
        resolve();
      }
    });
  };
}

function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}
