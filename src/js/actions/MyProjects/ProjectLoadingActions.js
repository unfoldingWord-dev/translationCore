import consts from '../ActionTypes';
import path from 'path-extra';
// actions
import migrateProject from '../../helpers/ProjectMigration';
import {initializeReducersForProjectOpenValidation, validateProject} from '../Import/ProjectValidationActions';
import * as BodyUIActions from '../BodyUIActions';
import * as RecentProjectsActions from '../RecentProjectsActions';
import {
  openAlertDialog,
  openOptionDialog,
  closeAlertDialog
} from '../AlertModalActions';
import * as ProjectDetailsActions from '../ProjectDetailsActions';
import * as ProjectImportStepperActions from '../ProjectImportStepperActions';
import {openSoftwareUpdate} from "../SoftwareUpdateActions";
//helpers
import * as manifestHelpers from '../../helpers/manifestHelpers';
import { changeSelections } from '../SelectionsActions';
import ResourceAPI from "../../helpers/ResourceAPI";

import {
  getToolsSelectedGLs,
  getActiveLocaleLanguage,
  getProjectManifest,
  getProjectSaveLocation,
  getSelectedToolApi,
  getSourceBook,
  getSupportingToolApis,
  getTargetBook,
  getToolGatewayLanguage,
  getTools,
  getTranslate,
  getUsername, getProjects
} from "../../selectors";
import { isProjectSupported } from '../../helpers/ProjectValidation/ProjectStructureValidationHelpers';
import {
  loadSourceBookTranslations,
  loadTargetLanguageBook
} from "../ResourcesActions";
import ProjectAPI from "../../helpers/ProjectAPI";
import CoreAPI from "../../helpers/CoreAPI";
import {
  copyGroupDataToProject,
  setDefaultProjectCategories
} from "../../helpers/ResourcesHelpers";
import * as BibleHelpers from "../../helpers/bibleHelpers";
import {delay} from '../../common/utils';
import * as Bible from "../../common/BooksOfTheBible";
// constants
import {
  APP_VERSION,
  MIN_COMPATIBLE_VERSION,
  PROJECTS_PATH,
  tc_MIN_COMPATIBLE_VERSION_KEY,
  tc_EDIT_VERSION_KEY,
  tc_MIN_VERSION_ERROR,
  TRANSLATION_WORDS
} from '../../common/constants';

/**
 * show Invalid Version Error
 * @return {Function}
 */
export const showInvalidVersionError = () => {
  return (dispatch, getState) => {
    const translate = getTranslate(getState());
    const cancelText = translate("buttons.cancel_button");
    const upgradeText = translate("buttons.update");
    dispatch(openOptionDialog(translate("project_validation.newer_project"),
      (result) => {
        dispatch(closeAlertDialog());
        if (result === upgradeText) {
          dispatch(openSoftwareUpdate());
        }
      }, cancelText, upgradeText));
  };
};

/**
 * make sure that the edit versions and minimum compatible versions are up to date in manifest
 * @return {Function}
 */
export const updateProjectVersion = () => {
  return async (dispatch, getState) => {
    const manifest = getProjectManifest(getState());
    const minVersion = manifest[tc_MIN_COMPATIBLE_VERSION_KEY];
    const editVersion = manifest[tc_EDIT_VERSION_KEY];
    if ((editVersion !== APP_VERSION) || (minVersion !== MIN_COMPATIBLE_VERSION)) {
      dispatch(ProjectDetailsActions.addObjectPropertyToManifest(tc_EDIT_VERSION_KEY, APP_VERSION));
      dispatch(ProjectDetailsActions.addObjectPropertyToManifest(tc_MIN_COMPATIBLE_VERSION_KEY, MIN_COMPATIBLE_VERSION));
    }
  };
};

/**
 * This thunk opens a project and prepares it for use in tools.
 * @param {string} name - the name of the project
 * @param {boolean} [skipValidation=false] - this is a deprecated hack until the import methods can be refactored
 */
export const openProject = (name, skipValidation=false) => {
  return async (dispatch, getState) => {
    const projectDir = path.join(PROJECTS_PATH, name);
    const translate = getTranslate(getState());
    console.log("openProject() projectDir=" + projectDir);

    try {
      dispatch(openAlertDialog(translate('projects.loading_project_alert'), true));
      dispatch({ type: consts.CLEAR_RESOURCES_REDUCER });
      dispatch({ type: consts.CLEAR_PREVIOUS_FILTERS});
      dispatch(initializeReducersForProjectOpenValidation());

      // TRICKY: prevent dialog from flashing on small projects
      await delay(300);
      await isProjectSupported(projectDir, translate);
      await migrateProject(projectDir, null, getUsername(getState()));

      // TODO: this is a temporary hack. Eventually we will always validate the project
      // but we need to refactored the online and local import functions first so there is no duplication.
      if(!skipValidation) {
        await dispatch(validateProject(projectDir));
      }

      // TRICKY: validation may have changed the project path
      const validProjectDir = getProjectSaveLocation(getState());
      console.log("openProject() validProjectDir=" + validProjectDir);

      // load target book
      console.log("openProject() - loading target book");
      dispatch(loadTargetLanguageBook());

      // connect the tools
      const manifest = getProjectManifest(getState());
      const tools = getTools(getState());
      const bookId = (manifest && manifest.project && manifest.project.id) || '';
      for (const t of tools) {
        // load source book translations
        console.log(`openProject() - loading source book ${bookId} into ${t.name}`);
        await dispatch(loadSourceBookTranslations(bookId, t.name));
        const gatewayLanguage = getToolGatewayLanguage(getState(), t.name);

        // copy group data
        // TRICKY: group data must be tied to the original language for tW and GL for tN
        console.log("openProject() - copy group data");
        let copyLang = gatewayLanguage;
        if (t.name === TRANSLATION_WORDS) { // for tW we use OrigLang
          const olForBook = BibleHelpers.getOrigLangforBook(bookId);
          copyLang = (olForBook && olForBook.languageId) || Bible.NT_ORIG_LANG;
        }
        copyGroupDataToProject(copyLang, t.name, validProjectDir, dispatch);

        // select default categories
        setDefaultProjectCategories(gatewayLanguage, t.name, validProjectDir);

        // connect tool api
        console.log("openProject() - connect tool api");
        const toolProps = makeToolProps(dispatch, getState(), validProjectDir, bookId);

        t.api.triggerWillConnect(toolProps);
      }

      await dispatch(displayTools());
      dispatch(updateProjectVersion());
      console.log("openProject() - project opened");
    } catch (e) {
      // TODO: clean this up
      if (e.type !== 'div') console.warn("openProject() error", e);
      let message = e.stack ? e.message : e; // if crash dump, need to clean up message so it doesn't crash alert
      // clear last project must be called before any other action.
      // to avoid triggering autosaving.
      dispatch(closeProject());
      if (message === tc_MIN_VERSION_ERROR) {
        dispatch(showInvalidVersionError());
      } else {
        dispatch(openAlertDialog(message));
      }
      dispatch(ProjectImportStepperActions.cancelProjectValidationStepper());
    }
  };
};

/**
 * TODO: this is very similar to what is in the {@link ToolContainer} and probably needs to be abstracted.
 * This is just a temporary prop generator until we can properly abstract the tc api.
 * @param dispatch
 * @param state
 * @param projectDir
 * @param bookId
 * @returns {*}
 */
function makeToolProps(dispatch, state, projectDir, bookId) {
  const projectApi = new ProjectAPI(projectDir);
  const coreApi = new CoreAPI(dispatch);
  const resourceApi = ResourceAPI;
  const {code} = getActiveLocaleLanguage(state);
  const sourceBook = getSourceBook(state);
  const targetBook = getTargetBook(state);

  return {
    //resource api
    resources: resourceApi,
    // project api
    project: projectApi,

    // flattened project api methods that may be deprecated in the future.
    readProjectDataDir: projectApi.readDataDir,
    readProjectDataDirSync: projectApi.readDataDirSync,
    writeProjectData: projectApi.writeDataFile,
    writeProjectDataSync: projectApi.writeDataFileSync,
    readProjectData: projectApi.readDataFile,
    readProjectDataSync: projectApi.readDataFileSync,
    projectDataPathExists: projectApi.dataPathExists,
    projectDataPathExistsSync: projectApi.dataPathExistsSync,
    deleteProjectFile: projectApi.deleteDataFile,

    // tC api
    showDialog: coreApi.showDialog,
    showLoading: coreApi.showLoading,
    closeLoading: coreApi.closeLoading,
    showIgnorableAlert: coreApi.showIgnorableAlert,
    appLanguage: code,
    projects: getProjects(state).map(p => new ProjectAPI(p.projectSaveLocation)),

    // project data
    sourceBook,
    targetBook,

    contextId: {
      reference: {
        bookId,
        chapter: "1", // TRICKY: just some dummy values at first
        verse: "1"
      }
    },
    username: getUsername(state),
    toolsSelectedGLs: getToolsSelectedGLs(state),
    actions: {
      changeSelections: (selections, userName) => {
        dispatch(changeSelections(selections, userName));
      }
    },
    // deprecated props
    readProjectDir: (...args) => {
      console.warn('DEPRECATED: readProjectDir is deprecated. Use readProjectDataDir instead.');
      return projectApi.readDataDir(...args);
    },
    readProjectDirSync: (...args) => {
      console.warn('DEPRECATED: readProjectDirSync is deprecated. Use readProjectDataDirSync instead.');
      return projectApi.readDataDirSync(...args);
    },
    showIgnorableDialog: (...args) => {
      console.warn('DEPRECATED: showIgnorableDialog is deprecated. Use showIgnorableAlert instead');
      return coreApi.showIgnorableAlert(...args);
    },
    get toolsReducer () {
      console.warn(`DEPRECATED: toolsReducer is deprecated.`);
      return {};
    },
    projectFileExistsSync: (...args) => {
      console.warn(`DEPRECATED: projectFileExistsSync is deprecated. Use pathExistsSync instead.`);
      return projectApi.dataPathExistsSync(...args);
    }
  };
}

/**
 * @description - Opening the tools screen upon making sure the project is
 * not a titus or in the user is in developer
 */
export function displayTools() {
  return (dispatch, getState) => {
    const state = getState();
    const translate = getTranslate(state);
    return new Promise ((resolve, reject) => {
      try {
        const { currentSettings } = state.settingsReducer;
        const { manifest } = state.projectDetailsReducer;
        if (manifestHelpers.checkIfValidBetaProject(manifest) || currentSettings.developerMode) {
          // Go to toolsCards page
          dispatch(BodyUIActions.goToStep(3));
        } else {
          dispatch(RecentProjectsActions.getProjectsFromFolder());
          reject(translate('projects.books_available', {app: translate('_.app_name')}));
        }
      } catch (error) {
        console.error(error);
        reject(error);
      }
      resolve();
    });
  };
}

/**
 * @description - Wrapper to clear everything in the store that could
 * prevent a new project from loading
 */
export function closeProject() {
  return (dispatch, getState) => {
    // disconnect from the tools
    const state = getState();
    const toolApi = getSelectedToolApi(state);
    const supportingToolApis = getSupportingToolApis(state);
    for (const key of Object.keys(supportingToolApis)) {
      try {
        supportingToolApis[key].triggerWillDisconnect();
      } catch (e) {
        console.warn(`Failed to disconnect from ${key}`, e);
      }
    }
    if (toolApi) {
      try {
        toolApi.triggerWillDisconnect();
      } catch (e) {
        console.warn(`Failed to disconnect from the current tool`, e);
      }
    }

    /**
     * ATTENTION: THE project details reducer must be reset
     * before any other action being called to avoid
     * autosaving messing up with the project data.
     */
    dispatch({ type: consts.RESET_PROJECT_DETAIL });
    dispatch(BodyUIActions.toggleHomeView(true));
    dispatch(ProjectDetailsActions.resetProjectDetail());
    dispatch({ type: consts.CLEAR_PREVIOUS_GROUPS_DATA });
    dispatch({ type: consts.CLEAR_PREVIOUS_GROUPS_INDEX });
    dispatch({ type: consts.CLEAR_CONTEXT_ID });
    dispatch({ type: consts.CLOSE_TOOL });
    dispatch({ type: consts.CLEAR_RESOURCES_REDUCER });
    dispatch({ type: consts.CLEAR_PREVIOUS_FILTERS});
  };
}

/**
 * @description loads and set the projects details into the projectDetailsReducer.
 * @param {string} projectPath - path location in the filesystem for the project.
 * @param {object} manifest - project manifest.
 */
export function loadProjectDetails(projectPath, manifest) {
  return (dispatch) => {
    dispatch(ProjectDetailsActions.setSaveLocation(projectPath));
    dispatch(ProjectDetailsActions.setProjectManifest(manifest));
  };
}
