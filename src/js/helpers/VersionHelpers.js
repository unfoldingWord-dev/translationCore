import fs from "fs-extra";
import path from "path-extra";
export const VERSION_KEY = 'tc_version';

/**
 * @description returns the current supported manifest version of the app (set in package.json)
 * @return {int} manifest version number
 */
export const getCurrentManifestVersion = () => {
  let version = -1;
  try {
    const package2 = require('../../../package.json');
    const versionStr = package2.manifestVersion;
    version = parseInt(versionStr, 10) || -1;
  } catch(e) {
    console.log("Error trying to read package.json: " + e);
  }
  return version;
};

/**
 * @description reads tc version from manifest
 * @param {String} projectPath - path to project
 * @return {int} version in manifest of -1 if not found
 */
export const getVersionFromManifest = (projectPath) => {
  let version = -1;
  const manifest = readManifest(projectPath);
  if (manifest && manifest[VERSION_KEY]) {
    version = manifest[VERSION_KEY];
    if (typeof version === 'string') { // do we need to convert from string
      version = parseInt(version, 10) || -1;
    }
  }
  return version;
};

/**
 * @description - writes new tc version to manifest
 * @param {String} projectPath - path to project
 * @param {int} version - new version to save
 * @return {boolean} true if successful
 */
export const setVersionInManifest = (projectPath, version) => {
  const manifest = readManifest(projectPath);
  if (manifest) {
    manifest[VERSION_KEY] = version;
    writeManifest(projectPath, manifest);
    return true;
  }
  return false;
};

/**
 * @description - returns the application version (set in package.json)
 * @return {String} application version
 */
export const getApplicationVersion = () => {
  return process.env.npm_package_version;
};

/**
 * @description - find path to manifest.json file in project path
 * @param {String} projectPath - path to project
 * @return {null}
 */
const getManifestPath = (projectPath) => {
  const projectManifestPath = path.join(projectPath, "manifest.json");
  const projectTCManifestPath = path.join(projectPath, "tc-manifest.json");
  return fs.existsSync(projectManifestPath) ? projectManifestPath
    : fs.existsSync(projectTCManifestPath) ? projectTCManifestPath : null;
};

/**
 * @description - reads manifest from project path
 * @param {String} projectPath - path to project
 * @return {object} manifest data
 */
const readManifest = (projectPath) => {
  const validManifestPath = getManifestPath(projectPath);
  if (validManifestPath) {
    return fs.readJsonSync(validManifestPath);
  }
  return null;
};

/**
 * @description - writes new manifest at project path
 * @param {String} projectPath - path to project
 * @param {object) manifest data to save
 * @return {null}
 */
const writeManifest = (projectPath, manifest) => {
  if (manifest) {
    const validManifestPath = getManifestPath(projectPath);
    if (validManifestPath) {
      fs.outputJsonSync(validManifestPath, manifest);
    }
  }
};
