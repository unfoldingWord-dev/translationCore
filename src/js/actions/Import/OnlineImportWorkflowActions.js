import consts from '../../actions/ActionTypes';
import path from 'path-extra';
import ospath from 'ospath';
// actions
import * as ProjectValidationActions from '../Import/ProjectValidationActions';
import * as ProjectImportFilesystemActions from './ProjectImportFilesystemActions';
import * as AlertModalActions from '../../actions/AlertModalActions';
import * as OnlineModeConfirmActions from '../../actions/OnlineModeConfirmActions';
import * as ProjectImportStepperActions from '../ProjectImportStepperActions';
import * as MyProjectsActions from '../MyProjects/MyProjectsActions';
import * as ProjectLoadingActions from '../MyProjects/ProjectLoadingActions';
import * as ProjectDetailsActions from "../ProjectDetailsActions";
import * as ProjectInformationCheckActions from "../ProjectInformationCheckActions";
// helpers
import * as TargetLanguageHelpers from '../../helpers/TargetLanguageHelpers';
import * as OnlineImportWorkflowHelpers from '../../helpers/Import/OnlineImportWorkflowHelpers';
import * as CopyrightCheckHelpers from '../../helpers/CopyrightCheckHelpers';
import { getTranslate, getProjectManifest, getProjectSaveLocation, getUsername } from '../../selectors';
import * as ProjectStructureValidationHelpers from "../../helpers/ProjectValidation/ProjectStructureValidationHelpers";
import * as FileConversionHelpers from '../../helpers/FileConversionHelpers';
import * as ProjectFilesystemHelpers from '../../helpers/Import/ProjectImportFilesystemHelpers';
import * as ProjectDetailsHelpers from '../../helpers/ProjectDetailsHelpers';
import migrateProject from '../../helpers/ProjectMigration';
import fs from "fs-extra";

//consts
const IMPORTS_PATH = path.join(ospath.home(), 'translationCore', 'imports');

/**
 * @description Action that dispatches other actions to wrap up online importing
 */
export const onlineImport = () => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      const translate = getTranslate(getState());
      dispatch(OnlineModeConfirmActions.confirmOnlineAction(async () => {
        let importProjectPath = '';
        let link = '';
        try {
          ProjectFilesystemHelpers.deleteImportsFolder();
          // Must allow online action before starting actions that access the internet
          link = getState().importOnlineReducer.importLink;
          dispatch(clearLink());
          // or at least we could pass in the locale key here.
          dispatch(AlertModalActions.openAlertDialog(translate('projects.importing_project_alert', {project_url: link}), true));
          const selectedProjectFilename = await OnlineImportWorkflowHelpers.clone(link);
          dispatch({ type: consts.UPDATE_SELECTED_PROJECT_FILENAME, selectedProjectFilename });
          importProjectPath = path.join(IMPORTS_PATH, selectedProjectFilename);
          const errorMessage = translate('projects.online_import_error', {project_url: link, toPath: importProjectPath});
          verifyThisIsTCoreOrTStudioProject(importProjectPath, errorMessage);
          await ProjectStructureValidationHelpers.ensureSupportedVersion(importProjectPath, translate);
          const initialBibleDataFolderName = ProjectDetailsHelpers.getInitialBibleDataFolderName(selectedProjectFilename, importProjectPath);
          migrateProject(importProjectPath, link, getUsername(getState()));
          // assign CC BY-SA license to projects imported from door43
          await CopyrightCheckHelpers.assignLicenseToOnlineImportedProject(importProjectPath);
          dispatch(ProjectValidationActions.initializeReducersForProjectImportValidation(false));
          await dispatch(ProjectValidationActions.validateProject(importProjectPath));
          const manifest = getProjectManifest(getState());
          const updatedImportPath = getProjectSaveLocation(getState());
          ProjectDetailsHelpers.fixBibleDataFolderName(manifest, initialBibleDataFolderName, updatedImportPath);
          if (!TargetLanguageHelpers.targetBibleExists(updatedImportPath, manifest)) {
            dispatch(AlertModalActions.openAlertDialog(translate("projects.loading_ellipsis"), true));
            TargetLanguageHelpers.generateTargetBibleFromTstudioProjectPath(updatedImportPath, manifest);
            dispatch(ProjectInformationCheckActions.setSkipProjectNameCheckInProjectInformationCheckReducer(true));
            await delay(200);
            dispatch(AlertModalActions.closeAlertDialog());
            await dispatch(ProjectValidationActions.validateProject(updatedImportPath));
          }
          const renamingResults = {};
          await dispatch(ProjectDetailsActions.updateProjectNameIfNecessary(renamingResults));
          const { projectDetailsReducer: {projectSaveLocation} } = getState();
          if (renamingResults.repoRenamed) {
            dispatch({type: consts.UPDATE_SOURCE_PROJECT_PATH, sourceProjectPath: projectSaveLocation});
            dispatch({type: consts.UPDATE_SELECTED_PROJECT_FILENAME, selectedProjectFilename: renamingResults.newRepoName});
            await delay(200);
          }
          await dispatch(ProjectImportFilesystemActions.move());
          if (renamingResults.repoRenamed) {
            await dispatch(ProjectDetailsActions.doRenamePrompting());
          }
          dispatch(MyProjectsActions.getMyProjects());
          await dispatch(ProjectLoadingActions.displayTools());
          resolve();
        } catch (error) { // Catch all errors in nested functions above
          const errorMessage = FileConversionHelpers.getSafeErrorMessage(error, translate('projects.online_import_error', {project_url: link, toPath: importProjectPath}));
          // clear last project must be called before any other action.
          // to avoid troggering autosaving.
          dispatch(ProjectLoadingActions.clearLastProject());
          dispatch(AlertModalActions.openAlertDialog(errorMessage));
          dispatch(ProjectImportStepperActions.cancelProjectValidationStepper());
          dispatch({ type: "LOADED_ONLINE_FAILED" });
          // remove failed project import
          dispatch(deleteImportProjectForLink());
          reject(errorMessage);
        }
      }));
    });
  };
};

/**
 * @description - delete project (for link) from import folder
 */
export function deleteImportProjectForLink() {
  return ((dispatch, getState) => {
    const link = getState().importOnlineReducer.importLink;
    if (link) {
      const gitUrl = OnlineImportWorkflowHelpers.getValidGitUrl(link); // gets a valid git URL for git.door43.org if possible, null if not
      let projectName = OnlineImportWorkflowHelpers.getProjectName(gitUrl);
      if (projectName) {
        dispatch(ProjectImportFilesystemActions.deleteProjectFromImportsFolder(projectName));
      }
    }
  });
}

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

function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

/**
 * make sure this is a tStudio or tCore Project before we try to import it
 * @param {String} projectPath - path to project project
 * @param {String} errorMessage - translated message to show on error
 * @return {Boolean} true if tStudio or tCore Project
 */
function verifyThisIsTCoreOrTStudioProject(projectPath, errorMessage) {
  const projectManifestPath = path.join(projectPath, "manifest.json");
  const projectTCManifestPath = path.join(projectPath, "tc-manifest.json");
  let valid = fs.existsSync(projectTCManifestPath); // if we have tc-manifest.json, then need no more checking
  if (!valid) { // check standard manifest.json
    if (fs.existsSync(projectManifestPath)) {
      const manifest = fs.readJsonSync(projectManifestPath);
      if (manifest) {
        const generatorName = manifest.generator && manifest.generator.name;
        const isTStudioProject = (generatorName && (generatorName.indexOf("ts-") === 0)); // could be ts-desktop or ts-android
        const isTCoreProject = (generatorName && (generatorName === "tc-desktop")) ||
          (manifest.tc_version) || (manifest.tcInitialized);
        valid = (isTStudioProject || isTCoreProject);
      }
    }
  }
  if (!valid) {
    console.warn("This is not a valid tStudio or tCore project we can migrate: ", errorMessage);
    throw errorMessage;
  }
  return valid;
}
