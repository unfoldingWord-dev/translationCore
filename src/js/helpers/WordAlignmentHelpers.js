import fs from 'fs-extra';
import path from 'path-extra';
import * as stringHelpers from './stringHelpers';
import * as PivotAlignmentHelpers from './PivotAlignmentHelpers';
import * as manifestHelpers from './manifestHelpers';
import usfmjs from 'usfm-js';

/**
 * Concatenates an array of string into a verse.
 * @param {array} verseArray - array of strings in a verse.
 */
export const combineGreekVerse = (verseArray) => {
  const newFormat = verseArray && verseArray.length && (verseArray[0].type === 'word');
  return verseArray.map(o => newFormat ? o.text : o.word).join(' ');
};

export const populateOccurrencesInWordObjects = (wordObjects) => {
  const string = combineGreekVerse(wordObjects);
  return wordObjects.map((wordObject, index) => {
    wordObject.occurrence = stringHelpers.getOccurrenceInString(string, index, wordObject.word);
    wordObject.occurrences = stringHelpers.occurrencesInString(string, wordObject.word);
    return wordObject;
  });
};
/**
 * @description wordObjectArray via string
 * @param {String} string - The string to search in
 * @returns {Array} - array of wordObjects
 */
export const wordObjectArrayFromString = (string) => {
  const wordObjectArray = stringHelpers.tokenize(string).map( (word, index) => {
    const occurrence = stringHelpers.getOccurrenceInString(string, index, word);
    const occurrences = stringHelpers.occurrencesInString(string, word);
    return {
      word,
      occurrence: occurrence,
      occurrences: occurrences
    };
  });
  return wordObjectArray;
};
/**
 * @description sorts wordObjectArray via string
 * @param {Array} wordObjectArray - array of wordObjects
 * @param {String} string - The string to search in
 * @returns {Array} - sorted array of wordObjects
 */
export const sortWordObjectsByString = (wordObjectArray, stringData) => {
  if (stringData.constructor !== Array) {
    stringData = wordObjectArrayFromString(stringData);
  } else {
    stringData = populateOccurrencesInWordObjects(stringData);
  }
  let _wordObjectArray = wordObjectArray.map((wordObject) => {
    const {word, occurrence, occurrences} = wordObject;
    const _wordObject = {
      word,
      occurrence,
      occurrences
    };
    const indexInString = stringData.findIndex(object => {
      const equal = (
        object.word === _wordObject.word &&
        object.occurrence === _wordObject.occurrence &&
        object.occurrences === _wordObject.occurrences
      );
      return equal;
    });
    wordObject.index = indexInString;
    return wordObject;
  });
  _wordObjectArray = _wordObjectArray.sort((a, b) => {
    return a.index - b.index;
  });
  _wordObjectArray = _wordObjectArray.map((wordObject) => {
    delete wordObject.index;
    return wordObject;
  });
  return _wordObjectArray;
};

/**
 * Method to retreive project alignment data and perform conversion in usfm 3
 * @param {string} projectSaveLocation - Full path to the users project to be exported 
 * @returns {string} - USFM string containing alignment metadata for each word
 */
export const convertAlignmentDataToUSFM = (projectSaveLocation) => {
  //Retrieve project manifest, and paths for reading
  const { project } = manifestHelpers.getProjectManifest(projectSaveLocation);
  const wordAlignmentDataPath = path.join(projectSaveLocation, '.apps', 'translationCore', 'alignmentData', project.id);
  const projectTargetLanguagePath = path.join(projectSaveLocation, project.id);

  //If the project alignment data exists and the project target language exists
  if (fs.existsSync(wordAlignmentDataPath) && fs.existsSync(projectTargetLanguagePath)) {
    //initalize object to be sent to usfm library for conversion
    let usfmToJSONObject = { chapters: {} };

    const chapterFiles = fs.readdirSync(wordAlignmentDataPath);
    for (var chapterFile of chapterFiles) {
      //Iterate through chapters of alignment data, and retrieve chapter JSON data
      const chapterNumber = path.parse(chapterFile).name;
      usfmToJSONObject.chapters[chapterNumber] = {};
      const chapterAlignmentJSON = fs.readJSONSync(path.join(wordAlignmentDataPath, chapterFile));
      const targetLanguageChapterJSON = fs.readJSONSync(path.join(projectTargetLanguagePath, chapterFile));

      for (var verse in chapterAlignmentJSON) {
        //Iterate through verses of chapter alignment data, 
        //and retieve relevant information for conversion
        usfmToJSONObject.chapters[chapterNumber][verse] = {};
        const verseAlignmentData = chapterAlignmentJSON[verse];
        const { alignments, wordBank } = verseAlignmentData;
        const verseString = targetLanguageChapterJSON[verse];
        const verseObjects = PivotAlignmentHelpers.verseObjectsFromAlignmentsAndWordBank(alignments, wordBank, verseString);
        usfmToJSONObject.chapters[chapterNumber][verse].verseObjects = verseObjects;
      }
    }
    //Have iterated through all chapters and verses and stroed verse objects from alignment data
    //returning usfm string
    return usfmjs.toUSFM(usfmToJSONObject);
  }
};

/**
 * 
 * @param {string} usfm - Usfm data to be written to FS
 * @param {string} projectSaveLocation - Location of usfm to be written
 */
export const writeUSFMToFS = (usfm, projectSaveLocation) => {
  fs.writeFileSync(path.join(projectSaveLocation, 'alignments.usfm'), usfm);
};