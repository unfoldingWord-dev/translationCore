import consts from '../../actions/ActionTypes';
import path from 'path-extra';
// actions
import * as ProjectMigrationActions from '../Import/ProjectMigrationActions';
import * as ProjectValidationActions from '../Import/ProjectValidationActions';
import * as ProjectImportFilesystemActions from './ProjectImportFilesystemActions';
import * as AlertModalActions from '../../actions/AlertModalActions';
import * as OnlineModeConfirmActions from '../../actions/OnlineModeConfirmActions';
import * as ProjectImportStepperActions from '../ProjectImportStepperActions';
import * as MyProjectsActions from '../MyProjects/MyProjectsActions';
import * as ProjectLoadingActions from '../MyProjects/ProjectLoadingActions';
// helpers
import * as OnlineImportWorkflowHelpers from '../../helpers/Import/OnlineImportWorkflowHelpers';
import * as fs from "fs-extra";
//consts
export const IMPORTS_PATH = path.join(path.homedir(), 'translationCore', 'imports');

/**
 * @description Action that dispatches other actions to wrap up online importing
 */
export const onlineImport = () => {
  return ((dispatch, getState) => {
    dispatch(OnlineModeConfirmActions.confirmOnlineAction(async () => {
      try {
        // Must allow online action before starting actions that access the internet
        const link = getState().importOnlineReducer.importLink;
        dispatch(clearLink());
        dispatch(AlertModalActions.openAlertDialog(`Importing ${link} Please wait...`, true));
        const selectedProjectFilename = await OnlineImportWorkflowHelpers.clone(link);
        dispatch({ type: consts.UPDATE_SELECTED_PROJECT_FILENAME, selectedProjectFilename });
        const importProjectPath = path.join(IMPORTS_PATH, selectedProjectFilename);
        ProjectMigrationActions.migrate(importProjectPath, link);
        await dispatch(ProjectValidationActions.validate(importProjectPath));
        await dispatch(ProjectImportFilesystemActions.move());
        dispatch(MyProjectsActions.getMyProjects());
        dispatch(ProjectLoadingActions.displayTools());
      } catch (error) {
        // Catch all errors in nested functions above
        if (error.type !== 'div') console.warn(error);
        // clear last project must be called before any other action.
        // to avoid troggering autosaving.
        dispatch(ProjectLoadingActions.clearLastProject());
        dispatch(AlertModalActions.openAlertDialog(error));
        dispatch(ProjectImportStepperActions.cancelProjectValidationStepper());
        dispatch({ type: "LOADED_ONLINE_FAILED" });
        // remove failed project import
        const link = getState().importOnlineReducer.importLink;
        if(link) {
          const gitUrl = OnlineImportWorkflowHelpers.getValidGitUrl(link); // gets a valid git URL for git.door43.org if possible, null if not
          let projectName = OnlineImportWorkflowHelpers.getProjectName(gitUrl);
          if (projectName) {
            const importProjectPath = path.join(IMPORTS_PATH, projectName);
            fs.removeSync(importProjectPath);
          }
        }
      }
    }));
  });
};

export function clearLink() {
  return {
    type: consts.IMPORT_LINK,
    importLink: ""
  };
}

export function getLink(importLink) {
  return {
    type: consts.IMPORT_LINK,
    importLink
  };
}
