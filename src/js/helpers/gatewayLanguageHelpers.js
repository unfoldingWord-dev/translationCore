import fs from 'fs-extra';
import path from "path-extra";
import _ from 'lodash';

import * as groupsIndexHelpers from './groupsIndexHelpers';
import {getLanguageByCodeSelection, sortByNamesCaseInsensitive} from "./LanguageHelpers";
import {isNtBook} from "./ToolCardHelpers";
import * as ResourcesHelpers from "./ResourcesHelpers";

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

    case 'translationNotes':
      helpsRequired = ['translationHelps/translationNotes', 'translationHelps/translationAcademy'];
      break;
  }
  return helpsRequired;
}

/**
 * Returns an alphabetical list of Gateway Languages
 * @param {string} bookId - optionally filter on book
 * @param {String} toolName
 * @return {Object} set of supported languages
 */
export function getGatewayLanguageList(bookId = null, toolName = null) {
  const helpsCheck = getRequiredHelpsForTool(toolName);
  const languageBookData = getSupportedResourceLanguageList(bookId, helpsCheck);
  const supportedLanguages = Object.keys(languageBookData).map(code => {
    let lang = getLanguageByCodeSelection(code);
    if (lang) {
      lang = _.cloneDeep(lang); // make duplicate before modifying
      const bookData = languageBookData[code];
      lang.default_literal = bookData.default_literal;
      lang.bibles = bookData.bibles;
      lang.lc = lang.code; // UI expects language code in lc
    }
    return lang;
  });
  return sortByNamesCaseInsensitive(supportedLanguages);
}

/**
 * verify that resource is present and meets requirements
 * @param {String} resourcePath
 * @param {String} bookId
 * @param {int} minCheckingLevel - checked if non-zero
 * @return {Boolean}
 */
function hasResource(resourcePath, bookId, minCheckingLevel) {
  const ultManifestPath = path.join(resourcePath, 'manifest.json');
  const bookPath = path.join(resourcePath, bookId);
  let validResource = fs.pathExistsSync(ultManifestPath) && fs.pathExistsSync(bookPath);
  if (validResource) {
    let files = ResourcesHelpers.getFilesInResourcePath(bookPath, '.json');
    validResource = files && files.length; // if book has files in it
    if (validResource && minCheckingLevel) {
      const manifest = ResourcesHelpers.getBibleManifest(resourcePath, bookId);
      validResource = manifest && manifest.checking && manifest.checking.checking_level;
      validResource = validResource && (manifest.checking.checking_level >= minCheckingLevel);
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
 * Returns a list of Gateway Languages supported for book
 * @param {string} bookId - optionally filter on book
 * @param {Array} helpsChecks - array of helps to check for
 * @return {Object} set of supported languages
 */
export function getSupportedResourceLanguageList(bookId = null, helpsChecks = null) {
  const allLanguages = ResourcesHelpers.getAllLanguageIdsFromResourceFolder(true) || [];
  const filteredLanguages = {};
  for (let language of allLanguages) {
    const languagePath = path.join(ResourcesHelpers.USER_RESOURCES_PATH, language);
    const biblesPath = path.join(languagePath, 'bibles');
    let bibles = fs.readdirSync(biblesPath);
    const validBibles = bibles.filter(bible => {
      let helpsValid = false;
      let ultPath = getValidResourcePath(biblesPath, bible);
      if (ultPath) {
        if (!helpsChecks || !helpsChecks.length) { // if no resource checking given, we add empty check
          helpsChecks = [ null ];
        }
        helpsValid = true;
        for (let helpsCheck of helpsChecks) {
          helpsValid = helpsValid && (!helpsCheck || getValidResourcePath(languagePath, helpsCheck));
          if (helpsValid) {
            if (!bookId) { // if not filtering by book, is good enough
              continue;
            }
            const originalSubPath = isNtBook(bookId) ? 'grc/bibles/ugnt' : 'he/bibles/uhb';
            const origPath = getValidResourcePath(ResourcesHelpers.USER_RESOURCES_PATH, originalSubPath);
            // Tricky:  the TW is now extracted from the UGNT. So for twChecking, we also have to validate that the UGNT/UHB
            //    has the right checking level
            const isValidOrig = origPath && hasResource(origPath, bookId, helpsCheck ? 2 : 0);

            // make sure resource for book is present and has the right checking level
            const isValidUlt = ultPath && hasResource(ultPath, bookId, helpsCheck ? 3 : 0);
            //TODO: add checking for alignment data in bible
            helpsValid = helpsValid && isValidUlt && isValidOrig;
          }
        }
      }
      return helpsValid;
    });
    if (validBibles.length) {
      const default_literal = validBibles[0]; // TODO: filter for best if more than one valid bible
      filteredLanguages[language] = {
        default_literal,
        bibles: validBibles
      };
    }
  }
  return filteredLanguages;
}
