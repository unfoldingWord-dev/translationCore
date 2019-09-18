/**
 * @module Actions/GroupsData
 */
import { batchActions } from 'redux-batched-actions';
import fs from 'fs-extra';
import path from 'path-extra';
import isEqual from 'deep-equal';
import { getSelectedToolName } from '../selectors';
import { readLatestChecks, readLatestChecksNonBlock } from '../helpers/groupDataHelpers';
import { TRANSLATION_WORDS, TRANSLATION_NOTES } from '../common/constants';
import consts from './ActionTypes';
import { showSelectionsInvalidatedWarning, validateAllSelectionsForVerse } from './SelectionsActions';
import { ensureCheckVerseEditsInGroupData } from './VerseEditActions';
// consts declaration
const CHECKDATA_DIRECTORY = path.join('.apps', 'translationCore', 'checkData');

/**
 * @description This action adds a groupId as a property to the
 *  groups object and assigns payload as its value.
 * @param {string} groupId - groupId of object ex. figs_metaphor.
 * @param {array} groupsData - array of objects containing group data.
 * @return {object} action object.
 */
export const addGroupData = (groupId, groupsData) => ({
  type: consts.ADD_GROUP_DATA,
  groupId,
  groupsData,
});

/**
 * searches groupData for a match for contextId (groupData must be for same groupId)
 * @param {Object} contextId
 * @param {Array} groupData for same groupId as contextId
 * @return {number} - returns index of match or -1
 */
export const findGroupDataItem = (contextId, groupData) => {
  let index = -1;

  for (let i = 0, l = groupData.length; i < l; i++) {
    const grpContextId = groupData[i].contextId;

    if ((grpContextId.quote === contextId.quote) &&
        isEqual(grpContextId.reference, contextId.reference) &&
        (grpContextId.occurrence === contextId.occurrence)) {
      index = i;
      break;
    }
  }
  return index;
};

/**
 * @description verifies that the data in the checkdata folder is reflected in the menu.
 * @return {object} action object.
 */
export function verifyGroupDataMatchesWithFs() {
  console.log('verifyGroupDataMatchesWithFs()');
  return (async (dispatch, getState) => {
    const state = getState();
    const toolName = getSelectedToolName(state);
    const PROJECT_SAVE_LOCATION = state.projectDetailsReducer.projectSaveLocation;
    let checkDataPath;

    if (PROJECT_SAVE_LOCATION) {
      checkDataPath = path.join(
        PROJECT_SAVE_LOCATION,
        CHECKDATA_DIRECTORY
      );
    }

    const checkVerseEdits = {};

    // build the batch
    let actionsBatch = [];

    if (fs.existsSync(checkDataPath)) {
      let folders = fs.readdirSync(checkDataPath).filter(folder => folder !== '.DS_Store');
      const isCheckTool = (toolName === TRANSLATION_WORDS || toolName === TRANSLATION_NOTES);

      for ( let i = 0, lenF = folders.length; i < lenF; i++) {
        const folderName = folders[i];
        const isCheckVerseEdit = isCheckTool && (folderName === 'verseEdits');
        let dataPath = generatePathToDataItems(state, PROJECT_SAVE_LOCATION, folderName);

        if (!fs.existsSync(dataPath)) {
          continue;
        }

        let chapters = fs.readdirSync(dataPath);
        chapters = filterAndSort(chapters);

        for ( let j = 0, lenC = chapters.length; j < lenC; j++) {
          const chapterFolder = chapters[j];
          const chapterDir = path.join(dataPath, chapterFolder);

          if (!fs.existsSync(chapterDir)) {
            continue;
          }

          let verses = fs.readdirSync(chapterDir);
          verses = filterAndSort(verses);

          for ( let k = 0, lenV = verses.length; k < lenV; k++) {
            const verseFolder = verses[k];
            let filePath = path.join(dataPath, chapterFolder, verseFolder);
            let latestObjects = readLatestChecks(filePath);

            for ( let l = 0, lenO = latestObjects.length; l < lenO; l++) {
              const object = latestObjects[l];

              if (isCheckVerseEdit) {
                // special handling for check external verse edits, save edit verse
                const chapter = (object.contextId && object.contextId.reference && object.contextId.reference.chapter);

                if (chapter) {
                  const verse = object.contextId.reference.verse;

                  if (verse) {
                    const verseKey = chapter + ':' + verse; // save by chapter:verse to remove duplicates

                    if (!checkVerseEdits[verseKey]) {
                      const reference = {
                        bookId: object.contextId.reference.bookId,
                        chapter,
                        verse,
                      };
                      checkVerseEdits[verseKey] = { reference };
                    }
                  }
                }
              } else if ( object.contextId.tool === toolName) {
                // TRICKY: make sure item is in reducer before trying to set.  In case of tN different GLs
                //  may have different checks
                const currentGroupData = state.groupsDataReducer.groupsData[object.contextId.groupId];

                if (currentGroupData ) {
                  const index = findGroupDataItem(object.contextId, currentGroupData);
                  const oldGroupObject = (index >= 0) ? currentGroupData[index] : null;

                  if (oldGroupObject) {
                    // only toggle if values are different (folderName contains type such as 'selections`)
                    const objectValue = object[folderName] || false;
                    const oldValue = oldGroupObject[folderName] || false;

                    if (!isEqual(oldValue, objectValue)) {
                      // TRICKY: we are using the contextId of oldGroupObject here because sometimes
                      //            there are slight differences with the contextIds of the checkData due to build
                      //            changes (such as quoteString) and getToggledGroupData() requires exact match
                      object.contextId = oldGroupObject.contextId;
                      const action = toggleGroupDataItems(folderName, object);

                      if (action) {
                        actionsBatch.push(action);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (Object.keys(checkVerseEdits).length) {
        await dispatch(ensureCheckVerseEditsInGroupData(checkVerseEdits));
      }

      // run the batch of queue actions
      if (actionsBatch.length) {
        console.log('verifyGroupDataMatchesWithFs() - processing batch size: ' + actionsBatch.length);
        dispatch(batchActions(actionsBatch));
      }
      console.log('verifyGroupDataMatchesWithFs() - done');
    }
  });
}

/**
 * @description verifies that the data in the checkdata folder is reflected in the menu.
 * @return {object} action object.
 */
export function verifyGroupDataMatchesWithFsNonBlocking() {
  console.log('verifyGroupDataMatchesWithFsNonBlocking()');
  return (async (dispatch, getState) => {
    const state = getState();
    const toolName = getSelectedToolName(state);
    const PROJECT_SAVE_LOCATION = state.projectDetailsReducer.projectSaveLocation;
    let checkDataPath;

    if (PROJECT_SAVE_LOCATION) {
      checkDataPath = path.join(
        PROJECT_SAVE_LOCATION,
        CHECKDATA_DIRECTORY
      );
    }

    const checkVerseEdits = {};

    // build the batch
    let actionsBatch = [];

    if (await fs.exists(checkDataPath)) {
      const rawFolders = await fs.readdir(checkDataPath);
      let folders = rawFolders.filter(folder => folder !== '.DS_Store');
      const isCheckTool = (toolName === TRANSLATION_WORDS || toolName === TRANSLATION_NOTES);

      for ( let i = 0, lenF = folders.length; i < lenF; i++) {
        const folderName = folders[i];
        const isCheckVerseEdit = isCheckTool && (folderName === 'verseEdits');
        let dataPath = generatePathToDataItems(state, PROJECT_SAVE_LOCATION, folderName);

        if (!fs.existsSync(dataPath)) {
          return;
        }

        let chapters = fs.readdirSync(dataPath);
        chapters = filterAndSort(chapters);

        for ( let j = 0, lenC = chapters.length; j < lenC; j++) {
          const chapterFolder = chapters[j];
          const chapterDir = path.join(dataPath, chapterFolder);

          if (!fs.existsSync(chapterDir)) {
            continue;
          }

          let verses = fs.readdirSync(chapterDir);
          verses = filterAndSort(verses);

          for ( let k = 0, lenV = verses.length; k < lenV; k++) {
            const verseFolder = verses[k];
            let filePath = path.join(dataPath, chapterFolder, verseFolder);
            let latestObjects = await readLatestChecksNonBlock(filePath);

            for ( let l = 0, lenO = latestObjects.length; l < lenO; l++) {
              const object = latestObjects[l];

              if (isCheckVerseEdit) {
                // special handling for check external verse edits, save edit verse
                const chapter = (object.contextId && object.contextId.reference && object.contextId.reference.chapter);

                if (chapter) {
                  const verse = object.contextId.reference.verse;

                  if (verse) {
                    const verseKey = chapter + ':' + verse; // save by chapter:verse to remove duplicates

                    if (!checkVerseEdits[verseKey]) {
                      const reference = {
                        bookId: object.contextId.reference.bookId,
                        chapter,
                        verse,
                      };
                      checkVerseEdits[verseKey] = { reference };
                    }
                  }
                }
              } else if ( object.contextId.tool === toolName) {
                // TRICKY: make sure item is in reducer before trying to set.  In case of tN different GLs
                //  may have different checks
                const currentGroupData = state.groupsDataReducer.groupsData[object.contextId.groupId];

                if (currentGroupData ) {
                  const index = findGroupDataItem(object.contextId, currentGroupData);
                  const oldGroupObject = (index >= 0) ? currentGroupData[index] : null;

                  if (oldGroupObject) {
                    // only toggle if values are different (folderName contains type such as 'selections`)
                    const objectValue = object[folderName] || false;
                    const oldValue = oldGroupObject[folderName] || false;

                    if (!isEqual(oldValue, objectValue)) {
                      // TRICKY: we are using the contextId of oldGroupObject here because sometimes
                      //            there are slight differences with the contextIds of the checkData due to build
                      //            changes (such as quoteString) and getToggledGroupData() requires exact match
                      object.contextId = oldGroupObject.contextId;
                      const action = toggleGroupDataItems(folderName, object);

                      if (action) {
                        actionsBatch.push(action);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (Object.keys(checkVerseEdits).length) {
        await dispatch(ensureCheckVerseEditsInGroupData(checkVerseEdits));
      }

      // run the batch of queue actions
      if (actionsBatch.length) {
        console.log('verifyGroupDataMatchesWithFs() - processing batch size: ' + actionsBatch.length);
        dispatch(batchActions(actionsBatch));
      }
      console.log('verifyGroupDataMatchesWithFs() - done');
    }
  });
}

/**
 * verifies all the selections for current book to make sure they are still valid
 */
export function validateBookSelections() {
  return ((dispatch, getState) => {
    // iterate through target chapters and validate selections
    const results = { selectionsChanged: false };
    const { projectDetailsReducer } = getState();
    const targetBiblePath = path.join(projectDetailsReducer.projectSaveLocation, projectDetailsReducer.manifest.project.id);
    const files = fs.readdirSync(targetBiblePath);

    for (let file of files) {
      const chapter = parseInt(file); // get chapter number

      if (chapter) {
        dispatch(validateChapterSelections(chapter, results));
      }
    }

    if (results.selectionsChanged) {
      dispatch(showSelectionsInvalidatedWarning());
    }
  });
}

/**
 * verifies all the selections for chapter to make sure they are still valid.
 * This expects the book resources to have already been loaded.
 * Books are loaded when a project is selected.
 * @param {String} chapter
 * @param {Object} results - for keeping track if any selections have been reset.
 */
function validateChapterSelections(chapter, results) {
  return ((dispatch, getState) => {
    let changed = results.selectionsChanged; // save initial state
    const state = getState();

    if (state.resourcesReducer && state.resourcesReducer.bibles && state.resourcesReducer.bibles.targetLanguage && state.resourcesReducer.bibles.targetLanguage.targetBible) {
      const bibleChapter = state.resourcesReducer.bibles.targetLanguage.targetBible[chapter];

      if (bibleChapter) {
        for (let verse of Object.keys(bibleChapter)) {
          const verseText = bibleChapter[verse];
          const contextId = {
            reference: {
              bookId: state.projectInformationCheckReducer.bookId,
              chapter: parseInt(chapter),
              verse: parseInt(verse),
            },
          };
          results.selectionsChanged = false;
          dispatch(validateAllSelectionsForVerse(verseText, results, false, contextId));
          changed = changed || results.selectionsChanged;
        }
      }
    }
    results.selectionsChanged = changed;
  });
}

/**
 * @description generates a path to a check data item.
 * @param {object} state - redux store state.
 * @param {string} PROJECT_SAVE_LOCATION - project path/directory.
 * @param {string} checkDataName - comments, reminders, selections and verseEdits folders.
 * @return {string} path/directory to be use to load a file.
 */
export function generatePathToDataItems(state, PROJECT_SAVE_LOCATION, checkDataName) {
  if (PROJECT_SAVE_LOCATION && state) {
    let bookAbbreviation = state.projectDetailsReducer.manifest.project.id;
    let loadPath = path.join(
      PROJECT_SAVE_LOCATION,
      CHECKDATA_DIRECTORY,
      checkDataName,
      bookAbbreviation
    );
    return loadPath;
  }
}
/**
 * @description filters and sorts an array.
 * @param {array} array - array to be filtered and sorted.
 * @return {array} filtered and sorted array.
 */
export function filterAndSort(array) {
  let filteredArray = array.filter(folder => folder !== '.DS_Store').sort((a, b) => {
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    return a - b;
  });
  return filteredArray;
}

/**
 * @description dispatches appropiate action based on label string.
 * @param {string} label - string to be use to determine which action to dispatch.
 * @param {object} fileObject - checkdata object.
 * @param {function} dispatch - redux action dispatcher.
 */
export function toggleGroupDataItems(label, fileObject) {
  let action;

  switch (label) {
  case 'comments':
    action = {
      type: consts.TOGGLE_COMMENTS_IN_GROUPDATA,
      contextId: fileObject.contextId,
      text: fileObject.text,
    };
    break;
  case 'reminders':
    action = {
      type: consts.SET_REMINDERS_IN_GROUPDATA,
      contextId: fileObject.contextId,
      boolean: fileObject.enabled,
    };
    break;
  case 'selections':
    action = {
      type: consts.TOGGLE_SELECTIONS_IN_GROUPDATA,
      contextId: fileObject.contextId,
      selections: fileObject.selections,
      nothingToSelect: fileObject.nothingToSelect,
    };
    break;
  case 'verseEdits':
    action = {
      type: consts.TOGGLE_VERSE_EDITS_IN_GROUPDATA,
      contextId: fileObject.contextId,
    };
    break;
  case 'invalidated':
    action = {
      type: consts.SET_INVALIDATION_IN_GROUPDATA,
      contextId: fileObject.contextId,
      boolean: fileObject.invalidated,
    };
    break;
  default:
    action = null;
    console.warn('Undefined label in toggleGroupDataItems switch');
    break;
  }
  return action;
}
