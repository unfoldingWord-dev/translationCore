import consts from './ActionTypes';
import path from 'path-extra';

import * as ProjectImportStepperActions from '../actions/ProjectImportStepperActions';
import * as MergeConflictHelpers from '../helpers/ProjectValidation/MergeConflictHelpers';
import * as TargetLanguageActions from '../actions/TargetLanguageActions';
import * as AlertModalActions from './AlertModalActions';
//helpers
import * as ProjectStructureValidationHelpers from '../helpers/ProjectValidation/ProjectStructureValidationHelpers';
const MERGE_CONFLICT_NAMESPACE = "mergeConflictCheck";
/**
 * Wrapper action for handling merge conflict detection, and
 * storing result in reducer. Returns false under step namespace
 * 'mergeConflictCheck' if check is passed
 * @param {boolean} forcePath Used to check a project for merge
 * conflicts exclusively from the current one being used.
 * @param {boolean} forceManifest Used to check a project for merge
 * conflicts exclusively from the current one being used.
 */
export function validate(forcePath, forceManifest) {
  return ((dispatch, getState) => {
    let state = getState();
    let { projectSaveLocation, manifest } = state.projectDetailsReducer;
    projectSaveLocation = forcePath || projectSaveLocation;
    manifest = forceManifest || manifest;
    let usfmFilePath = ProjectStructureValidationHelpers.isUSFMProject(projectSaveLocation);
    /**If there is no project field in manifest or no save location for project, or
     * The project book has not been identified and its not usfm...
     * as you can see below if the project is not usfm we are assuming the
     * book is identified for reading in the data of the target language for merge conflicts */

    if (!manifest.project || !projectSaveLocation || (!manifest.project.id && !usfmFilePath)) return;
    if (usfmFilePath) {
      //Has usfm file to check for merge conflicts
      let hasMergeConflicts = MergeConflictHelpers.checkUSFMForMergeConflicts(usfmFilePath);
      if (hasMergeConflicts)
        //usfm file with merge conflicts
        dispatch(setUpMergeConflictsData(usfmFilePath));
    } else {
      //Has no usfm file to check, checking as tC or tS project
      let projectHasMergeConflicts = MergeConflictHelpers.projectHasMergeConflicts(projectSaveLocation, manifest.project.id);
      //Projects should not have merge conflicts post-import
      if (projectHasMergeConflicts) {
        dispatch(AlertModalActions.openAlertDialog('Warning! This project has fatal errors and cannot be loaded.'));
        return dispatch(ProjectImportStepperActions.cancelProjectValidationStepper());
      } else {
        //Checking merge conflicts for tS project that is unconverted
        usfmFilePath = path.join(projectSaveLocation, manifest.project.id + '.usfm');
        let usfmData = MergeConflictHelpers.createUSFMFromTsProject(projectSaveLocation);
        if (usfmData) MergeConflictHelpers.writeUSFM(usfmFilePath, usfmData);
        let usfmHasMergeConflicts = MergeConflictHelpers.checkUSFMForMergeConflicts(usfmFilePath);
        if (usfmHasMergeConflicts) {
          //usfm generated by tS project that has merge conflicts
          dispatch(setUpMergeConflictsData(usfmFilePath));
        }
        else {
          //tS project with no merge conflicts
          TargetLanguageActions.generateTargetBibleFromProjectPath(projectSaveLocation, manifest);
        }
      }
    }
  });
}

export function setUpMergeConflictsData(usfmFilePath) {
  return ((dispatch) => {
    /**
     * Object that will be sent back to reducers with the chapter,
     * verse and text info  of each merge conflict version.
     * An array of arrays of an object.
     * */
    let parsedAllMergeConflictsFoundArray = [];
    let usfmData = MergeConflictHelpers.loadUSFM(usfmFilePath);
    /**
     * extracting merge conflicts from usfm data
     * @example ["1 this is the first version", "1 This is the second version"]
     * @type {string[]}
     *
     */
    let allMergeConflictsFoundArray = MergeConflictHelpers.getMergeConflicts(usfmData);
    while (allMergeConflictsFoundArray.length > 0) {
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
      parsedAllMergeConflictsFoundArray.push(parsedMergeConflictVersionsArray);
    }
    dispatch({
      type: consts.MERGE_CONFLICTS_CHECK,
      conflicts: parsedAllMergeConflictsFoundArray,
      filePath: usfmFilePath
    });
    dispatch(ProjectImportStepperActions.addProjectValidationStep(MERGE_CONFLICT_NAMESPACE));
  });
}

/**
 * Method to update the users choice of resolving the corresponding merge conflict
 * @param {string} mergeConflictIndex - Index of the merge conflict represented in the array of conflicts
 * @param {string} versionIndex - The version of the git difference history out of the two versions
 * @param {boolean} value - The value of the updated version. i.e. selected or not.
 */
export function updateVersionSelection(mergeConflictIndex, versionIndex, value) {
  return ((dispatch, getState) => {
    let otherVersionIndex = Number(! + versionIndex);
    const oldMergeConflictCheckObject = getState().mergeConflictReducer;
    let newMergeConflictCheckObject = JSON.parse(JSON.stringify(oldMergeConflictCheckObject));
    newMergeConflictCheckObject.conflicts[mergeConflictIndex][versionIndex].checked = value;
    newMergeConflictCheckObject.conflicts[mergeConflictIndex][otherVersionIndex].checked = !value;
    dispatch({
      type: consts.MERGE_CONFLICTS_CHECK,
      ...newMergeConflictCheckObject
    });
    return dispatch(updateMergeConflictNextButton());
  });
}

/**
 * Method to go through each merge conlfict and check whether the user has
 * done all required tasks in order to continue forward with resolving the
 * merge conflicts
 */
export function updateMergeConflictNextButton() {
  return ((dispatch, getState) => {
    let mergeConflictCheckObject = getState().mergeConflictReducer;
    let allMergeConflictsHandled = true;
    for (var conflict of mergeConflictCheckObject.conflicts) {
      let mergeHistorySelected = false;
      for (var version of conflict) {
        //if current check is selected or the previous one was
        mergeHistorySelected = version.checked || mergeHistorySelected;
      }
      //All merge conflicts have been handled previously and for the current conflict
      allMergeConflictsHandled = allMergeConflictsHandled && mergeHistorySelected;
    }
    return dispatch(ProjectImportStepperActions.toggleNextButton(!allMergeConflictsHandled));
  });
}

/**
 * Called by the naviagation component on the next button click for the
 * corresponding step. Should handle anything that happens before moving
 * on from this check
 */
export function finalize() {
  return ((dispatch, getState) => {
    let { projectSaveLocation, manifest } = getState().projectDetailsReducer;
    const mergeConflictArray = getState().mergeConflictReducer;
    MergeConflictHelpers.merge(mergeConflictArray.conflicts, mergeConflictArray.filePath, null, projectSaveLocation);
    TargetLanguageActions.generateTargetBibleFromUSFMPath(mergeConflictArray.filePath, projectSaveLocation, manifest);
    dispatch(ProjectImportStepperActions.removeProjectValidationStep(MERGE_CONFLICT_NAMESPACE));
    dispatch(ProjectImportStepperActions.updateStepperIndex());
  });
}
