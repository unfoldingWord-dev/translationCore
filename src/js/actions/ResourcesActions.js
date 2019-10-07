/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
import _ from 'lodash';
import SimpleCache from '../helpers/SimpleCache';
import {
  getBibles, getContext, getProjectBookId, getSelectedToolName,
} from '../selectors';
// actions
// helpers
import * as ResourcesHelpers from '../helpers/ResourcesHelpers';
import * as SettingsHelpers from '../helpers/SettingsHelpers';
import * as BibleHelpers from '../helpers/bibleHelpers';
import * as Bible from '../common/BooksOfTheBible';
import {
  ORIGINAL_LANGUAGE,
  TARGET_BIBLE,
  TARGET_LANGUAGE,
} from '../common/constants';
import * as SettingsActions from './SettingsActions';
import consts from './ActionTypes';

// constants
const USER_RESOURCES_PATH = path.join(ospath.home(), 'translationCore/resources');
const bookCache = new SimpleCache();

/**
 * Adds a bible to the resources reducer.
 * @param {String} languageId - language id: en, hi, el-x-koine, he.
 * @param {String} bibleId - name/label for bible: ult, udt, ust, ugnt.
 * @param {object} bibleData - data being saved in the bible property.
 */
export function addNewBible(languageId, bibleId, bibleData) {
  return ((dispatch) => {
    if (BibleHelpers.isOriginalLanguage(languageId)) {
      languageId = ORIGINAL_LANGUAGE;
    }
    dispatch({
      type: consts.ADD_NEW_BIBLE_TO_RESOURCES,
      languageId: languageId,
      bibleId: bibleId,
      bibleData,
    });
  });
}

/**
 * get chapter from specific resource
 * @param {String} bibleID
 * @param {String} bookId
 * @param {String} languageId
 * @param {String} chapter
 * @return {Object} contains chapter data
 */
export const loadChapterResource = function (bibleID, bookId, languageId, chapter) {
  try {
    let bibleData;
    let bibleFolderPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', bibleID); // ex. user/NAME/translationCore/resources/en/bibles/ult

    if (fs.existsSync(bibleFolderPath)) {
      let versionNumbers = fs.readdirSync(bibleFolderPath).filter(folder => // filter out .DS_Store
        folder !== '.DS_Store'
      ); // ex. v9
      const versionNumber = versionNumbers[versionNumbers.length - 1];
      let bibleVersionPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', bibleID, versionNumber);
      let fileName = chapter + '.json';

      if (fs.existsSync(path.join(bibleVersionPath, bookId, fileName))) {
        bibleData = {};
        let bibleChapterData = fs.readJsonSync(path.join(bibleVersionPath, bookId, fileName));

        for (let i = 0, len = Object.keys(bibleChapterData).length; i < len; i++) {
          const verse = Object.keys(bibleChapterData)[i];

          if (typeof verse !== 'string') {
            if (!verse.verseObjects) { // using old format so convert
              let newVerse = [];

              for (let word of verse) {
                if (word) {
                  if (typeof word !== 'string') {
                    newVerse.push(word);
                  } else {
                    newVerse.push({
                      'type': 'text',
                      'text': word,
                    });
                  }
                }
              }
              bibleChapterData[i] = newVerse;
            }
          }
        }

        bibleData[chapter] = bibleChapterData;
        // get bibles manifest file
        bibleData['manifest'] = ResourcesHelpers.getBibleManifest(bibleVersionPath, bibleID);
      } else {
        console.log('No such file or directory was found, ' + path.join(bibleVersionPath, bookId, fileName));
      }
    } else {
      console.log('Directory not found, ' + bibleFolderPath);
    }
    return bibleData;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Migrates the verses in a chapter to verse objects
 * @param chapterData
 * @return {*} a copy of the chapter data with verses formatted as objects.
 */
const migrateChapterToVerseObjects = chapterData => {
  const data = _.cloneDeep(chapterData);

  for (let verseNum of Object.keys(data)) {
    const verse = data[verseNum];

    if (typeof verse !== 'string') {
      if (!verse.verseObjects) { // using old format so convert
        let newVerse = [];

        for (let word of verse) {
          if (word) {
            if (typeof word !== 'string') {
              newVerse.push(word);
            } else {
              newVerse.push({
                'type': 'text',
                'text': word,
              });
            }
          }
        }
        data[verseNum] = newVerse;
      }
    }
  }
  return data;
};

/**
 * Loads an entire bible resource.
 * @param bibleId
 * @param bookId
 * @param languageId
 * @param version
 * @return {object}
 */
export const loadBookResource = (bibleId, bookId, languageId, version = null) => {
  try {
    const bibleFolderPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', bibleId); // ex. user/NAME/translationCore/resources/en/bibles/ult

    if (fs.existsSync(bibleFolderPath)) {
      const versionNumbers = fs.readdirSync(bibleFolderPath).filter(folder => folder !== '.DS_Store'); // ex. v9
      const versionNumber = version || versionNumbers[versionNumbers.length - 1];
      const bibleVersionPath = path.join(bibleFolderPath, versionNumber);
      const bookPath = path.join(bibleVersionPath, bookId);
      const cacheKey = 'book:' + bookPath;

      if (fs.existsSync(bookPath)) {
        let bibleData = bookCache.get(cacheKey);

        if (!bibleData) {
          // load bible
          bibleData = {};
          const files = fs.readdirSync(bookPath);

          for (let i = 0, len = files.length; i < len; i++) {
            const file = files[i];
            const chapterNumber = path.basename(file, '.json');

            if (!isNaN(chapterNumber)) {
              // load chapter
              const chapterData = fs.readJsonSync(path.join(bookPath, file));
              bibleData[chapterNumber] = migrateChapterToVerseObjects(chapterData);
            }
          }
          bibleData['manifest'] = ResourcesHelpers.getBibleManifest(bibleVersionPath, bibleId);

          // cache it
          bookCache.set(cacheKey, bibleData);
        }

        return bibleData;
      } else {
        console.warn(`Bible path not found: ${bookPath}`);
      }
    } else {
      console.log('Directory not found, ' + bibleFolderPath);
    }
    return null;
  } catch (error) {
    console.error(`Failed to load book. Bible: ${bibleId} Book: ${bookId} Language: ${languageId}`, error);
  }
};

/**
 * load a book of the bible into resources
 * @param bibleId
 * @param bookId
 * @param languageId
 * @param version
 * @return {Function}
 */
export const loadBibleBook = (bibleId, bookId, languageId, version = null) => (dispatch) => {
  const bibleData = loadBookResource(bibleId, bookId, languageId, version);

  if (bibleData) {
    dispatch(addNewBible(languageId, bibleId, bibleData));
  }
};

/**
 * Load all found books for a given language Id.
 * @param languageId
 * @return {Function}
 */
export const loadBiblesByLanguageId = (languageId) => (dispatch, getState) => {
  const bibleFolderPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles'); // ex. user/NAME/translationCore/resources/en/bibles/
  const bookId = getProjectBookId(getState());
  const bibles = getBibles(getState());
  // check if the languae id is already included in the bibles object.
  const isIncluded = Object.keys(bibles).includes(languageId);

  if (fs.existsSync(bibleFolderPath) && bookId) {
    const bibleIds = fs.readdirSync(bibleFolderPath).filter(file => file !== '.DS_Store');

    bibleIds.forEach(bibleId => {
      if (!isIncluded || !bibles[languageId][bibleId]) { //TRICKY: just because we have a bible in the language loaded does not mean we have all the bibles loaded
        dispatch(loadBibleBook(bibleId, bookId, languageId));
      }
    });
  }
};

/**
 * remove bible from resources
 * @param {Array} resources
 * @param {String} bibleId
 * @param {String} languageId
 */
function removeBibleFromList(resources, bibleId, languageId) {
  let pos = resources.findIndex(paneSetting =>
    ((paneSetting.bibleId === bibleId) && (paneSetting.languageId === languageId)));

  if (pos >= 0) {
    resources.splice(pos, 1); // remove entry already loaded
  }
}

/**
 * make sure we have selected the correct OL bible for testament that book is in.
 * @param {String} bookId
 * @return {Array} array of resource in scripture panel
 */
export const updateOrigLangPaneSettings = (bookId) => (dispatch, getState) => {
  const { bibleId: origLangBibleId } = BibleHelpers.getOrigLangforBook(bookId);
  const newCurrentPaneSettings = SettingsHelpers.getCurrentPaneSetting(getState());
  let changed = false;

  if (Array.isArray(newCurrentPaneSettings)) {
    const otherTestamentBible = BibleHelpers.isNewTestament(bookId) ? Bible.OT_ORIG_LANG_BIBLE : Bible.NT_ORIG_LANG_BIBLE;

    for (let setting of newCurrentPaneSettings) {
      let languageId = setting.languageId;

      if (languageId === ORIGINAL_LANGUAGE) {
        if (setting.bibleId !== origLangBibleId) { // if need to check if bibles are valid in case previous selected project was in the other testament
          // TRICKY: we only want to change the bibleId in the case that UGNT is in settings when we selected an OT book, or when UHB
          //          is in settings and we selected a NT book.  There may be other original language books loaded and we don't
          //          want to mess with them.
          if (setting.bibleId === otherTestamentBible) { // if the original language bible is from the opposite testament, we need to fix
            changed = true;
            setting.bibleId = origLangBibleId; // set original bible ID for current testament
          }
        }
      }
    }

    if (changed) {
      dispatch(SettingsActions.setToolSettings('ScripturePane', 'currentPaneSettings', newCurrentPaneSettings));
    }
  }
};

/**
 * make sure required bible books for current tool are loaded into resources
 */
export const makeSureBiblesLoadedForTool = () => (dispatch, getState) => {
  const toolName = getSelectedToolName(getState());
  const state = getState();
  const { bibles } = state.resourcesReducer;
  const contextId = getContext(state);
  const bookId = contextId && contextId.reference.bookId;
  dispatch(updateOrigLangPaneSettings(bookId));
  const resources = ResourcesHelpers.getResourcesNeededByTool(state, bookId, toolName);

  // remove bibles from resources list that are already loaded into resources reducer
  if (bookId && bibles && Array.isArray(resources)) {
    for (let languageId of Object.keys(bibles)) {
      if (bibles[languageId]) {
        for (let bibleId of Object.keys(bibles[languageId])) {
          const lang = (languageId === ORIGINAL_LANGUAGE) ?
            BibleHelpers.isOldTestament(bookId) ? Bible.OT_ORIG_LANG : Bible.NT_ORIG_LANG : languageId;
          removeBibleFromList(resources, bibleId, lang);
        }
      }
    }
  }

  // load resources not in resources reducer
  if (Array.isArray(resources)) {
    removeBibleFromList(resources, TARGET_BIBLE, TARGET_LANGUAGE);
    resources.forEach(paneSetting => dispatch(loadBibleBook(paneSetting.bibleId, bookId, paneSetting.languageId)));
  }
};

/**
 * Loads the target language book
 * @returns {Function}
 */
export function loadTargetLanguageBook() {
  return (dispatch, getState) => {
    const { projectDetailsReducer } = getState();
    const bookId = projectDetailsReducer.manifest.project.id;
    const projectPath = projectDetailsReducer.projectSaveLocation;
    const bookPath = path.join(projectPath, bookId);

    if (fs.existsSync(bookPath)) {
      const bookData = {};
      const files = fs.readdirSync(bookPath);

      for (let i = 0, len = files.length; i < len; i++) {
        const file = files[i];
        const chapterNumber = path.basename(file, '.json');

        if (!isNaN(chapterNumber)) {
          // load chapter
          bookData[chapterNumber] = fs.readJsonSync(
            path.join(bookPath, file));
        } else if (file === 'manifest.json') {
          // load manifest
          bookData['manifest'] = fs.readJsonSync(
            path.join(bookPath, file));
        }
      }

      const projectManifestPath = path.join(projectPath, 'manifest.json');

      if (fs.existsSync(projectManifestPath)) { // read user selections from manifest if present
        const manifest = fs.readJsonSync(projectManifestPath);

        if (manifest.target_language && manifest.target_language.id) {
          if (!bookData.manifest) {
            bookData.manifest = {};
          }
          bookData.manifest.language_id = manifest.target_language.id;
          bookData.manifest.language_name = manifest.target_language.name || manifest.target_language.id;
        }
      }

      dispatch(addNewBible(TARGET_LANGUAGE, TARGET_BIBLE, bookData));
    } else {
      console.warn(`Target book was not found at ${bookPath}`);
    }
  };
}

/**
 * Loads book data for each of the languages.
 * @param {string} bookId - the id of the book to load
 * @param {string} [toolName] - the tool name for which books will be loaded. If null the currently selected tool name is used.
 * @returns {Function}
 */
export const loadBookTranslations = (bookId, toolName = null) => (dispatch, getState) => {
  if (toolName === null) {
    toolName = getSelectedToolName(getState());
  }

  // translations of the source book
  dispatch(loadSourceBookTranslations(bookId, toolName));

  // target book
  dispatch(loadTargetLanguageBook());
};

/**
 * Loads the translations of the source book required by the tool.
 * @param {string} bookId - the id of the source book to load
 * @param {string} toolName - the name of the tool for which the translations will be loaded.
 * @returns {Function}
 */
export const loadSourceBookTranslations = (bookId, toolName) => (dispatch, getState) => {
  dispatch(updateOrigLangPaneSettings(bookId));

  const resources = ResourcesHelpers.getResourcesNeededByTool(getState(), bookId, toolName);
  const bibles = getBibles(getState());
  // Filter out bible resources that are already in the resources reducer
  const filteredResources = resources.filter(resource => {
    const isOriginalLanguage = BibleHelpers.isOriginalLanguageBible(resource.languageId, resource.bibleId);
    const languageId = isOriginalLanguage ? ORIGINAL_LANGUAGE : resource.languageId; // TRICKY: the original language can have many bibles, but only one we can use as reference
    const biblesForLanguage = bibles[languageId];
    return !(biblesForLanguage && biblesForLanguage[resource.bibleId]);
  });

  for (let i = 0, len = filteredResources.length; i < len; i++) {
    const resource = filteredResources[i];
    dispatch(loadBibleBook(resource.bibleId, bookId, resource.languageId));
  }
};

/**
 * @description - Get the lexicon entry and add it to the reducer
 * @param {String} resourceType - the type of resource to populate
 * @param {String} articleId - the id of the article to load into the reducer
 * @param {String} languageId = the id of the resource language
 * @param {String} category = The category of this tW or tA, e.g. kt, other, translate. Can be blank
 */
export const loadResourceArticle = (resourceType, articleId, languageId, category='') => ((dispatch) => {
  ResourcesHelpers.loadArticleDataAsync(resourceType, articleId, languageId, category).then((articleData) => {
    // populate reducer with markdown data
    dispatch({
      type: consts.ADD_TRANSLATIONHELPS_ARTICLE,
      resourceType,
      articleId,
      languageId,
      articleData,
    });
  });
});

/**
 * @description - Get the lexicon entry and add it to the reducer
 * @param {String} lexiconId - the id of the lexicon to populate
 * @param {Number} entryId - the number of the entry
 */
export const loadLexiconEntry = (lexiconId, entryId) => ((dispatch) => {
  try {
    let languageId = 'en';
    let resourceVersion = 'v0';
    // generate path from resourceType and articleId
    let lexiconPath = path.join(USER_RESOURCES_PATH, languageId, 'lexicons', lexiconId, resourceVersion, 'content');
    let entryPath = path.join(lexiconPath, entryId + '.json');
    let entryData;

    if (fs.existsSync(entryPath)) {
      entryData = fs.readJsonSync(entryPath, 'utf8'); // get file from fs
    }
    // populate reducer with markdown data
    dispatch({
      type: consts.ADD_LEXICON_ENTRY,
      lexiconId,
      entryId,
      entryData,
    });
  } catch (error) {
    console.error(error);
  }
});
