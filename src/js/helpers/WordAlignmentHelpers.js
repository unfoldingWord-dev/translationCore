import isEqual from 'lodash/isEqual';
/**
 * Concatenates an array of string into a verse.
 * @param {array} verseArray - array of strings in a verse.
 */
export function combineGreekVerse(verseArray) {
  let combinedVerse = '';

  verseArray.forEach(wordData => {
    combinedVerse += ' ' + wordData.word;
  }, this);

  return combinedVerse;
}

/**
 * gets the occurrence of a subString in a string by using the subString index in the string.
 * @param {String} string
 * @param {Number} currentWordIndex
 * @param {String} subString
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
  const wordObjectArray = string.split(/\s/).map( (word, index) => {
    const occurrence = getOccurrenceInString(string, index, word);
    const occurrences = occurrencesInString(string, word);
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
export const sortWordObjectsByString = (wordObjectArray, string) => {
  const stringWordObjectArray = wordObjectArrayFromString(string);
  let _wordObjectArray = wordObjectArray.map((wordObject) => {
    const {word, occurrence, occurrences} = wordObject;
    const _wordObject = {
      word,
      occurrence,
      occurrences
    };
    const indexInString = stringWordObjectArray.findIndex(object => {
      return isEqual(object, _wordObject);
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
 * @description pivots alignments into bottomWords/targetLanguage wordObjectArray sorted by verseText
 * @param {Array} alignments - array of aligned word objects {bottomWords, topWords}
 * @param {String} string - The string to base the bottomWords sorting
 * @returns {Array} - sorted array of wordObjects to be used for verseText of targetLanguage
 */
export const targetLanguageVerseFromAlignments = (alignments, verseText) => {
  let wordObjects = []; // response
  alignments.forEach(alignment => { // loop through the alignments
    const {bottomWords, topWords} = alignment;
    bottomWords.forEach(bottomWord => { // loop through the bottomWords for the verse
      const {word, occurrence, occurrences} = bottomWord;
      // append the aligned topWords as the bhp in each wordObject
      const wordObject = {
        word,
        occurrence,
        occurrences,
        bhp: topWords
      };
      wordObjects.push(wordObject); // append the wordObject to the array
    });
  });
  const isVerseTextArray = (typeof verseText !== 'string' && verseText.constructor === Array);
  // if the verseText is an array, join on the word attribute or use the existing string
  const verseData = isVerseTextArray ? verseText.map(o => o.word).join(' ') : verseText;
  wordObjects = sortWordObjectsByString(wordObjects, verseData);
  return wordObjects;
};
/**
 * @description pivots bottomWords/targetLanguage wordObjectArray into alignments sorted by verseText
 * @param {Array} alignments - array of aligned word objects {bottomWords, topWords}
 * @param {String} string - The string to base the bottomWords sorting
 * @returns {Array} - sorted array of alignments to be used for wordAlignmentReducer
 */
export const alignmentsFromTargetLanguageVerse = (wordObjects, topWordVerseData, bottomWordVerseData) => {
  // create the response object and seed it with the topWordVerseData wordObjects
  let alignments = topWordVerseData.map(wordObject => {
    return {
      topWords: [wordObject],
      bottomWords: []
    };
  });
  let mergeableWordObjectsArray = [];
  wordObjects.forEach(wordObject => { // loop through the alignments
    const {word, occurrence, occurrences, bhp} = wordObject;
    const bottomWord = {
      word,
      occurrence,
      occurrences
    };
    bhp.forEach(topWord => { // loop through the bottomWords for the verse
      // find the index of topWord in the verseData
      const index = topWordVerseData.findIndex(object => {
        return isEqual(object, topWord);
      });
      alignments[index].bottomWords.push(bottomWord); // append the wordObject to the array
    });
    // see if the top items are mergeableWordObject
    if (bhp.length > 1) mergeableWordObjectsArray.push(bhp);
  });
  // merge the alignments that have the same bottomWords
  mergeableWordObjectsArray.forEach(mergeableWordObjects => {
    // find index for first wordObject in mergeableWordObject
    const firstMergeableIndex = topWordVerseData.findIndex(object => {
      const firstMergeableWordObject = mergeableWordObjects.shift();
      return isEqual(object, firstMergeableWordObject);
    });
    mergeableWordObjects.forEach(mergeableWordObject => {
      const firstMergeableTopWords = alignments[firstMergeableIndex].topWords;
      const newMergeableIndex = topWordVerseData.findIndex(object => {
        return isEqual(object, mergeableWordObject);
      });
      const newMergeableTopWords = alignments[newMergeableIndex].topWords;
      const mergedTopWords = firstMergeableTopWords.concat(newMergeableTopWords);
      alignments[firstMergeableIndex].topWords = mergedTopWords;
      alignments[newMergeableIndex].remove = true;
    });
    alignments = alignments.filter(alignment => {
      return !alignment.remove;
    });
  });
  // sort the bottomWords in each alignment
  alignments = alignments.map(alignment => {
    const verseData = bottomWordVerseData;
    const isVerseTextArray = (typeof verseData !== 'string' && verseData.constructor === Array);
    // if the verseText is an array, join on the word attribute or use the existing string
    const verseText = isVerseTextArray ? verseData.map(o => o.word).join(' ') : verseData;
    const {bottomWords} = alignment;
    alignment.bottomWords = sortWordObjectsByString(bottomWords, verseText);
    return alignment;
  });
  // sort the wordObjects by the topWord verseText
  const verseText = topWordVerseData.map(o => o.word).join(' ');
  wordObjects = sortWordObjectsByString(wordObjects, verseText);
  return alignments;
};
