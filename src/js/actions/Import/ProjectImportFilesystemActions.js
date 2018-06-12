import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
import { getTranslate } from '../../selectors';
// helpers
import * as ProjectImportFilesystemHelpers from '../../helpers/Import/ProjectImportFilesystemHelpers';
//actions
import * as ProjectDetailsActions from '../ProjectDetailsActions';
// constants
const IMPORTS_PATH = path.join(ospath.home(), 'translationCore', 'imports');

/**
 * @description Moves a project from imports folder to projects folder
 */
export const move = () => {
  return ((dispatch, getState) => {
    return new Promise(async(resolve, reject) => {
      const translate = getTranslate(getState());
      try {
        const projectName = getState().localImportReducer.selectedProjectFilename;
        const projectPath = await ProjectImportFilesystemHelpers.move(projectName, translate);
        dispatch(ProjectDetailsActions.setSaveLocation(projectPath));
        fs.removeSync(path.join(IMPORTS_PATH, projectName));
        resolve();
      } catch (error) {
        if (error && error.message && error.data) {
          reject(translate(error.message, error.data));
        }
        else reject(error);
      }
    });
  });
};

/**
 * Deletes a project from the imports folder. Since there had been a race condition,
 * It now renames the "to be deleted folder" then deletes it so that async functions
 * will not be confused.
 */
export const deleteProjectFromImportsFolder = (projectName) => (dispatch, getState) => {
  return new Promise( async(resolve) => {
    projectName = projectName || getState().localImportReducer.selectedProjectFilename;
    const projectImportsLocation = path.join(IMPORTS_PATH, projectName);
    try {
console.log( "deleteP...: project...: " + projectImportsLocation );
      if (fs.statSync(projectImportsLocation)) {
        const tempDir = path.join( process.cwd(), "oldDir");
        fs.renameSync(projectImportsLocation, tempDir);
console.log( "deleteP...: removing" );
        fs.remove(tempDir);
      }
      resolve();
    } catch(e) {
      resolve();
    } 
  });
};

