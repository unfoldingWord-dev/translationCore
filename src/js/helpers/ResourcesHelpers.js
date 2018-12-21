/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
import AdmZip from 'adm-zip';
// helpers
import * as BibleHelpers from './bibleHelpers';
import {getTranslation} from "./localizationHelpers";
import {getValidGatewayBiblesForTool} from "./gatewayLanguageHelpers";
import * as SettingsHelpers from './SettingsHelpers';
import {
  getContext,
  getSelectedToolName,
  getToolGatewayLanguage
} from "../selectors";
import _ from "lodash";
// constants
export const USER_RESOURCES_PATH = path.join(ospath.home(), 'translationCore', 'resources');
export const STATIC_RESOURCES_PATH = path.join(__dirname, '../../../tcResources');

/**
 *
 * @param {Object} currentProjectToolsSelectedGL Specifys which tools are using which gateway language
 * i.e. {"translationWords":"en"}
 */
export const getAvailableToolCategories = (currentProjectToolsSelectedGL) => {
  const availableCategories = {};
  Object.keys(currentProjectToolsSelectedGL).forEach((toolName) => {
    const gatewayLanguage = currentProjectToolsSelectedGL[toolName] || 'en';
    const toolResourceDirectory = path.join(ospath.home(), 'translationCore', 'resources', gatewayLanguage, 'translationHelps', toolName);
    const versionDirectory = getLatestVersionInPath(toolResourceDirectory) || toolResourceDirectory;
    if (fs.existsSync(versionDirectory))
      availableCategories[toolName] = fs.readdirSync(versionDirectory).filter((dirName)=>
        fs.lstatSync(path.join(versionDirectory, dirName)).isDirectory()
      );
      if (availableCategories[toolName] && availableCategories[toolName].indexOf('other') === availableCategories[toolName].length - 1) {
       var otherCat = availableCategories[toolName].splice(availableCategories[toolName].length - 1, availableCategories[toolName].length );
       availableCategories[toolName].splice(1, 0, ...otherCat);
      }
    else availableCategories[toolName] = [];
  });
  return availableCategories;
};

/**
 * @description gets the resources from the static folder located in the tC codebase.
 */
export const getResourcesFromStaticPackage = (force) => {
  copySourceContentUpdaterManifest();
  getBibleFromStaticPackage(force);
  getTHelpsFromStaticPackage(force);
  getLexiconsFromStaticPackage(force);
};

/**
 * copies the source-content-updater-manifest.json from tc to the users folder
 */
export const copySourceContentUpdaterManifest = () => {
  const sourceContentUpdaterManifestPath = path.join(STATIC_RESOURCES_PATH, 'source-content-updater-manifest.json');
  if (fs.existsSync(sourceContentUpdaterManifestPath)) {
    const destinationPath = path.join(USER_RESOURCES_PATH, 'source-content-updater-manifest.json');
    fs.copySync(sourceContentUpdaterManifestPath, destinationPath);
  }
};

/**
 * Moves all bibles from the static folder to the user's translationCore folder.
 */
export function getBibleFromStaticPackage(force = false) {
  try {
    const languagesIds = getAllLanguageIdsFromResourceFolder(false);
    languagesIds.forEach((languageId) => {
      const STATIC_RESOURCES_BIBLES_PATH = path.join(STATIC_RESOURCES_PATH, languageId, 'bibles');
      if (fs.existsSync(STATIC_RESOURCES_BIBLES_PATH)) {
        const BIBLE_RESOURCES_PATH = path.join(USER_RESOURCES_PATH, languageId, 'bibles');
        const bibleIds = fs.readdirSync(STATIC_RESOURCES_BIBLES_PATH).filter(folder => folder !== '.DS_Store');
        bibleIds.forEach((bibleId) => {
          let bibleSourcePath = path.join(STATIC_RESOURCES_BIBLES_PATH, bibleId);
          let bibleDestinationPath = path.join(BIBLE_RESOURCES_PATH, bibleId);
          if (!fs.existsSync(bibleDestinationPath) || force) {
            fs.copySync(bibleSourcePath, bibleDestinationPath);
          }
          extractZippedBooks(bibleDestinationPath);
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
}

export const extractZippedBooks = (bibleDestinationPath) => {
  const versionPath = getLatestVersionInPath(bibleDestinationPath);
  const booksZipPath = path.join(versionPath, 'books.zip');
  const zip = new AdmZip(booksZipPath);
  zip.extractAllTo(versionPath, /*overwrite*/true);
  fs.removeSync(booksZipPath);
};

/**
 * @description moves all translationHelps from the static folder to the resources folder in the translationCore folder.
 */
export function getTHelpsFromStaticPackage(force = false) {
  getAllLanguageIdsFromResourceFolder(false).forEach(languageId => {
    try {
      const staticTranslationHelpsPath = path.join(STATIC_RESOURCES_PATH, languageId, 'translationHelps');
      if (fs.existsSync(staticTranslationHelpsPath)) {
        const userTranslationHelpsPath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps');
        const tHelpsNames = fs.readdirSync(staticTranslationHelpsPath);
        tHelpsNames.forEach((tHelpName) => {
          let tHelpSourcePath = path.join(staticTranslationHelpsPath, tHelpName);
          let tHelpDestinationPath = path.join(userTranslationHelpsPath, tHelpName);
          if (!fs.existsSync(tHelpDestinationPath) || force) {
            fs.copySync(tHelpSourcePath, tHelpDestinationPath);
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

/**
 * @description moves all translationHelps from the static folder to the resources folder in the translationCore folder.
 */
export function getLexiconsFromStaticPackage(force = false) {
  try {
    const languageId = 'en';
    const staticPath = path.join(STATIC_RESOURCES_PATH, languageId, 'lexicons');
    const userPath = path.join(USER_RESOURCES_PATH, languageId, 'lexicons');
    const folders = fs.readdirSync(staticPath);
    folders.forEach((folder) => {
      let sourcePath = path.join(staticPath, folder);
      let destinationPath = path.join(userPath, folder);
      if(!fs.existsSync(destinationPath) || force) {
        fs.copySync(sourcePath, destinationPath);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * @description - Auto generate the chapter index since more projects will use it
 * @param {function} translate
 */
export const chapterGroupsIndex = (translate) => {
  const chapterLocalized = getTranslation(translate, "tools.chapter", 'Chapter');
  const groupsIndex = Array(150).fill().map((_, i) => {
    let chapter = i + 1;
    return {
      id: 'chapter_' + chapter,
      name: chapterLocalized + ' ' + chapter
    };
  });
  return groupsIndex;
};

/**
 * @description This function writes the groups data from the user resources folder to the project.
 * If the user already has some checks that are present in the project folder then it will not erase those
 * but simply skip them.
 * @param {String} toolName - the name of the tool selected i.e. "translationWords"
 * @param {String} groupsDataDirectory - the folder path of the users projects groups
 *  i.e. "~/translaionCore/projects/en_reg_mat/.apps/translationCore/index/translationWords/mat"
 * @param {String} bookAbbreviation - The current project book abbreviation i.e. "mat"
 * @param {String} category - The current category to load groups data for i.e. "kt"
 */
export function copyGroupsDataToProjectResources(toolName, groupsDataDirectory, bookAbbreviation, category = 'kt') {
  /** This will be used to create a full path to the groups in the resource folder*/
  let groupsFolderPath;
  const languageId = toolName === 'translationWords' ? 'grc' : 'en';
  if (toolName === 'translationWords') {
    groupsFolderPath = path.join(category, 'groups', bookAbbreviation);
  } else {
    groupsFolderPath = path.join('groups', bookAbbreviation);
  }
  const toolResourcePath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps', toolName);
  const versionPath = getLatestVersionInPath(toolResourcePath) || toolResourcePath;
  const groupsDataSourcePath = path.join(versionPath, groupsFolderPath);
  if (fs.existsSync(groupsDataSourcePath)) {
    //There are translationHelps for the selected tool/project combination
    if (fs.existsSync(groupsDataDirectory)) {
      //The user already has a groups data folder created
      //Need to only copy what the user doesn't have
      let groupsPreviouslyLoaded = fs.readdirSync(groupsDataDirectory);
      groupsPreviouslyLoaded = groupsPreviouslyLoaded.filter((fileName) =>
        path.extname(fileName) === '.json' && fileName[0] !== '.');
      const groupsFromResourceFolder = fs.readdirSync(groupsDataSourcePath).filter((folderName) => folderName[0] !== '.');
      groupsFromResourceFolder.forEach((groupToLoad) => {
        if (!groupsPreviouslyLoaded.includes(groupToLoad)) {
          fs.copySync(path.join(groupsDataSourcePath, groupToLoad), path.join(groupsDataDirectory, groupToLoad));
        }
      });
    } else {
      //If the user has no previous groups loaded
      //copying the entire groups data folder from the resources
      fs.copySync(groupsDataSourcePath, groupsDataDirectory);
    }
  } else {
    //The only use case for this at the moment is wordAlignment
    const groupsData = chapterGroupsData(bookAbbreviation, toolName);
    groupsData.forEach(groupData => {
      const groupId = groupData[0].contextId.groupId;
      const chapterIndexPath = path.join(groupsDataDirectory, groupId + '.json');
      fs.outputFileSync(chapterIndexPath, JSON.stringify(groupData, null, 2));
    });
    console.log("Chapter Groups Data generated. translationHelps resources path was not found, " + groupsDataSourcePath);
  }
}
/**
 * @description - Auto generate the chapter index since more projects will use it
 * @param {String} bookId - id of the current book
 * @param {String} toolName - id of the current tool
 */
export const chapterGroupsData = (bookId, toolName) => {
  let groupsData = [];
  let ultPath = path.join(STATIC_RESOURCES_PATH, 'en', 'bibles', 'ult');
  let versionPath = getLatestVersionInPath(ultPath) || ultPath;
  const ultIndexPath = path.join(versionPath, 'index.json');
  if (fs.existsSync(ultIndexPath)) { // make sure it doens't crash if the path doesn't exist
    const ultIndex = fs.readJsonSync(ultIndexPath); // the index of book/chapter/verses
    const bookData = ultIndex[bookId]; // get the data in the index for the current book
    groupsData = Array(bookData.chapters).fill().map((_, i) => { // create array from number of chapters
      const chapter = i + 1; // index is 0 based, so add one for chapter number
      const verses = bookData[chapter]; // get the number of verses in the chapter
      const groupData = Array(verses).fill().map((_, i) => { // turn number of verses into array
        const verse = i + 1; // index is 0 based, so add one for verse number
        return {
          "contextId": {
            "reference": {
              "bookId": bookId,
              "chapter": chapter,
              "verse": verse
            },
            "tool": toolName,
            "groupId": "chapter_" + chapter
          }
        };
      });
      return groupData;
    });
  }
  return groupsData;
};

/**
 * @description Helper function to get a bibles manifest file from the bible resources folder.
 * @param {string} bibleVersionPath - path to a bibles version folder.
 * @param {string} bibleID - bible name. ex. bhp, uhb, udt, ult.
 */
export function getBibleManifest(bibleVersionPath, bibleID) {
  let fileName = 'manifest.json';
  let bibleManifestPath = path.join(bibleVersionPath, fileName);
  let manifest;

  if(fs.existsSync(bibleManifestPath)) {
    manifest = fs.readJsonSync(bibleManifestPath);
  } else {
    console.error(`Could not find manifest for ${bibleID} at ${bibleManifestPath}`);
  }
  return manifest;
}

/**
 * @description Helper function to get a bibles index from the bible resources folder.
 * @param {string} languageId
 * @param {string} bibleId - bible name. ex. bhp, uhb, udt, ult.
 * @param {string} bibleVersion - optional release version, if null then get latest
 */
export function getBibleIndex(languageId, bibleId, bibleVersion) {
  const STATIC_RESOURCES_BIBLES_PATH = path.join(__dirname, '../../../tcResources', languageId, 'bibles');
  const fileName = 'index.json';
  let bibleIndexPath;
  if (bibleVersion) {
    bibleIndexPath = path.join(STATIC_RESOURCES_BIBLES_PATH, bibleId, bibleVersion, fileName);
  } else {
    const versionPath = getLatestVersionInPath(path.join(STATIC_RESOURCES_BIBLES_PATH, bibleId));
    if (versionPath) {
      bibleIndexPath = path.join(versionPath, fileName);
    }
  }
  let index;

  if(fs.existsSync(bibleIndexPath)) {
    index = fs.readJsonSync(bibleIndexPath);
  } else {
    console.error("Could not find index for " + bibleId + ' ' + bibleVersion);
  }
  return index;
}

/**
 * Returns an array of versions found in the path that start with [vV]\d
 * @param {String} resourcePath - base path to search for versions
 * @return {Array} - array of versions, e.g. ['v1', 'v10', 'v1.1']
 */
export function getVersionsInPath(resourcePath) {
  if (! resourcePath || ! fs.pathExistsSync(resourcePath)) {
    return null;
  }
  const isVersionDirectory = name => {
    const fullPath = path.join(resourcePath, name);
    return fs.lstatSync(fullPath).isDirectory() && name.match(/^v\d/i);
  };
  return fs.readdirSync(resourcePath).filter(isVersionDirectory);
}

/**
 * Returns a sorted an array of versions so that numeric parts are properly ordered (e.g. v10a < v100)
 * @param {Array} versions - array of versions unsorted: ['v05.5.2', 'v5.5.1', 'V6.21.0', 'v4.22.0', 'v6.1.0', 'v6.1a.0', 'v5.1.0', 'V4.5.0']
 * @return {Array} - array of versions sorted:  ["V4.5.0", "v4.22.0", "v5.1.0", "v5.5.1", "v05.5.2", "v6.1.0", "v6.1a.0", "V6.21.0"]
 */
export function sortVersions(versions) {
  // Don't sort if null, empty or not an array
  if (! versions || ! Array.isArray(versions)) {
    return versions;
  }
  // Only sort of all items are strings
  for(let i = 0, len = versions.length; i < len; ++i) {
    if (typeof versions[i] !== 'string') {
      return versions;
    }
  }
  versions.sort( (a, b) => String(a).localeCompare(b, undefined, { numeric:true }) );
  return versions;
}

/**
 * Return the full path to the highest version folder in resource path
 * @param {String} resourcePath - base path to search for versions
 * @return {String} - path to highest version
 */
export function getLatestVersionInPath(resourcePath) {
  const versions = sortVersions(getVersionsInPath(resourcePath));
  if (versions && versions.length) {
    return path.join(resourcePath, versions[versions.length-1]);
  }
  return null; // return illegal path
}

export function getLanguageIdsFromResourceFolder(bookId) {
  try {
    let languageIds = getFilesInResourcePath(USER_RESOURCES_PATH);
    // if its an old testament project remove greek from languageIds.
    if (BibleHelpers.isOldTestament(bookId)) {
      languageIds = languageIds.filter(languageId => languageId !== 'grc');
    } else { // else if its a new testament project remove hebrew from languageIds.
      languageIds = languageIds.filter(languageId => languageId !== 'hbo');
    }
    languageIds = languageIds.filter(languageID => {
      let valid = (fs.lstatSync(path.join(USER_RESOURCES_PATH, languageID)).isDirectory());
      return valid;
    });
    return languageIds;
  } catch (error) {
    console.error(error);
  }
}

/**
 * add language ID to languageIds if not present
 * @param {Array} languageIds
 * @param {String} languageID
 */
export function addLanguage(languageIds, languageID) {
  if (!languageIds.includes(languageID)) { // make sure we have OL
    languageIds.push(languageID);
  }
}

/**
 * add resource to resources if not present
 * @param {Array} resources
 * @param {String} languageId
 * @param {String} bibleId
 */
export function addResource(resources, languageId, bibleId) {
  const pos = resources.findIndex(resource =>
    ((resource.languageId === languageId) && (resource.bibleId === bibleId))
  );
  if (pos < 0) { // if we don't have resource
    resources.push({ bibleId, languageId});
  }
}

/**
 * populates resourceList with resources that can be used in scripture pane
 * @param {Array} resourceList - array to be populated with resources
 * @return {Function}
 */
export function getAvailableScripturePaneSelections(resourceList) {
  return ((dispatch, getState) => {
    try {
      resourceList.splice(0,resourceList.length); // remove any pre-existing elements
      const contextId = getContext(getState());
      const bookId = contextId && contextId.reference.bookId;
      const languagesIds = getLanguageIdsFromResourceFolder(bookId);

      // load source bibles
      languagesIds.forEach((languageId) => {
        const biblesPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles');
        if(fs.existsSync(biblesPath)) {
          const biblesFolders = fs.readdirSync(biblesPath)
            .filter(folder => folder !== '.DS_Store');
          biblesFolders.forEach(bibleId => {
            const bibleIdPath = path.join(biblesPath, bibleId);
            const bibleLatestVersion = getLatestVersionInPath(bibleIdPath);
            if (bibleLatestVersion) {
              const pathToBibleManifestFile = path.join(bibleLatestVersion, 'manifest.json');
              try {
                const manifestExists = fs.existsSync(pathToBibleManifestFile);
                const bookExists = fs.existsSync(path.join(bibleLatestVersion, bookId, "1.json"));
                if (manifestExists && bookExists) {
                  const manifest = fs.readJsonSync(pathToBibleManifestFile);
                  if (Object.keys(manifest).length) {
                    const resource = {
                      bookId,
                      bibleId,
                      languageId,
                      manifest
                    };
                    resourceList.push(resource);
                  }
                }
              } catch (e) {
                console.warn("Invalid bible: " + bibleLatestVersion, e);
              }
            }
          });
        } else {
          console.log('Directory not found, ' + biblesPath);
        }
      });
    } catch(err) {
      console.warn(err);
    }
  });
}

/**
 * gets the resources used in the scripture pane configuration, adds selected GL and adds the OL.  We default to English
 *      for GL.
 * @param {Object} state
 * @param {String} bookId
 * @return {Array} array of resource in scripture panel
 */
export function getResourcesNeededByTool(state, bookId) {
  const toolName = getSelectedToolName(state);
  const resources = [];
  const olLanguageID = BibleHelpers.isOldTestament(bookId) ? 'hbo' : 'grc';
  const olBibleId = BibleHelpers.isOldTestament(bookId) ? 'uhb' : 'ugnt';
  const currentPaneSettings = _.cloneDeep(SettingsHelpers.getCurrentPaneSetting(state));
  if (Array.isArray(currentPaneSettings)) {
    for (let setting of currentPaneSettings) {
      let languageId = setting.languageId;
      switch (languageId) {
        case "targetLanguage":
          break;

        case "originalLanguage":
          addResource(resources, olLanguageID, setting.bibleId);
          break; // skip invalid language codes

        default:
          addResource(resources, languageId, setting.bibleId);
          break;
      }
    }
  } else {
    console.log("No Scripture Pane Configuration");
  }
  addResource(resources, olLanguageID, olBibleId); // make sure loaded even if not in pane settings
  const gatewayLangId = getToolGatewayLanguage(state, toolName);
  const validBibles = getValidGatewayBiblesForTool(toolName, gatewayLangId, bookId);
  if (Array.isArray(validBibles)) {
    for (let bible of validBibles) {
      addResource(resources, gatewayLangId, bible);
    }
  }
  return resources;
}

export function getGLQuote(languageId, groupId, toolName) {
  try {
    const GLQuotePathWithoutVersion = path.join(STATIC_RESOURCES_PATH, languageId, 'translationHelps', toolName);
    const versionDirectory = getLatestVersionInPath(GLQuotePathWithoutVersion);
    const GLQuotePathIndex = path.join(versionDirectory, 'kt', 'index.json');
    const resourceIndexArray = fs.readJSONSync(GLQuotePathIndex);
    return resourceIndexArray.find(({ id }) => id === groupId).name;
  } catch (e) { return null }
}

/**
 * get unfiltered list of resource language ids
 * @param {Boolean} user - if true look in user resources, else check static resources
 * @return {Array} - list of language IDs
 */
export function getAllLanguageIdsFromResourceFolder(user) {
  return getFoldersInResourceFolder(user ? USER_RESOURCES_PATH : STATIC_RESOURCES_PATH);
}

/**
 * get list of folders in resource path
 * @param {String} resourcePath - path
 * @return {Array} - list of folders
 */
export function getFoldersInResourceFolder(resourcePath) {
  try {
    let folders = fs.readdirSync(resourcePath)
      .filter(folder => fs.lstatSync(path.join(resourcePath, folder)).isDirectory() ); // filter out anything not a folder
    return folders;
  } catch (error) {
    console.error(error);
  }
}

/**
 * get list of files in resource path
 * @param {String} resourcePath - path
 * @param {String|null} ext - optional extension to match
 * @return {Array}
 */
export function getFilesInResourcePath(resourcePath, ext) {
  if (fs.lstatSync(resourcePath).isDirectory()) {
    let files = fs.readdirSync(resourcePath)
      .filter(file => {
        if (ext) {
          return path.extname(file) === ext;
        }
        return file !== '.DS_Store';
      }); // filter out .DS_Store
    return files;
  }
  return [];
}

/**
 * gets the sub folders of folder if it exists and filters out hidden and temp folder names
 * @param {String} folderPath
 * @return {*}
 */
function getFilteredSubFolders(folderPath) {
  const excludedItems = ['imports_processed', 'imports', '.DS_Store'];
  if (fs.existsSync(folderPath)) {
    return fs.readdirSync(folderPath)
      .filter(item => !excludedItems.includes(item))
      .filter(file => fs.lstatSync(path.join(folderPath, file)).isDirectory());
  }
  return [];
}

/**
 * copies missing subfolders from source to destination
 * @param {String} source
 * @param {String} destination
 */
function copyMissingSubfolders(source, destination) {
  const sourceSubFolders = getFilteredSubFolders(source);
  const destinationSubFolders = getFilteredSubFolders(destination);
  sourceSubFolders.forEach((lexicon) => {
    if (!destinationSubFolders.includes(lexicon)) {
      const sourcePath = path.join(source, lexicon);
      const destinationPath = path.join(destination, lexicon);
      fs.copySync(sourcePath, destinationPath);
    }
  });
}

/**
 * restores missing resources by language and bible and lexicon
 */
export function getMissingResources() {
  const tcResourcesFiles = getFilteredSubFolders(STATIC_RESOURCES_PATH);
  const userResources = getFilteredSubFolders(USER_RESOURCES_PATH);
  tcResourcesFiles.forEach((languageId) => {
    // if a resource package with tC executable file is missing in the user resource directory
    if (!userResources.includes(languageId)) {
      const STATIC_RESOURCES = path.join(STATIC_RESOURCES_PATH, languageId);
      const destinationPath = path.join(USER_RESOURCES_PATH, languageId);
      fs.copySync(STATIC_RESOURCES, destinationPath);
      const BIBLE_RESOURCES_PATH = path.join(destinationPath, 'bibles');
      const bibleIds = fs.readdirSync(BIBLE_RESOURCES_PATH).filter(folder => folder !== '.DS_Store');
      bibleIds.forEach(bibleId => {
        let bibleDestinationPath = path.join(BIBLE_RESOURCES_PATH, bibleId);
        extractZippedBooks(bibleDestinationPath);
      });
    }
    // TODO: this is temporary - eventually this will be packaged in catalog
    // check for lexicons packaged with tc executable
    const tcResourcesLexiconPath = path.join(STATIC_RESOURCES_PATH, languageId, 'lexicons');
    if (fs.existsSync(tcResourcesLexiconPath)) {
      const userResourcesLexiconPath = path.join(USER_RESOURCES_PATH, languageId, 'lexicons');
      copyMissingSubfolders(tcResourcesLexiconPath, userResourcesLexiconPath);
    }
  });
}
