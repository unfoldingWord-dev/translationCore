/* eslint-disable no-console */
import path from 'path-extra';
import ospath from 'ospath';
import fs from 'fs-extra';
// constants
const DEFAULT_SAVE = path.join(ospath.home(), 'translationCore', 'projects');

/**
 * Loads a json file.
 * @param {string} directory - Directorty of the file to load, not the file name.
 * @param {string} file - The file name to load.
 */
export function loadFile(directory, file) {
  const pathLocation = path.join(directory, file);
  if (fs.existsSync(pathLocation)) {
    var manifest = fs.readJsonSync(pathLocation);
    return manifest;
  } else {
    return null;
  }
}

/**
 * @description creates an array that has the data of each included tool and 'subtool'
 * @param {object} dataObject - Package json of the tool being loaded,
 * meta data of what the tool needs to load.
 * @param {string} moduleFolderName - Folder path of the tool being loaded.
 */
export function createCheckArray(dataObject, moduleFolderName) {
  let modulePaths = [];
  try {
    if (!dataObject.name || !dataObject.version || !dataObject.title || !dataObject.main) {
      return;
    } else {
      modulePaths.push({ name: dataObject.name, location: moduleFolderName });
      return modulePaths;
    }
  } catch (e) {
    console.error(e);
  }
}

export function projectTypeExists(language_id, book_id, projectPath) {
  let projectTypeExists = false;
  let projects = fs.readdirSync(DEFAULT_SAVE);
  for (var project of projects) {
    /* If the we are checking the same path as the current project
     * we do not need to worry about it being a duplicate
     */
    if (path.join(DEFAULT_SAVE, project) === projectPath) continue;
    if (fs.existsSync(path.join(DEFAULT_SAVE, project, 'manifest.json'))) {
      let otherProjectManifest = fs.readJSONSync(path.join(DEFAULT_SAVE, project, 'manifest.json'));
      let otherBookId = otherProjectManifest.project ? otherProjectManifest.project.id : null;
      let otherProjectLanguage = otherProjectManifest.target_language ? otherProjectManifest.target_language.id : null;
      projectTypeExists = language_id === otherProjectLanguage && book_id === otherBookId;
    }
    if (projectTypeExists) return true;
  }
  return false;
}
