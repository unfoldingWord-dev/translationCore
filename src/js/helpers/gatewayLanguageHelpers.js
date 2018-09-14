import fs from 'fs-extra';
import path from "path-extra";
import _ from 'lodash';

import * as groupsIndexHelpers from './groupsIndexHelpers';
import {getLanguageByCodeSelection, sortByNamesCaseInsensitive} from "./LanguageHelpers";
import * as ResourcesHelpers from "./ResourcesHelpers";
import * as BibleHelpers from "./bibleHelpers";

export const DEFAULT_GATEWAY_LANGUAGE = 'en';

/**
 *
 * @param {Object} state - current state
 * @param {Object} contextId - optional contextId to use, otherwise uses current
 * @return {{gatewayLanguageCode: *, gatewayLanguageQuote: *}}
 */
export const getGatewayLanguageCodeAndQuote = (state, contextId = null) => {
  const { currentProjectToolsSelectedGL } = state.projectDetailsReducer;
  const { currentToolName } = state.toolsReducer;
  const { groupsIndex } = state.groupsIndexReducer;
  const { groupId } = contextId || state.contextIdReducer.contextId;
  const gatewayLanguageCode = currentProjectToolsSelectedGL[currentToolName];
  const gatewayLanguageQuote = groupsIndexHelpers.getGroupFromGroupsIndex(groupsIndex, groupId).name;

  return {
    gatewayLanguageCode,
    gatewayLanguageQuote
  };
};

/**
 * get the gateway language code for current tool.  Returns null if error
 * @param {Object} state - current state
 * @return {String|null} current gateway language code
 */
export const getGatewayLanguageCode = (state) => {
  const currentProjectToolsSelectedGL = state.projectDetailsReducer && state.projectDetailsReducer.currentProjectToolsSelectedGL;
  const currentToolName = state.toolsReducer && state.toolsReducer.currentToolName;
  const gatewayLanguageCode = currentProjectToolsSelectedGL && currentProjectToolsSelectedGL[currentToolName];
  return gatewayLanguageCode;
};

/**
 * lookup required helps for tool
 * @param toolName
 * @return {*}
 */
export function getRequiredHelpsForTool(toolName) {
  let helpsRequired = null;
  switch (toolName) {
    case 'wordAlignment':
    default:
      helpsRequired = [];
      break;

    case 'translationWords':
      helpsRequired = ['translationHelps/translationWords'];
      break;
    // case 'translationNotes':
    //   helpsRequired = ['translationHelps/translationNotes', 'translationHelps/translationAcademy'];
    //   break;
  }
  return helpsRequired;
}

/**
 * Returns an alphabetical list of Gateway Languages.  This list is determined by iterating through each language
 *          in resources and then each bible in that language to make sure that at least one bible is supported
 *          in that language.
 *          See getValidGatewayBibles() for rules that determine if a bible can be used as gateway source.
 *
 * @param {String|null} bookId - optionally filter on book
 * @param {String} toolName
 * @return {Object} set of supported languages
 */
export function getGatewayLanguageList(bookId = null, toolName = null) {
  const helpsCheck = getRequiredHelpsForTool(toolName);
  const forceLanguageId = (toolName === 'wordAlignment') ? 'en' : null;
  const languageBookData = getSupportedGatewayLanguageResourcesList(bookId, helpsCheck, forceLanguageId);
  const supportedLanguageCodes = Object.keys(languageBookData);
  const supportedLanguages = supportedLanguageCodes.map(code => {
    let lang = getLanguageByCodeSelection(code);
    if (!lang && (code === 'grc')) { // add special handling for greek - even though it is an Original Language, it can be used as a gateway Language also
      lang = {
        code,
        name: 'Greek',
        ltr: true
      };
    }
    if (lang) {
      lang = _.cloneDeep(lang); // make duplicate before modifying
      const bookData = languageBookData[code];
      lang.default_literal = bookData.default_literal;
      lang.bibles = bookData.bibles;
      lang.lc = lang.code; // UI expects language code in lc
    }
    return lang;
  });
  return sortByNamesCaseInsensitive(supportedLanguages.filter(lang => lang));
}

/**
 * look for alignments in book.  Check first chapter and iterate through verseObjects.
 *    Return true when first alignment is found.
 * @param {Array} chapters
 * @param {String} bookPath
 * @return {*}
 */
function seeIfBookHasAlignments(chapters, bookPath) {
  let file = chapters.sort().find(item => (item.indexOf('1.') >= 0));
  if (!file) { // if couldn't find chapter one, fall back to first file found
    file = chapters[0];
  }
  if (file) {
    try {
      const chapter1 = fs.readJSONSync(path.join(bookPath, file));
      for (let verseNum of Object.keys(chapter1)) {
        const verse = chapter1[verseNum];
        if (verse && verse.verseObjects) {
          for (let vo of verse.verseObjects) {
            if (vo.tag === "zaln") { // verse has alignments
              return true;
            }
          }
        }
      }
    } catch (e) {
      // read or parse error
    }
  }
  return false;
}

/**
 * verify that resource is present and meets requirements that it has manifest.json, optionally meets checking level,
 *    and optionally has alignment data
 *
 * @param {String} resourcePath
 * @param {String} bookId
 * @param {int} minCheckingLevel - checked if non-zero
 * @param {Boolean} needsAlignmentData - if true, we ensure that resource contains alignment data
 * @return {Boolean}
 */
function isValidResource(resourcePath, bookId, minCheckingLevel, needsAlignmentData = false) {
  const ultManifestPath = path.join(resourcePath, 'manifest.json');
  const bookPath = path.join(resourcePath, bookId);
  let validResource = fs.pathExistsSync(ultManifestPath) && fs.pathExistsSync(bookPath);
  if (validResource) {
    let files = ResourcesHelpers.getFilesInResourcePath(bookPath, '.json');
    validResource = files && files.length; // if book has files in it
    if (validResource && minCheckingLevel) { // should we validate checking level
      const manifest = ResourcesHelpers.getBibleManifest(resourcePath, bookId);
      validResource = manifest && manifest.checking && manifest.checking.checking_level;
      validResource = validResource && (manifest.checking.checking_level >= minCheckingLevel);
    }
    if (validResource && needsAlignmentData) { // shoud we validate alignment data
      validResource = seeIfBookHasAlignments(files, bookPath, validResource);
    }
  }
  return validResource;
}

/**
 * does some basic validation checking that langPath+subPath is a resource folder and returns path to latest
 *  resource
 *
 * @param {String} langPath
 * @param {String} subpath
 * @return {String} resource version path
 */
function getValidResourcePath(langPath, subpath) {
  const validPath = ResourcesHelpers.getLatestVersionInPath(path.join(langPath, subpath));
  if (validPath) {
    const subFolders = ResourcesHelpers.getFoldersInResourceFolder(validPath);
    if (subFolders && subFolders.length) { // make sure it has subfolders
      return validPath;
    }
  }
  return null;
}

/**
 * get path for OL of book
 * @param {String} bookId - book to look up
 * @return {String}
 */
export function getOlBookPath(bookId) {
  const {languageId, bibleId} = BibleHelpers.getOLforBook(bookId);
  const originalSubPath = `${languageId}/bibles/${bibleId}`;
  const origPath = getValidResourcePath(ResourcesHelpers.USER_RESOURCES_PATH, originalSubPath);
  return origPath;
}

/**
 * test to make sure book has valid OL
 * @param {String} bookId - book to look up
 * @param checkingHelps
 * @return {Boolean}
 */
export function hasValidOL(bookId, checkingHelps = true) {
  const origPath = getOlBookPath(bookId);
  const isValidOrig = origPath && isValidResource(origPath, bookId, checkingHelps ? 2 : 0);
  return isValidOrig;
}

/**
 * Returns a list of Gateway Languages bibles supported for book.  This list is determined by iterating through each
 *          bible in the language to make sure that at least one bible is supported.
 *          Supported books meet the following requirements
 *
 *    for WA tool (no helpsChecks):
 *      - supported bible:
 *          - contains the book, and which must have alignments
 *          - bible has a manifest
 *      - the book must also be present in the Original Language (such as grc).
 *    for other tools (with helpsChecks) have the requirements above plus:
 *       - the Original Language for book must be at least checking level 2 (in manifest).
 *       - the aligned bible in the gateway Language:
 *           - must be at least checking level 3 (in manifest).
 *           - all folder subpaths in helpsChecks must be present
 *
 * @param {String} toolName - name of current tool
 * @param {String} langCode - language to check
 * @param {string} bookId - optionally filter on book
 * @return {Array} valid bibles that can be used for Gateway language
 */
export function getValidGatewayBiblesForTool(toolName, langCode, bookId) {
  const helpsChecks = getRequiredHelpsForTool(toolName);
  const validBibles = getValidGatewayBibles(langCode, bookId, helpsChecks);
  return validBibles;
}

/**
 * Returns a list of Gateway Languages bibles supported for book.  This list is determined by iterating through each
 *          bible in the language to make sure that at least one bible is supported.
 *          Supported books meet the following requirements
 *
 *    for WA tool (no helpsChecks):
 *      - supported bible:
 *          - contains the book, and which must have alignments
 *          - bible has a manifest
 *      - the book must also be present in the Original Language (such as grc).
 *    for other tools (with helpsChecks) have the requirements above plus:
 *       - the Original Language for book must be at least checking level 2 (in manifest).
 *       - the aligned bible in the gateway Language:
 *           - must be at least checking level 3 (in manifest).
 *           - all folder subpaths in helpsChecks must be present
 *
 * @param {String} langCode - language to check
 * @param {string} bookId - optionally filter on book
 * @param {Array|null} helpsChecks - array of helps to check for (subpaths to the helps folders that must exist)
 * @return {Array} valid bibles that can be used for Gateway language
 */
export function getValidGatewayBibles(langCode, bookId, helpsChecks=null) {
  const languagePath = path.join(ResourcesHelpers.USER_RESOURCES_PATH, langCode);
  const biblesPath = path.join(languagePath, 'bibles');
  const bibles = fs.existsSync(biblesPath) ? fs.readdirSync(biblesPath) : [];
  const validBibles = bibles.filter(bible => {
    if (!fs.lstatSync(path.join(biblesPath, bible)).isDirectory()) { // verify it's a valid directory
      return false;
    }
    let isBibleValidSource = false;
    let biblePath = getValidResourcePath(biblesPath, bible);
    if (biblePath) {
      isBibleValidSource = true;
      const checkingHelps = helpsChecks && helpsChecks.length;
      if (checkingHelps) { // if no resource checking given, we add empty check
        for (let helpsCheck of helpsChecks) {
          isBibleValidSource = isBibleValidSource && (!helpsCheck || getValidResourcePath(languagePath, helpsCheck));
        }
      }
      if (isBibleValidSource) {
        if (bookId) { // if filtering by book
          const isValidOrig = hasValidOL(bookId, checkingHelps);
          isBibleValidSource = isBibleValidSource && isValidOrig;

          // make sure resource for book is present and has the right checking level
          const isValidUlt = biblePath && isValidResource(biblePath, bookId, 3, true);
          isBibleValidSource = isBibleValidSource && isValidUlt;
        }
      }
    }
    return isBibleValidSource;
  });
  return validBibles;
}

/**
 * Returns a list of Gateway Languages supported for book.  This list is determined by iterating through each language
 *          in resources and then each bible in that language to make sure that at least one bible is supported
 *          in that language.
 *          See getValidGatewayBibles() for rules that determine if a bible can be used as gateway source.
 *
 * @param {String|null} bookId - optionally filter on book
 * @param {Array|null} helpsChecks - array of helps to check for (subpaths to the helps folders that must exist)
 * @param {String|null} forceLanguageId - if not null, then add this language code
 * @return {Object} set of supported languages and their supported bibles
 */
export function getSupportedGatewayLanguageResourcesList(bookId = null, helpsChecks = null, forceLanguageId = null) {
  const allLanguages = ResourcesHelpers.getAllLanguageIdsFromResourceFolder(true) || [];
  const filteredLanguages = {};
  for (let language of allLanguages) {
    const validBibles = getValidGatewayBibles(language, bookId, helpsChecks);
    if (validBibles && validBibles.length) {
      const default_literal = validBibles[0];
      filteredLanguages[language] = {
        default_literal,
        bibles: validBibles
      };
    }
  }
  if (forceLanguageId && !Object.keys(filteredLanguages).length) { // TODO: this is a temporary fix to be removed later
    filteredLanguages[forceLanguageId] = {
      default_literal: 'ult',
      bibles: ['ult']
    };
  }
  return filteredLanguages;
}
