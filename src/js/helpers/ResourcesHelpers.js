/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
// constant declarations
const USER_RESOURCES_PATH = path.join(ospath.home(), 'translationCore/resources');
const STATIC_RESOURCES_PATH = path.join(__dirname, '../../../tC_resources/resources');

/**
 * @description moves all bibles from the static folder to the guest user translationCore folder.
 */
export function getBibleFromStaticPackage(force = false) {
  try {
    let languagesIds = ['en', 'grc', 'he']; // english, greek, hebrew.
    languagesIds.forEach((languagesId) => {
      const STATIC_RESOURCES_BIBLES_PATH = path.join(STATIC_RESOURCES_PATH, languagesId, 'bibles');
      const BIBLE_RESOURCES_PATH = path.join(USER_RESOURCES_PATH, languagesId, 'bibles');
      let bibleNames = fs.readdirSync(STATIC_RESOURCES_BIBLES_PATH);
      bibleNames.forEach((bibleName) => {
        let bibleSourcePath = path.join(STATIC_RESOURCES_BIBLES_PATH, bibleName);
        let bibleDestinationPath = path.join(BIBLE_RESOURCES_PATH, bibleName);
        if(!fs.existsSync(bibleDestinationPath) || force) {
          fs.copySync(bibleSourcePath, bibleDestinationPath);
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * @description moves all translationHelps from the static folder to the resources folder in the translationCore folder.
 */
export function getTHelpsFromStaticPackage(force = false) {
  ['en','grc'].forEach(languageId => {
    try {
      const staticTranslationHelpsPath = path.join(STATIC_RESOURCES_PATH, languageId, 'translationHelps');
      const userTranslationHelpsPath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps');
      const tHelpsNames = fs.readdirSync(staticTranslationHelpsPath);
      tHelpsNames.forEach((tHelpName) => {
        let tHelpSourcePath = path.join(staticTranslationHelpsPath, tHelpName);
        let tHelpDestinationPath = path.join(userTranslationHelpsPath, tHelpName);
        if(!fs.existsSync(tHelpDestinationPath) || force) {
          fs.copySync(tHelpSourcePath, tHelpDestinationPath);
        }
      });
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

export function copyGroupsIndexToProjectResources(currentToolName, projectGroupsIndexPath) {
  const languageId = 'en';
  const version = currentToolName === 'translationWords' ? 'v6' : 'v0';
  const groupsIndexPath = currentToolName === 'translationWords' ? path.join('kt', 'index.json') : 'index.json';
  const groupsIndexSourcePath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps', currentToolName, version, groupsIndexPath);
  const groupsIndexDestinationPath = path.join(projectGroupsIndexPath,'index.json');

  if(fs.existsSync(groupsIndexSourcePath)) {
    fs.copySync(groupsIndexSourcePath, groupsIndexDestinationPath);
  } else {
    const groupsIndex = chapterGroupsIndex();
    fs.outputJsonSync(groupsIndexDestinationPath, groupsIndex);
    console.log("Chapter Groups Index generated. translationHelps resources path was not found, " + groupsIndexSourcePath);
  }
}
/**
 * @description - Auto generate the chapter index since more projects will use it
 * @param {String} groupsIndexDestinationPath - path to store the index
 */
export const chapterGroupsIndex = () => {
  const groupsIndex = Array(150).fill().map((_, i) => {
    let chapter = i + 1;
    return {
      id: 'chapter_' + chapter,
      name: 'Chapter ' + chapter
    };
  });
return groupsIndex;
};

export function copyGroupsDataToProjectResources(currentToolName, groupsDataDirectory, bookAbbreviation) {
  const languageId = currentToolName === 'translationWords' ? 'grc' : 'en';
  const version = 'v0';
  const groupsFolderPath = currentToolName === 'translationWords' ? path.join('kt', 'groups', bookAbbreviation) : path.join('groups', bookAbbreviation);
  const groupsDataSourcePath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps', currentToolName, version, groupsFolderPath);

  if(fs.existsSync(groupsDataSourcePath)) {
    fs.copySync(groupsDataSourcePath, groupsDataDirectory);
  } else {
    const groupsData = chapterGroupsData(bookAbbreviation, currentToolName);
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
 * @param {String} toolId - id of the current tool
 * @param {String} groupsDataDirectory - path to store the index
 */
export const chapterGroupsData = (bookId, currentToolName) => {
  let groupsData = [];
  const versionPath = getLatestVersionInPath(path.join(STATIC_RESOURCES_PATH, 'en', 'bibles', 'ulb'));
  const ulbIndexPath = path.join(versionPath, 'index.json');
  if (fs.existsSync(ulbIndexPath)) { // make sure it doens't crash if the path doesn't exist
    const ulbIndex = fs.readJsonSync(ulbIndexPath); // the index of book/chapter/verses
    const bookData = ulbIndex[bookId]; // get the data in the index for the current book
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
            "tool": currentToolName,
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
 * @param {string} bibleID - bible name. ex. bhp, uhb, udb, ulb.
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
 * @param {string} bibleId - bible name. ex. bhp, uhb, udb, ulb.
 * @param {string} bibleVersion - optional release version, if null then get latest
 */
export function getBibleIndex(languageId, bibleId, bibleVersion) {
  const STATIC_RESOURCES_BIBLES_PATH = path.join(__dirname, '../../../tC_resources/resources', languageId, 'bibles');
  const fileName = 'index.json';
  let bibleIndexPath;
  if (bibleVersion) {
    bibleIndexPath = path.join(STATIC_RESOURCES_BIBLES_PATH, bibleId, bibleVersion, fileName);
  } else {
    const versionPath = getLatestVersionInPath(path.join(STATIC_RESOURCES_BIBLES_PATH, bibleId));
    bibleIndexPath = path.join(versionPath, fileName);
  }
  let index;

  if(fs.existsSync(bibleIndexPath)) {
    index = fs.readJsonSync(bibleIndexPath);
  } else {
    console.error("Could not find manifest for " + bibleId + ' ' + bibleVersion);
  }
  return index;
}

/**
 * find highest version folder in path
 * @param {string} resourcePath - base path to search for versions
 * @return {string} - path to highest version
 */
export function getLatestVersionInPath(resourcePath) {
  const files = fs.readdirSync(resourcePath); // get the chunk files in the chapter path
  let versions = files.filter(file => (file.substr(0,1).toLowerCase() === 'v'));
  versions = versions.sort((a, b) => {
    let diff = parseInt(a) - parseInt(b);
    if (diff === 0) { // if integral part is the same, then sort alphabetically
      diff = (a.toLowerCase() > b.toLowerCase()) ? 1 : -1;
    }
    return diff;
  });

  if (versions.length > 0) {
    return path.join(resourcePath, versions[versions.length - 1]);
  }

  return null; // return illegal path
}
