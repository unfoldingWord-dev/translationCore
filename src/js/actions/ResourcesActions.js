/* eslint-disable no-console */
import consts from './ActionTypes';
import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
// actions
import * as TargetLanguageActions from './TargetLanguageActions';
import * as WordAlignmentLoadActions from './WordAlignmentLoadActions';
// helpers
import * as ResourcesHelpers from '../helpers/ResourcesHelpers';
import * as BibleHelpers from '../helpers/bibleHelpers';
// constant declaraton
const USER_RESOURCES_PATH = path.join(ospath.home(), 'translationCore/resources');

/**
 * @description adds a bible to the resoiurces reducer' bibles property.
 * @param {string} bibleName - name/label for bible.
 * @param {object} bibleData - data being saved in the bible property.
 */
export const addNewBible = (bibleName, bibleData) => {
  return {
    type: consts.ADD_NEW_BIBLE_TO_RESOURCES,
    bibleName,
    bibleData
  };
};

/**
 * get chapter from specific resource
 * @param {string} bibleID
 * @param {string} bookId
 * @param {string} languageId
 * @param {string} chapter
 * @return {Object} contains chapter data
 */
export const loadChapterResource = function (bibleID, bookId, languageId, chapter) {
  let bibleData;
  let bibleFolderPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', bibleID); // ex. user/NAME/translationCore/resources/en/bibles/ulb
  if (fs.existsSync(bibleFolderPath)) {
    let versionNumbers = fs.readdirSync(bibleFolderPath).filter(folder => { // filter out .DS_Store
      return folder !== '.DS_Store';
    }); // ex. v9
    const versionNumber = versionNumbers[versionNumbers.length - 1];
    let bibleVersionPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', bibleID, versionNumber);
    // get bibles manifest file
    let bibleManifest = ResourcesHelpers.getBibleManifest(bibleVersionPath, bibleID);
    // save manifest data in bibleData object
    bibleData = {};
    bibleData["manifest"] = bibleManifest;
    let fileName = chapter + '.json';
    if (fs.existsSync(path.join(bibleVersionPath, bookId, fileName))) {
      let bibleChapterData = fs.readJsonSync(path.join(bibleVersionPath, bookId, fileName));

      for (let verseNum of Object.keys(bibleChapterData)) {
        const verse = bibleChapterData[verseNum];
        if (typeof verse !== 'string') {
          if (!verse.verseObjects) { // using old format so convert
            let newVerse = [];
            for (let word of verse) {
              if (word) {
                if (typeof word !== 'string') {
                  newVerse.push(word);
                }
                else {
                  newVerse.push({
                    "type": "text",
                    "text": word
                  });
                }
              }
            }
            bibleChapterData[verseNum] = newVerse;
          }
        }
      }

      bibleData[chapter] = bibleChapterData;
      // get bibles manifest file
      const bibleManifest = ResourcesHelpers.getBibleManifest(bibleVersionPath, bibleID);
      // save manifest data in bibleData object
      bibleData["manifest"] = bibleManifest;
    } else {
      console.log('No such file or directory was found, ' + path.join(bibleVersionPath, bookId, fileName));
    }
  } else {
    console.log('Directory not found, ' + bibleFolderPath);
  }
  return bibleData;
};

/**
 * @description loads a bibles chapter based on contextId
 * @param {object} contextId - object with all data for current check.
 */
export const loadBiblesChapter = (contextId) => {
  return ((dispatch, getState) => {
    try {
      let bookId = contextId.reference.bookId; // bible book abbreviation.
      let chapter = contextId.reference.chapter;
      const { currentToolName } = getState().toolsReducer;

      let languagesIds = ['en']; // english, greek, hebrew.
      // if its an old testament project then add hebrew to languagesIds array
      if (BibleHelpers.isOldTestament(bookId)) {
        languagesIds.push('he');
      } else {
        // else if its a new testament project then add greek to languagesIds array
        languagesIds.push('grc');
      }

      languagesIds.forEach((languageId) => {
        const biblesPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles');
        if(!fs.existsSync(biblesPath)) {
          console.log('Directory not found, ' + biblesPath);
          return;
        }
        let biblesFolders = fs.readdirSync(biblesPath).filter(folder => { // filter out .DS_Store
          return (folder !== '.DS_Store');
        });
        biblesFolders.forEach((bibleID) => {
          const bibleData = loadChapterResource(bibleID, bookId, languageId, chapter);
          if (bibleData) {
            dispatch({
              type: consts.ADD_NEW_BIBLE_TO_RESOURCES,
              bibleName: bibleID,
              bibleData
            });
          }
        });
      });
      // Then load target language bible
      dispatch(TargetLanguageActions.loadTargetLanguageChapter(chapter));
      if (currentToolName === 'wordAlignment') {
        dispatch(WordAlignmentLoadActions.loadAlignmentData());
      }
    } catch(err) {
      console.warn(err);
    }
  });
};
/**
 * @description - Get the lexicon entry and add it to the reducer
 * @param {String} resourceType - the type of resource to populate
 * @param {String} articleId - the id of the article to load into the reducer
 */
export const loadResourceArticle = (resourceType, articleId) => {
  return ((dispatch) => {
    let languageId = 'en';
    let resourceVersion = resourceType === 'translationWords' ? 'v6' : 'v0';
    // generate path from resourceType and articleId
    let resourceFilename = articleId + '.md';
    let articlesPath = resourceType === 'translationWords' ? path.join('kt', 'articles', resourceFilename) : path.join('content', resourceFilename);
    let resourcePath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps', resourceType, resourceVersion, articlesPath);
    let articleData;
    if (fs.existsSync(resourcePath)) {
      articleData = fs.readFileSync(resourcePath, 'utf8'); // get file from fs
    } else {
      // if article isnt found in the kt folder (key terms) then try to find it in the other folder.
      resourcePath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps', resourceType, resourceVersion, 'other', 'articles', resourceFilename);
      articleData = fs.readFileSync(resourcePath, 'utf8'); // get file from fs
    }
    // populate reducer with markdown data
    dispatch({
      type: consts.ADD_TRANSLATIONHELPS_ARTICLE,
      resourceType,
      articleId,
      articleData
    });
  });
};
/**
 * @description - Get the lexicon entry and add it to the reducer
 * @param {String} lexiconId - the id of the lexicon to populate
 * @param {Int} entryId - the number of the entry
 */
export const loadLexiconEntry = (lexiconId, entryId) => {
  return ((dispatch) => {
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
      entryData
    });
  });
};
/**
 * @description gets the resources from the static folder located in the tC codebase.
 */
export const getResourcesFromStaticPackage = (force) => {
  ResourcesHelpers.getBibleFromStaticPackage(force);
  ResourcesHelpers.getTHelpsFromStaticPackage(force);
  ResourcesHelpers.getLexiconsFromStaticPackage(force);
};
