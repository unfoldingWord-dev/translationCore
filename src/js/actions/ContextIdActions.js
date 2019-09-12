import fs from 'fs-extra';
import { batchActions } from 'redux-batched-actions';
// helpers
import {
  shiftGroupIndex, shiftGroupDataItem, visibleGroupItems,
} from '../helpers/navigationHelpers';
// actions
import { getContextIdPathFromIndex, saveContextId } from '../helpers/contextIdHelpers';
import {
  getSelectedToolName,
  getGroupsIndex,
  getGroupsData,
  getProjectSaveLocation,
} from '../selectors';
import Repo from '../helpers/Repo';
import { delay } from '../common/utils';
import consts from './ActionTypes';
import {
  loadComments, loadReminders, loadSelections, loadInvalidated,
} from './CheckDataLoadActions';

/**
 * TODO: tool data should eventually move into the respective tools.
 */
function loadCheckData() {
  return (dispatch, getState) => {
    const state = getState();
    const actionsBatch = [];
    actionsBatch.push(loadSelections(state));
    actionsBatch.push(loadComments(state));
    actionsBatch.push(loadReminders(state));
    actionsBatch.push(loadInvalidated(state));
    dispatch(batchActions(actionsBatch)); // process the batch
  };
}

/**
 * @description this action changes the contextId to the current check.
 * @param {object} contextId - the contextId object.
 * @return {object} New state for contextId reducer.
 */
export const changeCurrentContextId = contextId => (dispatch, getState) => {
  dispatch({
    type: consts.CHANGE_CURRENT_CONTEXT_ID,
    contextId,
  });

  if (contextId) {
    const {
      reference: {
        bookId, chapter, verse,
      }, tool, groupId,
    } = contextId;
    const refStr = `${tool} ${groupId} ${bookId} ${chapter}:${verse}`;
    console.log(`changeCurrentContextId() - setting new contextId to: ${refStr}`);
    const state = getState();
    dispatch(loadCheckData());
    saveContextId(state, contextId);

    // commit project changes
    const projectDir = getProjectSaveLocation(state);

    delay(5000).then(async () => {
      try {
        const repo = await Repo.open(projectDir, state.loginReducer.userdata);
        const saveStarted = await repo.saveDebounced(`Auto saving at ${refStr}`);

        if (!saveStarted) {
          console.log(`changeCurrentContextId() - GIT Save already running, skipping save after ${refStr}`);
        }
      } catch (e) {
        console.error(`changeCurrentContextId() - Failed to auto save ${refStr}`, e);
      }
    });
  }
};

/**
 * @description this action changes the contextId to the first check.
 * @return {object} New state for contextId reducer.
 */
function firstContextId(state) {
  let contextId;
  const groupsIndex = getGroupsIndex(state);
  const groupsData = getGroupsData(state);
  let groupsIndexEmpty = groupsIndex.length === 0;
  let groupsDataEmpty = Object.keys(groupsData).length === 0;

  if (!groupsIndexEmpty && !groupsDataEmpty) {
    let valid = false, i = 0;

    while (!valid && i < groupsIndex.length - 1 || i === 0) {
      let groupId = groupsIndex[i].id;
      let data = groupsData[groupId];

      if (!!data && !!data[0]) {
        contextId = data[0].contextId;
      }
      valid = (contextId ? true : false);
      i++;
    }
    return contextId;
  }
}

export const changeToNextContextId = () => ((dispatch, getState) => {
  let state = getState();
  let { groupsData } = state.groupsDataReducer;
  let { filters } = state.groupMenuReducer;
  let { groupsIndex } = state.groupsIndexReducer;
  let { contextId } = state.contextIdReducer;
  let nextGroupDataItem = shiftGroupDataItem(1, contextId, groupsData, filters); // get the next groupDataItem

  if (nextGroupDataItem === undefined) { // if it is undefined
    // End of the items in the group, need first of next group
    const nextGroupIndex = shiftGroupIndex(1, contextId, groupsIndex, groupsData, filters);

    if (nextGroupIndex !== undefined) {
      const nextGroupData = groupsData[nextGroupIndex.id]; // get the new groupData for previous group
      const visibleItems = visibleGroupItems(nextGroupData, filters);

      if (visibleItems.length) {
        contextId = visibleItems.shift().contextId;
      }
    }
  } else {
    contextId = nextGroupDataItem.contextId;
  }
  dispatch(changeCurrentContextId(contextId));
});

export const changeToPreviousContextId = () => ((dispatch, getState) => {
  let state = getState();
  let { groupsData } = state.groupsDataReducer;
  let { filters } = state.groupMenuReducer;
  let { groupsIndex } = state.groupsIndexReducer;
  let { contextId } = state.contextIdReducer;
  let prevGroupDataItem = shiftGroupDataItem(-1, contextId, groupsData, filters); // get the prev groupDataItem

  if (prevGroupDataItem === undefined) { // if it is undefined
    // End of the items in the group, need first of previous group
    const prevGroupIndex = shiftGroupIndex(-1, contextId, groupsIndex, groupsData, filters);

    if (prevGroupIndex !== undefined) {
      const prevGroupData = groupsData[prevGroupIndex.id]; // get the new groupData for previous group
      const visibleItems = visibleGroupItems(prevGroupData, filters);

      if (visibleItems.length) {
        contextId = visibleItems.pop().contextId;
      }
    }
  } else {
    contextId = prevGroupDataItem.contextId;
  }
  dispatch(changeCurrentContextId(contextId));
});

/**
 * @description loads the latest contextId file from the file system.
 * @return {object} Dispatches an action that loads the contextId with data.
 */
export function loadCurrentContextId() {
  return (dispatch, getState) => {
    let state = getState();
    let { projectSaveLocation, manifest } = state.projectDetailsReducer;
    let { groupsIndex } = state.groupsIndexReducer;
    const toolName = getSelectedToolName(state);
    let bookId = manifest.project.id ? manifest.project.id : undefined;

    if (projectSaveLocation && toolName && bookId) {
      let contextId = {};

      try {
        let loadPath = getContextIdPathFromIndex(projectSaveLocation, toolName, bookId);

        if (fs.existsSync(loadPath)) {
          contextId = fs.readJsonSync(loadPath);
          const contextIdExistInGroups = groupsIndex.filter(({ id }) => id === contextId.groupId).length > 0;

          if (contextId && contextIdExistInGroups) {
            return dispatch(changeCurrentContextId(contextId));
          }
        }
        contextId = firstContextId(state);
        dispatch(changeCurrentContextId(contextId));
      } catch (err) {
        // The object is undefined because the file wasn't found in the directory
        console.warn(err);
      }
    }
  };
}
