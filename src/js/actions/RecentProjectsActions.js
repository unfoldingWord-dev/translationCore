import fs from 'fs-extra';
import path from 'path-extra';
import ospath from '../common/ospath-extra';
import consts from './ActionTypes';
// constants
const DEFAULT_SAVE = path.join(ospath.home(), 'translationCore', 'projects');

/**
 * Reads projects from the fs in ~/translationCore/
 */
export function getProjectsFromFolder() {
  const recentProjects = fs.readdirSync(DEFAULT_SAVE);
  return {
    type: consts.GET_RECENT_PROJECTS,
    recentProjects: recentProjects,
  };
}
