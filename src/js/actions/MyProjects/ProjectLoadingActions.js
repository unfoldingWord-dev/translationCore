import consts from '../ActionTypes';
import path from 'path-extra';
import ospath from 'ospath';
// actions
import migrateProject from '../../helpers/ProjectMigration';
import {initializeReducersForProjectOpenValidation, validateProject} from '../Import/ProjectValidationActions';
import * as BodyUIActions from '../BodyUIActions';
import * as RecentProjectsActions from '../RecentProjectsActions';
import {openAlertDialog} from '../AlertModalActions';
import * as ProjectDetailsActions from '../ProjectDetailsActions';
import * as ProjectImportStepperActions from '../ProjectImportStepperActions';
//helpers
import * as manifestHelpers from '../../helpers/manifestHelpers';
import { changeSelections } from '../SelectionsActions';

import {
  getActiveLocaleLanguage,
  getProjectManifest,
  getProjectSaveLocation,
  getSourceBook,
  getTargetBook,
  getToolGatewayLanguage,
  getTools,
  getTranslate,
  getUsername
} from "../../selectors";
import {isProjectSupported} from '../../helpers/ProjectValidation/ProjectStructureValidationHelpers';
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

// constants
const PROJECTS_PATH = path.join(ospath.home(), 'translationCore', 'projects');

function delay(ms) {
  return new Promise ((resolve) =>
    setTimeout(resolve, ms)
  );
}

/**
 * This thunk opens a project and prepares it for use in tools.
 * @param {string} name -  the name of the project
 * @param {boolean} [skipValidation=false] - this is a deprecated hack until the import methods can be refactored
 */
export const openProject = (name, skipValidation=false) => {
  return async (dispatch, getState) => {
    const projectDir = path.join(PROJECTS_PATH, name);
    const translate = getTranslate(getState());

    try {
      dispatch({ type: consts.CLEAR_RESOURCES_REDUCER });
      dispatch({ type: consts.CLEAR_PREVIOUS_FILTERS});

      dispatch(initializeReducersForProjectOpenValidation());
      dispatch(openAlertDialog(translate('projects.loading_project_alert'), true));

      // TRICKY: prevent dialog from flashing on small projects
      await delay(200);
      await isProjectSupported(projectDir, translate);
      migrateProject(projectDir, null, getUsername(getState()));

      // TODO: this is a temporary hack. Eventually we will always validate the project
      // but we need to refactored the online and local import functions first so there is no duplication.
      if(!skipValidation) {
        await dispatch(validateProject(projectDir));
      }

      // TRICKY: validation may have changed the project path
      const validProjectDir = getProjectSaveLocation(getState());

      // load target book
      dispatch(loadTargetLanguageBook());

      // connect the tools
      const manifest = getProjectManifest(getState());
      const tools = getTools(getState());
      for (const t of tools) {
        // load source book translations
        await dispatch(loadSourceBookTranslations(manifest.project.id, t.name));

        // copy group data
        // TRICKY: group data must be tied to the original language.
        copyGroupDataToProject("grc", t.name, validProjectDir);

        // select default categories
        const language = getToolGatewayLanguage(getState(), t.name);
        setDefaultProjectCategories(language, t.name, validProjectDir);

        // connect tool api
        const toolProps = makeToolProps(dispatch, getState(), validProjectDir, manifest.project.id);
        t.api.triggerWillConnect(toolProps);
      }

      await dispatch(displayTools());
    } catch (e) {
      // TODO: clean this up
      if (e.type !== 'div') console.warn(e);
      // clear last project must be called before any other action.
      // to avoid triggering autosaving.
      dispatch(clearLastProject());
      dispatch(openAlertDialog(e));
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
  const {code} = getActiveLocaleLanguage(state);
  const sourceBook = getSourceBook(state);
  const targetBook = getTargetBook(state);

  return {
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
    changeSelections: (selections, userName) => {
      dispatch(changeSelections(selections, userName));
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
export function clearLastProject() {
  return (dispatch) => {
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
