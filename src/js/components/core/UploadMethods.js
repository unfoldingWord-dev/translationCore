/**
 * @description: This is the modal for the drag and drop upload feature.
 ******************************************************************************/
import React from 'react';
import fs from 'fs-extra';
import CoreStore from '../../stores/CoreStore';
import ManifestGenerator from './create_project/ProjectManifest.js';
import CheckStore from '../../stores/CheckStore';
import books from './BooksOfBible.js';
import Path from 'path-extra';
import usfm from 'usfm-parser';
import ImportUsfm from './Usfm/ImportUSFM.js';
import { addNewBible } from '../../actions/ResourcesActions.js';
import { dispatch } from "../../pages/root";
//const declaration
const api = window.ModuleApi;
const defaultSave = Path.join(Path.homedir(), 'translationCore');


export const clearPreviousData = () => {
  CheckStore.WIPE_ALL_DATA();
  api.modules = {};
};

export const checkIfUSFMFile = (savePath, callback) => {
  try {
    var usfmFile = fs.readFileSync(savePath);
    const ext = savePath.split(".")[1];
    callback(ext == "usfm" || ext == "sfm");
  } catch (e) {
    try {
      var dir = fs.readdirSync(savePath);
      if (dir.length === 1 || dir.shift() == '.git') {
        const ext = dir[0].split(".")[1];
        callback(ext == "usfm" || ext == "sfm", Path.join(savePath, dir[0]));
      } else {
        callback(false);
      }
    } catch (err) {
      callback(false);
    }
  }
};
/**
* @description - Sets the target language filepath and/or link, while also generatering a TC
* manifest file and saving the params and saveLocation under the 'common' namespace in the
* CheckStore
* @param {string} path - The folder path that points to the directory that the translationStudio
* project lives, which should include a manifest file
* @param {string} link - URL that points to the location of a translationStudio project located on
* the GOGS server
* This is the main function to initiate a load of a project
*/
export const sendPath = (path, link, callback) => {
  clearPreviousData();
  checkIfUSFMFile(path, (isUSFM, newPath) => {
    if (isUSFM) {
      ImportUsfm.open(newPath || path, 'ltr', link, callback);
      return;
    }
    if (path) {
      var parsedPath = Path.parse(path);
      var saveLocation = Path.join(defaultSave, parsedPath.name);
      if (!fs.existsSync(path)) {
        callback('Location does not exist', null);
        return;
      }
      if (fs.existsSync(saveLocation)) {
        if (path != saveLocation) {
          var continueCopy = window.confirm("This project is saved elsewhere on your computer. \nDo you want to overwrite it?");
          if (continueCopy) {
            fs.removeSync(saveLocation);
            fs.copySync(path, saveLocation);
          }
          path = saveLocation;
        }
      } else {
        fs.copySync(path, saveLocation);
      }
      loadFile(path, 'manifest.json', (err, manifest) => {
        if (manifest && manifest.tcInitialized) { // fs.access('manifest.json')
          //tc-manifest is present initiate load
          loadProjectThatHasManifest(path, callback, manifest);
        } else if (manifest && !manifest.tcInitialized){
          //no tc-manifest present checking for ts-manifest
          let verifiedManifest = verifyChunks(path, manifest);
          verifiedManifest.tcInitialized = true;
          saveManifest(path, link, verifiedManifest, (err, newManifest) => {
            loadProjectThatHasManifest(path, callback, newManifest);
          });
        } else if (!manifest){
          //no 'manifest.json' found, checking for old 'tc-manifest.json'
          loadFile(path, 'tc-manifest.json',
            (err, oldManifest) => {
              if (oldManifest) { // fs.access('tc-manifest.json')
                let verifiedManifest = verifyChunks(path, oldManifest);
                //ts-manifest is present, creating tc-manifest and initiate load
                saveManifest(path, link, verifiedManifest, (err, newManifest) => {
                  // fs.unlink(Path.join(path, 'tc-manifest.json'), (err) =>{
                  //   // delete the old 'tc-manifest.json' if it exists.
                  //   if(err){
                  //     manifestError(err.message);
                  //   }
                  // });
                  loadProjectThatHasManifest(path, callback, newManifest);
                });
              }
              else if (err) {
                localStorage.removeItem('lastProject');
                api.putDataInCommon('saveLocation', null);
                manifestError(err.message);
                if (callback) callback(err);
              }
            });
        } else if (err) {
          manifestError(err.message);
          if (callback) callback(err);
        }
      });
    } else {
      callback('No path', null)
    }
  });
};

export const checkIfValidBetaProject = (manifest) => {
  if (manifest && manifest.project) return manifest.project.id == "eph" || manifest.project.id == "tit";
  else if (manifest && manifest.ts_project) return manifest.ts_project.id == "eph" || manifest.ts_project.id == "tit";
};
/**
  * @description - Checks to see if the file is present, and loads it.
  * @param {string} path - absolute path to a translationStudio project folder
  * @param {String} file - The file name to load
*/
export const loadFile = (path, file, callback) => {
  try {
    var hasManifest = fs.readJsonSync(Path.join(path, file));
    if (hasManifest) {
      callback(null, hasManifest);
    }
  }
  catch (e) {
    callback(e, null);
  }
};
/**
  * @description - Checks to see if the file is present and renames it.
  * @param {string} path - existing absolute path to a file
  * @param {string} newPath - desired absolute path to the file
*/
export function renameFile(path, newPath, callback) {
  try {
    fs.access(path, (err) => {
      if(!err){
        fs.rename(path, newPath, callback);
      }else{
        callback(e);
      }
    })
  } catch (e) {
    callback(e);
  }
}

/**
 * @desription - Does the rest of requirements for a project to be loaded after
 * it has the information needed from a tc-manifest
 * @param {string} path - path to the current project directory
 * @param {function} callback - function that happens after all data is in CheckStore i.e. CheckDatagrabber.loadModuleAnd...
 * @param {function} tcManifest - the tc-manifest to put in common
 */
export const loadProjectThatHasManifest = (path, callback, tcManifest) => {
  var Access = require('./AccessProject');
  api.putDataInCommon('tcManifest', tcManifest);
  api.putDataInCommon('saveLocation', path);
  const params = getParams(path)
  if (params) {
    api.putDataInCommon('params', params);
    checkIfUSFMProject(path, function (targetLanguage) {
      if (targetLanguage) {
        dispatch(addNewBible('targetLanguage', targetLanguage));
        //TODO: remove api call once implementation is ready
        api.putDataInCommon('targetLanguage', targetLanguage);
      }
      try {
        Access.loadFromFilePath(path, callback);
      } catch (err) {
        //executes if something fails, not sure how efficient
        manifestError(err.message);
        if (callback) callback(err);
      }
    });
  }
};

/**
 * @desription - This generates the default params from the path and saves it in the CheckStore
 * @param {string} path - The path to the folder containing the translationStudio project
 * manifest
 */
export const getParams = (path) => {
  var tcManifest = api.getDataFromCommon('tcManifest');
  const isArray = (a) => {
    return (!!a) && (a.constructor === Array);
  }
  if (!tcManifest) return;
  if (tcManifest.package_version == '3') {
    tcManifest = fixManifestVerThree(tcManifest);
  }
  if (tcManifest.finished_chunks && tcManifest.finished_chunks.length == 0) {
    manifestError("Project has no finished content in manifest");
    return;
  }
  var ogPath = Path.join(window.__base, 'static', 'taggedULB');
  var params = {
    'originalLanguagePath': ogPath
  }
  var UDBPath = Path.join(window.__base, 'static', 'taggedUDB');
  params.targetLanguagePath = path;
  params.gatewayLanguageUDBPath = UDBPath;
  try {
    if (tcManifest.ts_project) {
      params.bookAbbr = tcManifest.ts_project.id;
    }
    else if (tcManifest.project) {
      params.bookAbbr = tcManifest.project.id;
    }
    else {
      params.bookAbbr = tcManifest.project_id;
    }
    if (isArray(tcManifest.source_translations)) {
      params.gatewayLanguage = tcManifest.source_translations[0].language_id;
    } else {
      params.gatewayLanguage = tcManifest.source_translations.language_id;
    }
    params.direction = tcManifest.target_language ? tcManifest.target_language.direction : null;
    if (isOldTestament(params.bookAbbr)) {
      params.originalLanguage = "hebrew";
    } else {
      params.originalLanguage = "greek";
    }
  } catch (e) {
    manifestError(e.message);
  }
  return params;
};

export const saveTargetLangeInAPI = (parsedUSFM) => {
  var targetLanguage = {};
  targetLanguage.title = parsedUSFM.book;
  // targetLanguage.header = parsedUSFM.headers;
  var chapters = parsedUSFM.chapters;
  for (var ch in chapters) {
    targetLanguage[chapters[ch].number] = {};
    var verses = chapters[ch].verses;
    for (var v in verses) {
      var verseText = verses[v].text.trim();
      targetLanguage[chapters[ch].number][verses[v].number] = verseText;
    }
  }
  if (parsedUSFM.headers) {
    var parsedHeaders = parsedUSFM.headers;
    if (parsedHeaders['mt1']) {
      targetLanguage.title = parsedHeaders['mt1'];
    } else if (parsedHeaders['id']) {
      targetLanguage.title = books[parsedHeaders['id'].toLowerCase()];
    }
  }
  dispatch(addNewBible('targetLanguage', targetLanguage));
  //TODO: remove api call once implementation is ready
  api.putDataInCommon('targetLanguage', targetLanguage);
  return targetLanguage;
};

export const checkIfUSFMProject = (savePath, callback) => {
  var projectFolder = fs.readdirSync(savePath);
  var targetLanguage;
  for (var file in projectFolder) {
    var parsedPath = Path.parse(projectFolder[file]);
    if (parsedPath.ext.toUpperCase() == ".SFM" || parsedPath.ext.toUpperCase() == '.USFM') {
      var actualFile = Path.join(savePath, parsedPath.base);
      var saveLocation = Path.join(defaultSave, parsedPath.name);
      var saveFile = Path.join(saveLocation, parsedPath.base);
      try {
        try {
          var data = fs.readFileSync(saveFile);
        } catch (err) {
          var data = fs.readFileSync(actualFile);
        }
        if (!data) {
          var saveLocation = Path.join(savePath, parsedPath.base);
          var saveFile = saveLocation;
          data = fs.readFileSync(saveFile);
          //saving it in the same directory the project was loaded from
        }
        api.putDataInCommon('saveLocation', saveLocation);
        var usfmData = data.toString();
        var parsedUSFM = usfm.toJSON(usfmData);
        if (parsedUSFM.headers['id']) parsedUSFM.book = parsedUSFM.headers['id'].split(" ")[0].toLowerCase();
      } catch (e) {
        console.error(e);
      }
      targetLanguage = saveTargetLangeInAPI(parsedUSFM);
    }
  }
  callback(targetLanguage);
};

/**
 * @description - Generates and saves a translationCore manifest file
 * @param {string} saveLocation - Filepath of where the translationCore manifest file will
 * be saved. Must be an ABSOLUTE PATH
 * @param {object} data - The translationCore manifest data to be saved
 * @param {object} tsManifest - The translationStudio manifest data loaded from a translation
 * studio project
 */
export const saveManifest = (saveLocation, link, tsManifest, callback) => {
  var data = {
    //hardcoded for data specific to tc-manifest
    user: [CoreStore.getLoggedInUser()],
    repo: link || undefined
  };
  var manifest;
  try {
    var manifestLocation = Path.join(saveLocation, 'manifest.json');
    if (tsManifest.package_version == '3') {
      //some older versions of ts-manifest have to be tweaked to work
      manifest = fixManifestVerThree(tsManifest);
    } else {
      manifest = ManifestGenerator(data, tsManifest);
    }
    fs.outputJson(manifestLocation, manifest, function (err) {
      if (err) {
        manifestError('Error Saving tC Manifest');
        if (callback) callback(err, null);
      }
      //overwrites old manifest if present, or else creates new one
      callback(null, manifest);
    });
  } catch (err) {
    callback(err, null);
  }
};
/**
 * @description - Fixes an issue where manifest chunks are misleading.
 * @param {Object} tsManifest - A translation studio manifest
 * @param {String} path - The location of the project
 */
export const verifyChunks = (path, tsManifest) => {
  let chunkChapters = fs.readdirSync(path);
  let finishedChunks = [];
  for (let chapter in chunkChapters) {
    if (!isNaN(chunkChapters[chapter])) {
      let chunkVerses = fs.readdirSync(path + '/' + chunkChapters[chapter]);
      for (let chunk in chunkVerses) {
        let currentChunk = chunkVerses[chunk].replace(/(?:\(.*\))?\.txt/g, '');
        let chunkString = chunkChapters[chapter].trim() + '-' + currentChunk.trim();
        if (!finishedChunks.includes(chunkString)) {
          finishedChunks.push(chunkString);
        }
      }
    }
  }
  tsManifest.finished_chunks = finishedChunks;
  return tsManifest;
};
/**
 * @desription - Uses the tc-standard format for projects to make package_version 3 compatible
 * @param oldManifest - The name of an employee.
 */
export const fixManifestVerThree = (oldManifest) => {
  var newManifest = {};
  try {
    for (var oldElements in oldManifest) {
      newManifest[oldElements] = oldManifest[oldElements];
    }
    newManifest.finished_chunks = oldManifest.finished_frames;
    newManifest.ts_project = {};
    newManifest.ts_project.id = oldManifest.project_id;
    newManifest.ts_project.name = api.convertToFullBookName(oldManifest.project_id);
    for (var el in oldManifest.source_translations) {
      newManifest.source_translations = oldManifest.source_translations[el];
      var parameters = el.split("-");
      newManifest.source_translations.language_id = parameters[1];
      newManifest.source_translations.resource_id = parameters[2];
      break;
    }
  } catch (e) {
    console.error(e);
  }
  return newManifest;
};
/**
 * @description - This returns true if the book is an OldTestament one
 * @param {string} content (projectBook) - the book in abr form
 */
export const manifestError = (content) => {
  api.createAlert(
    {
      title: 'Error Setting Up Project',
      content: content,
      moreInfo: "",
      leftButtonText: "Ok"
    });
  clearPreviousData();
};

/**
 * @description - This returns true if the book is an OldTestament one
 * @param {string} projectBook - the book in abr form
 * manifest
 */
export const isOldTestament = (projectBook) => {
  var passedBook = false;
  for (var book in books) {
    if (book == projectBook) passedBook = true;
    if (books[book] == "Malachi" && passedBook) {
      return true;
    }
  }
  return false;
};
