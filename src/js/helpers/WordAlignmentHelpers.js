import fs from 'fs-extra';
import isEqual from 'deep-equal';
import path from 'path-extra';
import usfmjs from 'usfm-js';
import stringHelpers from 'string-punctuation-tokenizer';
//helpers
import * as AlignmentHelpers from './AlignmentHelpers';
import * as manifestHelpers from './manifestHelpers';
import * as exportHelpers from './exportHelpers';
import * as verseObjectHelpers from './VerseObjectHelpers';
import * as ResourcesHelpers from './ResourcesHelpers';
import * as UsfmFileConversionHelpers from './FileConversionHelpers/UsfmFileConversionHelpers';
import * as LoadHelpers from './LoadHelpers';

/**
 * Concatenates an array of words into a verse.
 * @param {array} verseArray - array of strings in a verse.
 * @return {string} combined verse
 */
export const combineVerseArray = (verseArray) => {
  return verseArray.map(o => getWordText(o)).join(' ');
};

/**
 * get text for word object, if not in new format, falls back to old format
 * @param {object} wordObject
 * @return {string|undefined} text from word object
 */
export const getWordText = (wordObject) => {
  if (wordObject && (wordObject.type === 'word')) {
    return wordObject.text;
  }
  return wordObject ? wordObject.word : undefined;
};

export const populateOccurrencesInWordObjects = (wordObjects) => {
  wordObjects = verseObjectHelpers.getWordList(wordObjects);
  let index = 0; // only count verseObject words
  return wordObjects.map((wordObject) => {
    const wordText = getWordText(wordObject);
    if (wordText) { // if verseObject is word
      wordObject.occurrence = getOccurrence(wordObjects, index++, wordText);
      wordObject.occurrences = getOccurrences(wordObjects, wordText);
      return wordObject;
    }
    return null;
  }).filter(wordObject => (wordObject != null));
};

/**
 * @description wordObjectArray via string
 * @param {String} string - The string to search in
 * @returns {Array} - array of wordObjects
 */
export const wordObjectArrayFromString = (string) => {
  const wordObjectArray = stringHelpers.tokenize(string).map((word, index) => {
    const occurrence = stringHelpers.occurrenceInString(string, index, word);
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
 * @param {String|Array|Object} stringData - The string to search in
 * @returns {Array} - sorted array of wordObjects
 */
export const sortWordObjectsByString = (wordObjectArray, stringData) => {
  if (stringData.verseObjects) {
    stringData = populateOccurrencesInWordObjects(stringData.verseObjects);
  } else if (Array.isArray(stringData)) {
    stringData = populateOccurrencesInWordObjects(stringData);
  } else {
    stringData = wordObjectArrayFromString(stringData);
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
  let chapters, wordAlignmentDataPath, projectTargetLanguagePath;
  //Retrieve project manifest, and paths for reading
  const { project } = manifestHelpers.getProjectManifest(projectSaveLocation);
  if (project && project.id) {
    wordAlignmentDataPath = path.join(projectSaveLocation, '.apps', 'translationCore', 'alignmentData', project.id);
    projectTargetLanguagePath = path.join(projectSaveLocation, project.id);
    if (fs.existsSync(wordAlignmentDataPath) && fs.existsSync(projectTargetLanguagePath)) {
      chapters = fs.readdirSync(wordAlignmentDataPath);
      //get integer based chapter files
      chapters = chapters.filter((chapterFile) => !!parseInt(path.parse(chapterFile).name));
      return {
        chapters, wordAlignmentDataPath, projectTargetLanguagePath
      };
    }
  } return {};
};

/**
 * Method to fetch a target language chapter JSON and source/target language
 * alignment data JSON for the corresponding chapter. This is essientially the data
 * needed to in order to produce a USFM 3 from the aligned data.
 * @param {string} wordAlignmentDataPath - path to where the source/target language
 * alignment data JSON is located
 * @param {string} projectTargetLanguagePath path to where the target language chapter JSON is
 * located
 * @param {string} chapterFile
 * @returns {{
      chapterAlignmentJSON: object,
      targetLanguageChapterJSON: object
 * }}
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
 * Method to set a key value in the usfm json object to easily account for missing keys
 *
 * @param {object} usfmToJSONObject - Object of all verse object to be converted by usfm-jd library
 * @param {string} chapterNumber - Current chapter number key value
 * @param {string} verseNumber Current verse number key value
 * @param {array} verseObjects - Array of verse objects made from the alignment reducer of the
 * current chapter/verse
 */
export const setVerseObjectsInAlignmentJSON = (usfmToJSONObject, chapterNumber, verseNumber, verseObjects) => {
  !usfmToJSONObject.chapters[chapterNumber] ? usfmToJSONObject.chapters[chapterNumber] = {} : null;
  !usfmToJSONObject.chapters[chapterNumber][verseNumber] ? usfmToJSONObject.chapters[chapterNumber][verseNumber] = {} : null;
  usfmToJSONObject.chapters[chapterNumber][verseNumber].verseObjects = verseObjects;
};

/**
 * Wrapper for writing to the fs.
 *
 * @param {string} usfm - Usfm data to be written to FS
 * @param {string} exportFilePath - Location of usfm to be written
 */
export const writeToFS = (exportFilePath, usfm) => {
  if (usfm && typeof (usfm) === 'string') fs.writeFileSync(exportFilePath, usfm);
};

/**
 * Method to retrieve project alignment data and perform conversion in usfm 3
 * @param {string} wordAlignmentDataPath
 * @param {string} projectTargetLanguagePath
 * @param {array} chapters aligned
 * @param {string} projectSaveLocation - Full path to the users project to be exported
 * @param {string} projectID
 * @returns {Promise} USFM data for book
 */
export const convertAlignmentDataToUSFM = (wordAlignmentDataPath, projectTargetLanguagePath,
  chapters, projectSaveLocation, projectID) => {
  return new Promise((resolve) => {
    let usfmToJSONObject = { headers: {}, chapters: {} };
    let expectedChapters = 0;

    // get the bibleIndex to get the list of expected chapters
    const bibleIndex = ResourcesHelpers.getBibleIndex('en', 'ult');
    if (bibleIndex && bibleIndex[projectID]) {
      expectedChapters = bibleIndex[projectID].chapters;
    } else { // fallback just get highest chapter
      for (let chapter of chapters) {
        const chapterNum = (typeof chapter === 'string') ? parseInt(chapter) : chapter;
        if (chapterNum > expectedChapters) {
          expectedChapters = chapterNum;
        }
      }
    }

    for (let chapterNumber = 1; chapterNumber <= expectedChapters; chapterNumber++) {
      const chapterFile = chapterNumber + ".json";
      let chapterAlignmentJSON = {};
      let targetLanguageChapterJSON;
      const missingAlignmentData = chapters.indexOf(chapterFile) < 0;
      if (missingAlignmentData) { // if no alignment data, generate empty
        targetLanguageChapterJSON = LoadHelpers.loadFile(projectTargetLanguagePath, chapterFile);
        const olData = UsfmFileConversionHelpers.getOriginalLanguageChapterResources(projectID, chapterNumber);
        for (let verse of Object.keys(olData[chapterNumber])) {
          // generate the blank alignments
          const alignments = generateBlankAlignments(olData[chapterNumber][verse]);
          // generate the wordbank
          const wordBank = generateWordBank(targetLanguageChapterJSON[verse]);
          chapterAlignmentJSON[verse] = {
            alignments,
            wordBank
          };
        }

      } else {
        const alignmentData = getAlignmentDataFromPath(wordAlignmentDataPath, projectTargetLanguagePath, chapterFile);
        chapterAlignmentJSON = alignmentData.chapterAlignmentJSON;
        targetLanguageChapterJSON = alignmentData.targetLanguageChapterJSON;
      }
      for (let verseNumber in chapterAlignmentJSON) {
        if (!parseInt(verseNumber)) continue; // only import integer based verses
        //Iterate through verses of chapter alignment data,
        //and retrieve relevant information for conversion
        const verseAlignments = chapterAlignmentJSON[verseNumber];
        const verseString = targetLanguageChapterJSON[verseNumber];
        const verseObjects = AlignmentHelpers.merge(
          verseAlignments.alignments, verseAlignments.wordBank, verseString
        );
        setVerseObjectsInAlignmentJSON(usfmToJSONObject, chapterNumber, verseNumber, verseObjects);
      }
    }
    usfmToJSONObject.headers = exportHelpers.getHeaderTags(projectSaveLocation);
    //Have iterated through all chapters and verses and stored verse objects from alignment data
    //converting from verseObjects to usfm and returning string
    resolve(usfmjs.toUSFM(usfmToJSONObject));
  });
};

/**
 * Wrapper method to get the greek verse objects from the resources and
 * then convert them to a verse string.
 * Note: This verse string does not contain punctuation, or special tags
 * simply contains all the greek words in the verse.
 * @param {object} ugntVerse - Array of verse objects containing ugnt words
 * @returns {array} - Greek verse obejcts for the current book/chapter/verse
 */
export const getGreekVerse = (ugntVerse) => {
  if (ugntVerse) {
    ugntVerse = getWordsFromVerseObjects(ugntVerse);
    const greekVerseArray = ugntVerse.filter(({ type }) => {
      return type === 'word';
    }).map((word) => verseObjectHelpers.wordVerseObjectFromBottomWord(word, 'text'));
    return combineVerseArray(greekVerseArray);
  }
};

/**
 * Wrapper method to retrieve the target language verse according to specified book/chapter
 *
 * @param {string} targetLanguageVerse - Current target language verse from the bibles
 * reducer.
 * @returns {string} - Combined verse objects into a single string
 * Note: The returning string will not contain any punctuation, or special markers
 * not including in the 'word' attribute
 */
export const getTargetLanguageVerse = (targetLanguageVerse) => {
  if (targetLanguageVerse) {
    const verseObjects = verseObjectHelpers.verseObjectsFromString(targetLanguageVerse);
    const verseObjectsCleaned = verseObjectHelpers.getWordList(verseObjects);
    return combineVerseArray(verseObjectsCleaned);
  }
};

/**
 * Wrapper method to retrieve relevant data from alignments and do string comparison.
 *
 * @param {object} verseAlignments - The verse vese alignments object
 * @param {array} verseAlignments.alignments
 * @param {array} verseAlignments.wordBank
 * @param {object} ugnt - Array of verse objects containing ugnt words
 * @param {string} targetLanguageVerse - Current target language string from the bibles reducer
 * @returns {object} - If there were verse changes or not, which bible the changes were in, and
 * whether or not to show the dialog
 */
export const checkVerseForChanges = (verseAlignments, ugnt, targetLanguageVerse) => {
  const showDialog = verseHasAlignments(verseAlignments);
  const targetLanguageVerseCleaned = getTargetLanguageVerse(targetLanguageVerse);
  const staticGreekVerse = getGreekVerse(ugnt.verseObjects);
  const currentGreekVerse = getCurrentGreekVerseFromAlignments(verseAlignments);
  const currentTargetLanguageVerse = getCurrentTargetLanguageVerseFromAlignments(verseAlignments, targetLanguageVerseCleaned);
  const greekChanged = !isEqual(staticGreekVerse, currentGreekVerse);
  const targetLanguageChanged = !isEqual(targetLanguageVerseCleaned, currentTargetLanguageVerse);
  return {
    alignmentsInvalid: greekChanged || targetLanguageChanged,
    alignmentChangesType: greekChanged ? 'ugnt' : targetLanguageChanged ? 'target language' : null,
    showDialog
  };
};

/**
 * Helper method to find if the given alignments object actually
 * has aligned data. If not we do not want to show the reset dialog
 *
 * @param {array} alignments - alignments object with array of top words/bottom words
 * @returns {boolean} - Whether or not the verse has alignments
 */
export const verseHasAlignments = ({ alignments }) => {
  if (alignments) {
   return alignments.filter(({ bottomWords }) => {
     return bottomWords.length > 0;
   }).length > 0;
  }
};

/**
 * Helper method to parse the greek words from an alignments object
 *
 * @param {array} alignments - alignments object with array of top words/bottom words
 * @returns {string} - Greek verse words combined, without punctation
 */
export const getCurrentGreekVerseFromAlignments = ({ alignments }) => {
  if (alignments) {
    const greekVerseArray = flattenArray(alignments.map(({ topWords }) => {
      return topWords.map(word => verseObjectHelpers.wordVerseObjectFromBottomWord(word));
    }));
    return combineVerseArray(greekVerseArray);
  }
};

/**
 * Helper method to parse alignments for target languge words and combine them in order
 *
 * @param {array} alignemnts - array of top words/bottom words
 * @param {array} wordBank - array of unused topWords for aligning
 * @param {string} verseString - verse from target language, used for aligning greek words
 * in alingment data and extracting words
 * @returns {string} - Target language verse merged from alignments
 */
export const getCurrentTargetLanguageVerseFromAlignments = ({ alignments, wordBank }, verseString) => {
  let verseObjectWithAlignments;
  try {
    verseObjectWithAlignments = AlignmentHelpers.merge(alignments, wordBank, verseString);
  } catch (e) {
    console.warn(e);
    if (e && e.message && e.message.includes('missing from word bank') ||
      e.message.includes('VerseObject not found') ||
      e.message.includes('are not in the alignment data')
    ) {
      return null;
    }
  }
  const verseObjects = getWordsFromVerseObjects(verseObjectWithAlignments);
  const verseObjectsCleaned = verseObjectHelpers.getWordList(verseObjects);
  return combineVerseArray(verseObjectsCleaned);
};

/**
 * Helper method to grab only verse objects or childen of verse objects but
 * not grab verse objects containing children.
 * i.e. given {a:1, b:{2, children:{2a, 2b}} returns 1, 2a, 2b (skips 2)
 *
 * @param {array} verseObjects - Objects containing data for the words such as
 * occurences, occurence, tag, text and type
 * @returns {array} - same format as input, except objects containing childern
 * get flatten to top level
 */
export const getWordsFromVerseObjects = (verseObjects) => {
  const wordObjects = verseObjects.map((versebject) => {
    if (versebject.children) {
      return getWordsFromVerseObjects(versebject.children);
    } else return versebject;
  });
  return flattenArray(wordObjects);
};

/**
 * Helper function to flatten a double nested array
 * @param {array} arr - Array to be flattened
 * @returns {array}
 */
export const flattenArray = (arr) => {
  return [].concat(...arr);
};

/**
 * Wrapper method for resetting alignments in verse to being blank alignments
 * i.e. (all words in word bank and not joined with alignments data)
 * Note: This method does not overwrite any data
 * @param {object} ugnt - Array of verse objects containing ugnt words
 * @param {string} targetLanguageVerse - Current target language string from the bibles reducer
 * @returns {{alignments, wordBank}} - Reset alignments data
 */
export const resetWordAlignmentsForVerse = (ugntVerse, targetLanguageVerse) => {
  const alignments = generateBlankAlignments(ugntVerse);
  const wordBank = generateWordBank(targetLanguageVerse);
  return { alignments, wordBank };
};

/**
 * @description - generates the word alignment tool alignmentData from the UGNT verseData
 * @param {Array} verseData - array of verseObjects
 * @return {Array} alignmentObjects from verse text
 */
export const generateBlankAlignments = (verseData) => {
  let wordList = verseObjectHelpers.getWordList(verseData);
  const alignments = wordList.map((wordData, index) => {
      const word = wordData.word || wordData.text;
      let occurrences = getOccurrences(wordList, word);
      let occurrence = getOccurrence(wordList, index, word);
      const alignment = {
        topWords: [
          {
            word: word,
            strong: (wordData.strong || wordData.strongs),
            lemma: wordData.lemma,
            morph: wordData.morph,
            occurrence,
            occurrences
          }
        ],
        bottomWords: []
      };
      return alignment;
    });
  return alignments;
};

/**
 * @description - generates the word alignment tool word bank from targetLanguage verse
 * @param {String} verseText - string of the verseText in the targetLanguage
 * @return {Array} alignmentObjects from verse text
 */
export const generateWordBank = (verseText) => {
  const verseWords = verseObjectHelpers.getWordList(verseText);
  const wordBank = verseWords.map((object, index) => {
    const word = object.text;
    let occurrences = getOccurrences(verseWords, word);
    let occurrence = getOccurrence(verseWords, index, word);
    return {
      word,
      occurrence,
      occurrences
    };
  });
  return wordBank;
};

/**
 * Wrapper method form creating a blank alignment data given an object and specified chapter data
 *
 * @param {object} alignmentData - Chapter data of alignments, including alignments and word banks
 * for each verse
 * @param {object} ugnt - Entire UGNT book and all its chapters
 * @param {object} targetBible - Entire target language book and all its chapters
 * @param {number} chapter - Current chapter from contextId
 * @returns {object} - All chapters of alignment data reset to blank word banks, and unaligned
 */
export const getEmptyAlignmentData = (alignmentData, ugnt, targetBible, chapter) => {
  let _alignmentData = JSON.parse(JSON.stringify(alignmentData));
  const ugntChapter = ugnt[chapter];
  const targetLanguageChapter = targetBible[chapter];
  // loop through the chapters and populate the alignmentData
  Object.keys(ugntChapter).forEach((verseNumber) => {
    // create the nested objects to be assigned
    if (!_alignmentData[chapter]) _alignmentData[chapter] = {};
    if (!_alignmentData[chapter][verseNumber]) _alignmentData[chapter][verseNumber] = {};
    const alignments = generateBlankAlignments(ugntChapter[verseNumber]);
    const wordBank = generateWordBank(targetLanguageChapter[verseNumber]);
    _alignmentData[chapter][verseNumber].alignments = alignments;
    _alignmentData[chapter][verseNumber].wordBank = wordBank;
  });
  return _alignmentData;
};

/**
 * Gets the occurrence of a subString in a string by using the subString index in the string.
 * @param {String|Array} words - word list or string to search
 * @param {Number} currentWordIndex
 * @param {String} subString
 * @return {Object}
 */
export const getOccurrence = (words, currentWordIndex, subString) => {
  if (typeof words === 'string') {
    return stringHelpers.occurrenceInString(words, currentWordIndex, subString);
  }

  let occurrence = 0;
  if (Array.isArray(words)) {
    for (let i = 0; i <= currentWordIndex; i++) {
      if (words[i].text === subString) occurrence++;
    }
  }
  return occurrence;
};
/**
 * Function that count occurrences of a substring in a string
 * @param {String|Array} words - word list or string to search
 * @param {String} subString - The sub string to search for
 * @return {Integer} - the count of the occurrences
 */
export const getOccurrences = (words, subString) => {
  if (typeof words === 'string') {
    return stringHelpers.occurrencesInString(words, currentWordIndex, subString);
  }

  let occurrences = 0;
  if (Array.isArray(words)) {
    for( let word of words ) {
      if (word.text === subString) occurrences++;
    }
  }
  return occurrences;
};
