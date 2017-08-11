import consts from './ActionTypes';
import path from 'Path-extra';

import * as ProjectValidationActions from '../actions/ProjectValidationActions';
import * as MergeConflictHelpers from '../helpers/MergeConflictHelpers';
import * as ProjectSelectionHelpers from '../helpers/ProjectSelectionHelpers';
import * as TargetLanguageActions from '../actions/TargetLanguageActions';
import * as LoadHelpers from '../helpers/LoadHelpers';
const MERGE_CONFLICT_NAMESPACE = "mergeConflictCheck";
/**
 * Wrapper action for handling merge conflict detection, and 
 * storing result in reducer. Returns false under step namespace
 * 'mergeConflictCheck' if check is passed
 */
export function validate(state) {
  const { projectSaveLocation, manifest } = state.projectDetailsReducer;
  /**
   * Object that will be sent back to reducers with the chapter, 
   * verse and text info  of each merge conflict version.
   * An array of arrays of an object.
   * */
  let parsedAllMergeConflictsFoundArray = [];
  let usfmFilePath = LoadHelpers.isUSFMProject(projectSaveLocation) ||
    path.join(projectSaveLocation, manifest.project.id + '.usfm');

  /**@type {string} */
  let usfmData = MergeConflictHelpers.checkProjectForMergeConflicts(usfmFilePath, projectSaveLocation);
  if (!usfmData) {
    return {
      type: consts.MERGE_CONFLICTS_CHECK,
      payload: false
    }
  }
  /**
   * @example ["1 this is the first version", "1 This is the second version"]
   * @type {[string]}
   * extracting merge conflicts from usfm data
  */
  let allMergeConflictsFoundArray = MergeConflictHelpers.getMergeConflicts(usfmData);
  for (let matchIndex in allMergeConflictsFoundArray) {
    /** Array representing the different versions for a merge conflict parsed into a more consumable format */
    let parsedMergeConflictVersionsArray = [];
    /** Array representing current versions to be parsed*/
    let mergeConflictVersionsArray = [];
    /**
     * Getting the first to matched elements from all merge conflicts array
     * These elements are paired because they represent one 'merge conflict'
     * They are the two different version histories of the conflict
     */
    mergeConflictVersionsArray.push(allMergeConflictsFoundArray.shift());
    mergeConflictVersionsArray.push(allMergeConflictsFoundArray.shift());
    for (var versionText of mergeConflictVersionsArray) {
      /**
       * Parsing the merge conflict version text in an object more easily
       * consumable for the displaying container
       * @type {{chapter,verses,text}}
       */
      let parsedMergeConflictVersionObject = MergeConflictHelpers.parseMergeConflictVersion(versionText, usfmData);
      parsedMergeConflictVersionsArray.push(parsedMergeConflictVersionObject);
    }
    parsedAllMergeConflictsFoundArray.push(parsedMergeConflictVersionsArray)
  }
  return {
    type: consts.MERGE_CONFLICTS_CHECK,
    payload: {
      conflicts: parsedAllMergeConflictsFoundArray,
      filePath: usfmFilePath
    }
  }
}

export function updateVersionSelection(mergeConflictIndex, versionIndex, value) {
  return ((dispatch, getState) => {
    let otherVersionIndex = Number(! + versionIndex);
    const oldMergeConflictCheckObject = getState().projectValidationReducer.projectValidationStepsObject[MERGE_CONFLICT_NAMESPACE];
    let newMergeConflictCheckObject = JSON.parse(JSON.stringify(oldMergeConflictCheckObject));
    newMergeConflictCheckObject.conflicts[mergeConflictIndex][versionIndex].checked = value;
    newMergeConflictCheckObject.conflicts[mergeConflictIndex][otherVersionIndex].checked = !value;
    dispatch({
      type: consts.MERGE_CONFLICTS_CHECK,
      payload: newMergeConflictCheckObject
    });
    let nexButtonDisabled = !getNextButtonStatus(newMergeConflictCheckObject)
    dispatch(ProjectValidationActions.toggleNextButton(nexButtonDisabled));
  })
}

export function getNextButtonStatus(newMergeConflictCheckObject) {
  let allMergeConflictsHandled = true;
  for (var conflict of newMergeConflictCheckObject.conflicts) {
    let mergeHistorySelected = false
    for (var version of conflict) {
      //if current check is selected or the previous one was
      mergeHistorySelected = version.checked || mergeHistorySelected;
    }
    //All merge conflicts have been handled previously and for the current conflict
    return allMergeConflictsHandled && mergeHistorySelected;
  }
}

export function finalizeMerge() {
  return ((dispatch, getState) => {
    let {projectSaveLocation, manifest} = getState().projectDetailsReducer;
    const mergeConflictsObject = getState().projectValidationReducer.projectValidationStepsObject[MERGE_CONFLICT_NAMESPACE];
    MergeConflictHelpers.merge(mergeConflictsObject, projectSaveLocation, manifest);
    let usfmProjectObject = ProjectSelectionHelpers.getProjectDetailsFromUSFM(mergeConflictsObject.filePath, projectSaveLocation);
    TargetLanguageActions.generateTargetBible(projectSaveLocation, usfmProjectObject.parsedUSFM, manifest);
  });
}