import fs from 'fs-extra';
import path from 'path-extra';
import ospath from 'ospath';
// helpers
import { getLatestVersionInPath } from './ResourcesHelpers';
// constants
const USER_RESOURCES_PATH = path.join(ospath.home(), 'translationCore/resources');

const cleanReaddirSync = (path) => {
  const cleanDirectories = fs.readdirSync(path)
    .filter(file => file !== '.DS_Store');
  return cleanDirectories;
};

export const getLocalResourceList = () => {
  try {
    const localResourceList = [];
    const resourceLanguages = fs.readdirSync(USER_RESOURCES_PATH)
      .filter(file => path.extname(file) !== '.json' && file !== '.DS_Store');

    for (let i = 0; i < resourceLanguages.length; i++) {
      const languageId = resourceLanguages[i];
      const biblesPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles');
      const tHelpsPath = path.join(USER_RESOURCES_PATH, languageId, 'translationHelps');
      const bibleIds = cleanReaddirSync(biblesPath);
      const tHelpsResources = cleanReaddirSync(tHelpsPath);

      bibleIds.forEach(bibleId => {
        const bibleIdPath = path.join(biblesPath, bibleId);
        const bibleLatestVersion = getLatestVersionInPath(bibleIdPath);

        const resourceManifest = fs.readJsonSync(path.join(bibleLatestVersion, 'manifest.json'));
        const localResource = {
          languageId: languageId,
          resourceId: bibleId,
          modifiedTime: resourceManifest.dublin_core.modified
        };

        localResourceList.push(localResource);
      });

      tHelpsResources.forEach(tHelpsId => {
        const tHelpResource = path.join(tHelpsPath, tHelpsId);
        const tHelpsLatestVersion = getLatestVersionInPath(tHelpResource);

        const resourceManifest = fs.readJsonSync(path.join(tHelpsLatestVersion, 'manifest.json'));
        const localResource = {
          languageId: languageId,
          resourceId: tHelpsId,
          modifiedTime: resourceManifest.dublin_core.modified
        };

        localResourceList.push(localResource);
      });
    }
    return localResourceList;
  } catch (error) {
    return null;
  }
};
