/* eslint-disable no-console */
import isEqual from 'lodash/isEqual';
import React from 'react';
import path from 'path-extra';
import consts from './ActionTypes';
// actions
import * as WordAlignmentLoadActions from './WordAlignmentLoadActions';
import * as AlertModalActions from './AlertModalActions';
import * as BodyUIActions from './BodyUIActions';
// helpers
import * as WordAlignmentHelpers from '../helpers/WordAlignmentHelpers';
import * as stringHelpers from '../helpers/stringHelpers';
import * as exportHelpers from '../helpers/exportHelpers';
import * as manifestHelpers from '../helpers/manifestHelpers';
import { BIBLES_ABBRV_INDEX } from '../common/BooksOfTheBible';

/**
 * moves a source word object to a target box object.
 * @param {Number} DropBoxItemIndex - index of the target box or greek box item.
 * @param {object} wordBankItem - object of the source item being drop in the target box.
 */
export const moveWordBankItemToAlignment = (newAlignmentIndex, wordBankItem) => {
  return ((dispatch, getState) => {
    const {
      wordAlignmentReducer: {
        alignmentData
      },
      contextIdReducer: {
        contextId
      },
      resourcesReducer: {
        bibles: {
          targetLanguage
        }
      }
    } = getState();
    const { chapter, verse } = contextId.reference;
    let _alignmentData = JSON.parse(JSON.stringify(alignmentData));
    let { alignments, wordBank } = _alignmentData[chapter][verse];
    const currentVerse = targetLanguage[chapter][verse];
    if (typeof wordBankItem.alignmentIndex === 'number') {
      alignments = removeWordBankItemFromAlignments(wordBankItem, alignments);
    }
    alignments = addWordBankItemToAlignments(wordBankItem, alignments, newAlignmentIndex, currentVerse);
    wordBank = removeWordBankItemFromWordBank(wordBank, wordBankItem);

    _alignmentData[chapter][verse] = { alignments, wordBank };

    dispatch(WordAlignmentLoadActions.updateAlignmentData(_alignmentData));
  });
};
/**
 * @description Moves an item from the drop zone area to the word bank area.
 * @param {Object} wordBankItem
 */
export const moveBackToWordBank = (wordBankItem) => {
  return ((dispatch, getState) => {
    const {
      wordAlignmentReducer: {
        alignmentData
      },
      contextIdReducer: {
        contextId
      },
      resourcesReducer: {
        bibles: {
          targetLanguage
        }
      }
    } = getState();
    const { chapter, verse } = contextId.reference;
    let _alignmentData = JSON.parse(JSON.stringify(alignmentData));
    let { alignments, wordBank } = _alignmentData[chapter][verse];
    let currentVerse = stringHelpers.tokenize(targetLanguage[chapter][verse]).join(' ');

    alignments = removeWordBankItemFromAlignments(wordBankItem, alignments, currentVerse);
    wordBank = addWordBankItemToWordBank(wordBank, wordBankItem, currentVerse);

    _alignmentData[chapter][verse] = { alignments, wordBank };

    dispatch(WordAlignmentLoadActions.updateAlignmentData(_alignmentData));
  });
};

export const addWordBankItemToAlignments = (wordBankItem, alignments, alignmentIndex, currentVerseText) => {
  let alignment = alignments[alignmentIndex];
  alignment.bottomWords.push(wordBankItem);
  alignment.bottomWords = WordAlignmentHelpers.sortWordObjectsByString(alignment.bottomWords, currentVerseText);
  alignments[alignmentIndex] = alignment;
  return alignments;
};

export const removeWordBankItemFromAlignments = (wordBankItem, alignments) => {
  const { alignmentIndex } = wordBankItem;
  let alignment = alignments[alignmentIndex];
  delete wordBankItem.alignmentIndex;
  const bottomWords = alignment.bottomWords.filter((_wordBankItem) => {
    return !isEqual(_wordBankItem, wordBankItem);
  });
  alignment.bottomWords = bottomWords;
  alignments[alignmentIndex] = alignment;
  return alignments;
};
/**
 * @description - removes a source word from the word bank.
 * @param {Object} wordBank
 * @param {Object} wordBankItem
 */
export const removeWordBankItemFromWordBank = (wordBank, wordBankItem) => {
  wordBank = wordBank.filter((metadata) => {
    const equal = (
      metadata.word === wordBankItem.word &&
      metadata.occurrence === wordBankItem.occurrence &&
      metadata.occurrences === wordBankItem.occurrences
    );
    return !equal;
  });
  return wordBank;
};
/**
 * @description Adda a wordBankItem to the wordBank array and then sorts
 *  the array based on the currentVerseString
 * @param {Array} wordBank
 * @param {Object} wordBankItem
 * @param {String} currentVerseString
 * @return {Array} wordBank - array of wordBankItems
 */
export function addWordBankItemToWordBank(wordBank, wordBankItem, currentVerseString) {
  wordBank.push(wordBankItem);
  return WordAlignmentHelpers.sortWordObjectsByString(wordBank, currentVerseString);
}
/**
 * @description - merges two alignments together
 * @param {Number} fromAlignmentIndex
 * @param {Number} toAlignmentIndex
 */
export const moveTopWordItemToAlignment = (topWordItem, fromAlignmentIndex, toAlignmentIndex) => {
  return ((dispatch, getState) => {
    const {
      wordAlignmentReducer: {
        alignmentData
      },
      contextIdReducer: {
        contextId
      },
      resourcesReducer: {
        bibles: { ugnt, targetLanguage }
      }
    } = getState();
    const { chapter, verse } = contextId.reference;
    const topWordVerseData = ugnt[chapter][verse];
    const bottomWordVerseText = targetLanguage[chapter][verse];
    // copy the alignmentData safely from state
    let _alignmentData = JSON.parse(JSON.stringify(alignmentData));
    let { alignments, wordBank } = _alignmentData[chapter][verse];
    // get the alignments to move from and to
    let fromAlignments = alignments[fromAlignmentIndex];
    let toAlignments = alignments[toAlignmentIndex];
    // if only one topWord in the fromAlignments, merge them
    let verseAlignmentData = { alignments, wordBank }; // if it's the same alignmentIndex then it needs unmerged
    const sameAlignmentIndex = fromAlignmentIndex === toAlignmentIndex;
    const performUnmerge = sameAlignmentIndex && fromAlignments.topWords.length > 1;
    const performMerge = !sameAlignmentIndex && fromAlignments.topWords.length === 1 && toAlignments.topWords.length > 0;
    if (performUnmerge) { // if more than one topWord in fromAlignments or moving to an empty alignment, move topWord, and move bottomWords of fromAlignments to wordBank
      verseAlignmentData = unmergeAlignments(topWordItem, alignments, wordBank, fromAlignmentIndex, topWordVerseData, bottomWordVerseText);
    } else if (performMerge) {
      alignments = mergeAlignments(alignments, fromAlignmentIndex, toAlignmentIndex, topWordVerseData, bottomWordVerseText);
      verseAlignmentData = { alignments, wordBank };
    }
    // update the alignmentData
    _alignmentData[chapter][verse] = verseAlignmentData;
    dispatch(WordAlignmentLoadActions.updateAlignmentData(_alignmentData));
  });
};

export const mergeAlignments = (alignments, fromAlignmentIndex, toAlignmentIndex, topWordVerseData, bottomWordVerseText) => {
  // get the alignments to move from and to
  let fromAlignments = alignments[fromAlignmentIndex];
  let toAlignments = alignments[toAlignmentIndex];
  // merge the alignments together
  let topWords = toAlignments.topWords.concat(fromAlignments.topWords);
  let bottomWords = toAlignments.bottomWords.concat(fromAlignments.bottomWords);
  // sort the topWords and bottomWords
  toAlignments.topWords = WordAlignmentHelpers.sortWordObjectsByString(topWords, topWordVerseData);
  toAlignments.bottomWords = WordAlignmentHelpers.sortWordObjectsByString(bottomWords, bottomWordVerseText);
  // overwrite the alignment in the toAlignmentIndex
  alignments[toAlignmentIndex] = toAlignments;
  // remove the alignments that got moved
  alignments = alignments.filter((_, i) => i !== fromAlignmentIndex);
  return alignments;
};

export const unmergeAlignments = (topWordItem, alignments, wordBank, fromAlignmentIndex, topWordVerseData, bottomWordVerseText) => {
  // get the alignments to move from and to
  let fromAlignments = alignments[fromAlignmentIndex];
  // make to toAlignment the last one and make it empty so we can populate it
  const emptyAlignment = { topWords: [], bottomWords: [] };
  let toAlignments = emptyAlignment;
  alignments.push(toAlignments);
  let toAlignmentIndex = alignments.length - 1;

  // move all bottomWords in the fromAlignments to the wordBank
  fromAlignments.bottomWords.forEach(bottomWord => {
    wordBank = addWordBankItemToWordBank(wordBank, bottomWord, bottomWordVerseText);
  });
  fromAlignments.bottomWords = [];
  // add topWord to new alignment
  toAlignments.topWords.push(topWordItem);
  toAlignments.topWords = WordAlignmentHelpers.sortWordObjectsByString(toAlignments.topWords, topWordVerseData);
  // remove topWord from old alignment
  fromAlignments.topWords = fromAlignments.topWords.filter(topWord => {
    const equal = (
      topWord.word === topWordItem.word &&
      topWord.occurrence === topWordItem.occurrence &&
      topWord.occurrences === topWordItem.occurrences
    );
    return !equal;
  });
  // overwrite the alignments
  alignments[toAlignmentIndex] = toAlignments;
  alignments[fromAlignmentIndex] = fromAlignments;
  // sort verseAlignmentData
  alignments = sortAlignmentsByTopWordVerseData(alignments, topWordVerseData);
  return { alignments, wordBank };
};

export const sortAlignmentsByTopWordVerseData = (alignments, topWordVerseData) => {
  // sort just the first topWord of each alignment
  const topWords = alignments.map(alignment => alignment.topWords[0]);
  const sortedTopWords = WordAlignmentHelpers.sortWordObjectsByString(topWords, topWordVerseData);
  alignments = sortedTopWords.map((topWordItem) => {
    const index = topWords.indexOf(topWordItem);
    return alignments[index];
  });
  return alignments;
};

/**
 * Wrapper for exporting project alignment data to usfm.
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 */
export const exportWordAlignmentData = (projectSaveLocation) => {
  return ((dispatch, getState) => {
    dispatch(BodyUIActions.dimScreen(true));
    setTimeout(async () => {
      try {
        const manifest = manifestHelpers.getProjectManifest(projectSaveLocation);
        let projectName = getProjectAlignementName(manifest);
        /**Last place the user saved usfm */
        const { wordAlignmentSaveLocation } = getState().settingsReducer;
        /**File path from file chooser*/
        let filePath = exportHelpers.getFilePath(projectName, wordAlignmentSaveLocation, 'usfm');
        /**Getting new projet name to save incase the user changed the save file name*/
        projectName = path.parse(filePath).base.replace('.usfm', '');
        /** Saving the location for future exports */
        dispatch(storeWordAlignmentSaveLocation(filePath, projectName));
        // do not show dimmed screen
        dispatch(BodyUIActions.dimScreen(false));
        //Display alert that export is in progress
        const message = "Exporting alignments from " + projectName + " Please wait...";
        dispatch(AlertModalActions.openAlertDialog(message, true));
        await dispatch(convertAndSaveAlignments(projectSaveLocation, filePath));
        dispatch(AlertModalActions.openAlertDialog(projectName + ".usfm has been successfully exported.", false));
      } catch (err) {
        // do not show dimmed screen
        dispatch(BodyUIActions.dimScreen(false));
        dispatch(AlertModalActions.openAlertDialog(err.message || err, false));
      }
    }, 200);
  });
};

/**
 * 
 * @param {*} projectSaveLocation 
 * @param {*} filePath 
 */
export function convertAndSaveAlignments(projectSaveLocation, filePath) {
  return dispatch => {
    return new Promise(async (resolve, reject) => {
      try {
        /** Convert alignments from FS to USFM3 */
        let usfm = convertAlignments(projectSaveLocation, dispatch);
        //Write converted usfm to specified location
        WordAlignmentHelpers.writeToFS(filePath, usfm);
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };
}

/**
 * @description - Method to get the paths to relevant data and perform a conversion
 * from alignment word objects to usfm 3
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 * @param {function} dispatch - Redux dispatcher 
 */
export function convertAlignments(projectSaveLocation, dispatch) {
  //get paths for alignment conversion
  const { chapters, wordAlignmentDataPath, projectTargetLanguagePath } = WordAlignmentHelpers.getAlignmentPathsFromProject(projectSaveLocation);

  if (!chapters || !wordAlignmentDataPath || !projectTargetLanguagePath) {
    const message = <div>Failed to export.<br />You must make alignments before you can export.</div>;
    dispatch(AlertModalActions.openAlertDialog(message, false));
  }
  //Convert alignment
  const usfm = WordAlignmentHelpers.convertAlignmentDataToUSFM(wordAlignmentDataPath, projectTargetLanguagePath, chapters);
  return usfm;
}


/**
 *
 * @param {string} filePath - File path to the specified usfm export save location
 * @param {string} projectName - Name of the project being exported (This can be altered by the user
 * when saving)
 */
export function storeWordAlignmentSaveLocation(filePath, projectName) {
  return {
    type: consts.SET_USFM_SAVE_LOCATION, 
    usfmSaveLocation: filePath.split(projectName)[0]
  };
}

export function getProjectAlignementName(manifest) {
  if (manifest && manifest.project && manifest.project.id) {
    const bookAbbrv = manifest.project.id;
    let index = BIBLES_ABBRV_INDEX[bookAbbrv];
    return `${index}-${bookAbbrv.toUpperCase()}`;
  }
}