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
  return verseArray.map(o => getWordText(o)).join(' ');
};

/**
 * get text for word object, if not in new format, falls back to old format
 * @param {object} word object
 * @return {string} text from word object
 */
export const getWordText = (wordObject) => {
  if(wordObject && (wordObject.type === 'word')) {
    return wordObject.text;
  }
  return wordObject ? wordObject.word : undefined;
};

export const populateOccurrencesInWordObjects = (wordObjects) => {
  const string = combineGreekVerse(wordObjects);
  return wordObjects.map((wordObject, index) => {
    wordObject.occurrence = getOccurrenceInString(string, index, getWordText(wordObject));
    wordObject.occurrences = occurrencesInString(string, getWordText(wordObject));
    return wordObject;
  });
};

/**
 * gets the occurrence of a subString in a string by using the subString index in the string.
 * @param {String} string
 * @param {Number} currentWordIndex
 * @param {String} subString
 * TODO: Replace with the tokenizer version of this to prevent puctuation issues
 * Cannot replace with tokenizer until tokenizer handles all greek use cases that broke tokenizer
 */
export const getOccurrenceInString = (string, currentWordIndex, subString) => {
  let arrayOfStrings = string.split(' ');
  let occurrence = 1;
  let slicedStrings = arrayOfStrings.slice(0, currentWordIndex);

  slicedStrings.forEach((slicedString) => {
    if (slicedStrings.includes(subString)) {
      slicedString === subString ? occurrence += 1 : null;
    } else {
      occurrence = 1;
    }
  });
  return occurrence;
};
/**
 * @description Function that count occurrences of a substring in a string
 * @param {String} string - The string to search in
 * @param {String} subString - The sub string to search for
 * @returns {Integer} - the count of the occurrences
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 * modified to fit our use cases, return zero for '' substring, and no use case for overlapping.
 */
export const occurrencesInString = (string, subString) => {
  if (subString.length <= 0) return 0;
  let occurrences = 0, position = 0, step = subString.length;
  while (position < string.length) {
    position = string.indexOf(subString, position);
    if (position === -1) break;
    ++occurrences;
    position += step;
  }
  return occurrences;
};

/**
 * @description wordObjectArray via string
 * @param {String} string - The string to search in
 * @returns {Array} - array of wordObjects
 */
export const wordObjectArrayFromString = (string) => {
  const wordObjectArray = stringHelpers.tokenize(string).map((word, index) => {
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
    const { word, occurrence, occurrences } = wordObject;
    const _wordObject = {
      word,
      occurrence,
      occurrences
    };
    const indexInString = stringData.findIndex(object => {
      const equal = (
        getWordText(object) === getWordText(_wordObject) &&
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
 * 
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 */
export const getAlignmentPathsFromProject = (projectSaveLocation) => {
  var chapters, wordAlignmentDataPath, projectTargetLanguagePath;
  //Retrieve project manifest, and paths for reading
  const { project } = manifestHelpers.getProjectManifest(projectSaveLocation);
  if (project && project.id) {
    wordAlignmentDataPath = path.join(projectSaveLocation, '.apps', 'translationCore', 'alignmentData', project.id);
    projectTargetLanguagePath = path.join(projectSaveLocation, project.id);
    if (fs.existsSync(wordAlignmentDataPath) && fs.existsSync(projectTargetLanguagePath)) {
      chapters = fs.readdirSync(wordAlignmentDataPath);
      return {
        chapters, wordAlignmentDataPath, projectTargetLanguagePath
      };
    }
  } return {};
};

/**
 * @description - Method to fetch a target language chapter JSON and source/target language 
 * alignment data JSON for the corresponding chapter. This is essientially the data
 * needed to in order to produce a USFM 3 from the aligned data.
 * @param {string} wordAlignmentDataPath - path to where the source/target language 
 * alignment data JSON is located
 * @param {string} projectTargetLanguagePath path to where the target language chapter JSON is
 * located
 * @param {string} chapterFile 
 */
export const getAlignmentDataFromPath = (wordAlignmentDataPath, projectTargetLanguagePath, chapterFile) => {
  try {
    const chapterAlignmentJSON = fs.readJSONSync(path.join(wordAlignmentDataPath, chapterFile));
    const targetLanguageChapterJSON = fs.readJSONSync(path.join(projectTargetLanguagePath, chapterFile));
    return {
      chapterAlignmentJSON,
      targetLanguageChapterJSON
    };
  } catch (e) {
    return {
      chapterAlignmentJSON: {},
      targetLanguageChapterJSON: {}
    };
  }
};

/**
 * @description - Method to retreive project alignment data and perform conversion in usfm 3
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 * @returns {string} - USFM string containing alignment metadata for each word
 */
export const convertAlignmentDataToUSFM = (wordAlignmentDataPath, projectTargetLanguagePath, chapters) => {
  let usfmToJSONObject = { chapters: {} };
  for (var chapterFile of chapters) {
    const chapterNumber = path.parse(chapterFile).name;
    let { chapterAlignmentJSON, targetLanguageChapterJSON } = getAlignmentDataFromPath(wordAlignmentDataPath, projectTargetLanguagePath, chapterFile);
    for (var verseNumber in chapterAlignmentJSON) {
      //Iterate through verses of chapter alignment data, 
      //and retieve relevant information for conversion
      const verseAlignments = chapterAlignmentJSON[verseNumber];
      const verseString = targetLanguageChapterJSON[verseNumber];
      const verseObjects = PivotAlignmentHelpers.verseObjectsFromAlignmentsAndWordBank(
        verseAlignments.alignments, verseAlignments.wordBank, verseString
      );
      setVerseObjectsInAlignmentJSON(usfmToJSONObject, chapterNumber, verseNumber, verseObjects);
    }
  }
  //Have iterated through all chapters and verses and stroed verse objects from alignment data
  //returning usfm string
  return usfmjs.toUSFM(usfmToJSONObject);
};

export const setVerseObjectsInAlignmentJSON = (usfmToJSONObject, chapterNumber, verseNumber, verseObjects) => {
  !usfmToJSONObject.chapters[chapterNumber] ? usfmToJSONObject.chapters[chapterNumber] = {} : null;
  !usfmToJSONObject.chapters[chapterNumber][verseNumber] ? usfmToJSONObject.chapters[chapterNumber][verseNumber] = {} : null;
  usfmToJSONObject.chapters[chapterNumber][verseNumber].verseObjects = verseObjects;
};

/**
 * 
 * @param {string} usfm - Usfm data to be written to FS
 * @param {string} projectSaveLocation - Location of usfm to be written
 */
export const writeUSFMToFS = (usfm, projectSaveLocation) => {
  fs.writeFileSync(path.join(projectSaveLocation, 'alignments.usfm'), usfm);
};