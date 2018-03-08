import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
// helpers
import * as ResourcesHelpers from '../helpers/ResourcesHelpers';
/**
 * Finds the group object for a given group id in the groupsIndex array.
 * @param {Array} groupsIndex
 * @param {String} groupIdToFind
 * @return {Object} found group object
 */
export function getGroupFromGroupsIndex(groupsIndex, groupIdToFind) {
  return groupsIndex.find((group) => group.id === groupIdToFind);
}

/**
 * Loads the groups index for a specified gateway Language Id and tool.
 * @param {String} gatewayLanguageId
 * @param {String} toolName
 */
export function getGroupsIndex(gatewayLanguageId, toolName, ) {
  try {
    const toolResourceDirectory = path.join(ospath.home(), 'translationCore', 'resources', gatewayLanguageId, 'translationHelps', toolName);
    const versionDirectory = ResourcesHelpers.getLatestVersionInPath(toolResourceDirectory) || toolResourceDirectory;
    const dataDirectory = path.join(versionDirectory, 'kt');
    const groupIndexDataDirectory = path.join(dataDirectory, 'index.json');
    const groupsIndex = fs.readJsonSync(groupIndexDataDirectory);
    return groupsIndex;
  } catch (error) {
    console.error(error);
  }
}
