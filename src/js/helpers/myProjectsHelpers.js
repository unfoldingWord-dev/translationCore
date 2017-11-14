import fs from 'fs-extra';
import path from 'path-extra';
import moment from 'moment';
import usfmJS from 'usfm-js';
import * as usfmHelpers from './usfmHelpers';

// contant declarations
const DEFAULT_SAVE = path.join(path.homedir(), 'translationCore', 'projects');
const OLD_DEFAULT_SAVE = path.join(path.homedir(), 'translationCore');

/**
 * @description - Will get the directories inside of a directory and return them
 * @return {array} projectDirectories
 */
export function getProjectDirectories(loadProjectsLocation) {
  let directories = [];
  if(fs.existsSync(loadProjectsLocation)) {
    directories = fs.readdirSync(loadProjectsLocation);
  }
  const projectDirectories = {};
  directories.forEach(directory => {
    // we need to only get files not directories
    const isDirectory = fs.lstatSync(path.join(loadProjectsLocation, directory)).isDirectory();
    // if it is a directory check to see if it has a manifest
    let isProject, usfmPath = false;
    if (isDirectory) {
      const manifestPath = path.join(loadProjectsLocation, directory, 'manifest.json');
      isProject = fs.existsSync(manifestPath);
      if (!isProject) {
        usfmPath = usfmHelpers.isUSFMProject(path.join(loadProjectsLocation, directory));
      }
    }
    if (isProject || usfmPath) {
      projectDirectories[directory] = {
        usfmPath
      };
    }
  });
  return projectDirectories;
}

export function migrateResourcesFolder() {
  const directories = fs.readdirSync(OLD_DEFAULT_SAVE);
  for (var folder of directories) {
    let isDirectory = fs.lstatSync(path.join(OLD_DEFAULT_SAVE, folder)).isDirectory();
    let hasManifest = fs.existsSync(path.join(OLD_DEFAULT_SAVE, folder, 'manifest.json'));
    let notDuplicate = !(fs.existsSync(path.join(DEFAULT_SAVE, folder)));
    if (folder != 'resources'
      && folder != 'projects'
      && isDirectory
      && hasManifest
      && notDuplicate) {
      fs.moveSync(path.join(OLD_DEFAULT_SAVE, folder), path.join(DEFAULT_SAVE, folder));
    }
  }
}

export function getProjectsFromFS(selectedProjectSaveLocation, loadProjectsLocation) {
  loadProjectsLocation = loadProjectsLocation || DEFAULT_SAVE;
  /**@type {{directoryName: {usfmPath: (false|string)}}} */
  const projectFolders = getProjectDirectories(loadProjectsLocation);
  // generate properties needed
  let projects = [];
  Object.keys(projectFolders).forEach(folder => {
    const projectName = folder;
    const projectSaveLocation = path.join(loadProjectsLocation, folder);
    const projectDataLocation = path.join(projectSaveLocation, '.apps', 'translationCore');
    let accessTime = "", accessTimeAgo = "Never Opened";
    if (fs.existsSync(projectDataLocation)) {
      accessTime = fs.statSync(projectDataLocation).atime;
      accessTimeAgo = moment().to(accessTime);
    }
    let bookAbbr;
    let bookName;
    let target_language = {};

    try {
      //Basically checks if the project object is a usfm one
      if (!projectFolders[projectName].usfmPath) {
        const manifestPath = path.join(loadProjectsLocation, folder, 'manifest.json');
        const manifest = fs.readJsonSync(manifestPath);
        target_language = manifest.target_language;
        bookAbbr = manifest.project.id;
        bookName = manifest.project.name;
      } else {
        const usfmText = fs.readFileSync(projectFolders[projectName].usfmPath).toString();
        const usfmObject = usfmJS.toJSON(usfmText);
        let usfmHeadersObject = usfmHelpers.getUSFMDetails(usfmObject);
        bookName = usfmHeadersObject.book.name;
        target_language.id = usfmHeadersObject.language.id;
        target_language.name = usfmHeadersObject.language.name;
      }

      const isSelected = projectSaveLocation === selectedProjectSaveLocation;
      projects.push({
        projectName,
        projectSaveLocation,
        accessTimeAgo,
        bookAbbr,
        bookName,
        target_language,
        isSelected
      });
    } catch (e) {
      console.warn('invalid project in tC folder...removing');
      fs.removeSync(projectSaveLocation);
    }
  });
  return projects;
}
