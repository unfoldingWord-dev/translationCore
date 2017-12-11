//fs modules
import path from 'path-extra';
//helpers
import * as LoadHelpers from './LoadHelpers';
import * as ManifestHelpers from './manifestHelpers';


/**
 * Retrieves tC manifest and returns it or if not available looks for tS manifest.
 * If neither are available tC has no way to load the project, unless its a usfm project.
 * @param {string} projectPath - path location in the filesystem for the project.
 * @param {string} projectLink - Link to the projects git repo if provided i.e. https://git.door43.org/royalsix/fwe_tit_text_reg.git
 */
export function getProjectManifest(projectPath, projectLink) {
  let manifest = LoadHelpers.loadFile(projectPath, 'manifest.json');
  let tCManifest = LoadHelpers.loadFile(projectPath, 'tc-manifest.json');
  manifest = manifest || tCManifest;
  if (!manifest || !manifest.tcInitialized) {
    manifest = ManifestHelpers.setUpManifest(projectPath, projectLink, manifest);
  }
  return manifest;
}

/**
 * Gets the base name for the project path directory, this is also the project name.
 * i.e. '~/translationCore/projects/a_project_name' returns 'a_project_name'
 * @param {string} projectPath - Project path directory
 */
export function getProjectName(projectPath) {
  return path.parse(projectPath).base;
}