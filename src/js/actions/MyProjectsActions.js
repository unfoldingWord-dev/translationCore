import consts from './ActionTypes';
import fs from 'fs-extra';
import path from 'path-extra';
import moment from 'moment';
// actions
// contant declarations
const DEFAULT_SAVE = path.join(path.homedir(), 'translationCore');

/**
 * @description - Will get the directories inside of a directory and return them
 * @return {array} projectDirectories
 */
export function getProjectDirectories() {
  const directories = fs.readdirSync(DEFAULT_SAVE);
  const projectDirectories = directories.filter( directory => {
    // we need to only get files not directories
    const isDirectory = fs.lstatSync(path.join(DEFAULT_SAVE, directory)).isDirectory()
    // if it is a directory check to see if it has a manifest
    let isProject = false;
    if (isDirectory) {
      const manifestPath = path.join(DEFAULT_SAVE, directory, 'manifest.json');
      isProject = fs.existsSync(manifestPath);
    }
    return isProject; // filter to only show projects
  });
  // return the list of project directories
  return projectDirectories;
}

/**
 *  @description: With the list of project directories, generates an array of project detail objects
 */
export function getMyProjects() {
  return ((dispatch, getState) => {
    const state = getState();
    const {projectDetailsReducer} = state;

    const projectFolders = getProjectDirectories();
    // generate properties needed
    const projects = projectFolders.map( folder => {
      const projectName = folder;
      const projectSaveLocation = path.join(DEFAULT_SAVE, folder);
      const projectDataLocation = path.join(projectSaveLocation, '.apps', 'translationCore');
      let accessTime = "", accessTimeAgo = "Never Opened";
      if (fs.existsSync(projectDataLocation)) {
        accessTime = fs.statSync(projectDataLocation).atime;
        accessTimeAgo = moment().to(accessTime);
      }
      const manifestPath = path.join(DEFAULT_SAVE, folder, 'manifest.json');
      const manifest = fs.readJsonSync(manifestPath);
      const { target_language } = manifest;
      const bookAbbr = manifest.project.id;
      const bookName = manifest.project.name;
      const isSelected = projectSaveLocation === projectDetailsReducer.projectSaveLocation;

      return {
        projectName,
        projectSaveLocation,
        accessTimeAgo,
        bookAbbr,
        bookName,
        target_language,
        isSelected
      }
    });

    dispatch({
      type: consts.GET_MY_PROJECTS,
      projects: projects
    });
  });
}
