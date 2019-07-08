import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
// helpers
import ResourceAPI from "./ResourceAPI";
import { TRANSLATION_HELPS } from '../common/constants';

/**
 * Finds the group object for a given group id in the groupsIndex array.
 * @param {Array} groupsIndex
 * @param {String} groupIdToFind
 * @return {Object} found group object
 */
export function getGroupFromGroupsIndex(groupsIndex, groupIdToFind) {
  try {
    let foundGroupId = undefined;

    for (let i = 0, len = groupsIndex.length; i < len; i++) {
      const group = groupsIndex[i];
      if (group.id === groupIdToFind) foundGroupId = group;
    }

    return foundGroupId;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Loads the groups index for a specified gateway Language Id and tool.
 * @param {String} gatewayLanguageId
 * @param {String} toolName
 */
export function getGroupsIndex(gatewayLanguageId, toolName) {
  try {
    const toolResourceDirectory = path.join(ospath.home(), 'translationCore', 'resources', gatewayLanguageId, TRANSLATION_HELPS, toolName);
    const versionDirectory = ResourceAPI.getLatestVersion(toolResourceDirectory) || toolResourceDirectory;
    const dataDirectory = path.join(versionDirectory, 'kt');
    const groupIndexDataDirectory = path.join(dataDirectory, 'index.json');
    return fs.readJsonSync(groupIndexDataDirectory);
  } catch (error) {
    console.error(error);
  }
}
