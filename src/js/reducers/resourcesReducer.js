import consts from '../actions/ActionTypes';

const initialState = {
  bibles: {},
  translationHelps: {},
  lexicons: {}
};

const resourcesReducer = (state = initialState, action) => {
  switch (action.type) {
    case consts.ADD_NEW_BIBLE_TO_RESOURCES:
      return {
        ...state,
        bibles: {
          ...state.bibles,
          [action.languageId]: {
            ...state.bibles[action.languageId],
            [action.bibleId]: action.bibleData
          }
        }
      };
    case consts.UPDATE_TARGET_VERSE:
      return {
        ...state,
        bibles: {
          ...state.bibles,
          targetLanguage: {
            targetBible: {
              ...state.bibles.targetLanguage.targetBible,
              [action.chapter]: {
                ...state.bibles.targetLanguage.targetBible[action.chapter],
                [action.verse]: action.editedText
              }
            }
          }
        }
      };
    case consts.ADD_TRANSLATIONHELPS_ARTICLE:
      return {
        ...state,
        translationHelps: {
          ...state.translationHelps,
          [action.resourceType]: {
            ...state.translationHelps[action.resourceType],
            [action.articleId]: action.articleData
          }
        }
      };
    case consts.ADD_LEXICON_ENTRY:
      return {
        ...state,
        lexicons: {
          ...state.lexicons,
          [action.lexiconId]: {
            ...state.lexicons[action.lexiconId],
            [action.entryId]: action.entryData
          }
        }
      };
    case consts.CLEAR_RESOURCES_REDUCER:
      return initialState;
    default:
      return state;
  }
};

export default resourcesReducer;

/**
 * Returns a verse in the target language bible
 * @param state
 * @param {number} chapter - the chapter number
 * @param {number} verse - the verse number
 * @return {*}
 */
export const getTargetVerse = (state, chapter, verse) => {
  const targetChapter = getTargetChapter(state, chapter);
  if (targetChapter) {
    return targetChapter[verse + ''];
  } else {
    return null;
  }
};

/**
 * Returns a chapter in the target language bible
 * @param state
 * @param {number} chapter - the chapter number
 */
export const getTargetChapter = (state, chapter) => {
  return state.bibles.targetLanguage.targetBible[chapter + ''];
};

export const getTargetBible = state => {
  return state.bibles.targetLanguage.targetBible;
};

export const getSourceBible = state => {
  return state.bibles.originalLanguage.ugnt;
};

/**
 * Returns a verse in the original language bible
 * @param state
 * @param {number} chapter - the chapter number
 * @param {number} verse - the verse number
 * @return {*}
 */
export const getOriginalVerse = (state, chapter, verse) => {
  const originalChapter = getOriginalChapter(state, chapter);
  if (originalChapter) {
    return originalChapter[verse + ''];
  } else {
    return null;
  }
};

/**
 * Returns a chapter in the original language bible
 * @param state
 * @param {number} chapter - the chapter number
 * @return {*}
 */
export const getOriginalChapter = (state, chapter) => {
  return state.bibles.originalLanguage.ugnt[chapter + ''];
};
