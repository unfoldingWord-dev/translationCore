import path from "path-extra";
import ospath from "ospath";
import fs from "fs-extra";
import {generateTimestamp} from "./TimestampGenerator";
export const USER_RESOURCES_PATH = path.join(ospath.home(), "translationCore",
  "resources");
// actions
import {loadCheckData} from '../actions/CheckDataLoadActions';
// constants
const PROJECT_TC_DIR = path.join('.apps', 'translationCore');
const CHECKDATA_DIRECTORY = path.join(PROJECT_TC_DIR, 'checkData');

/**
 * Provides an interface with which tools can interact with a project.
 */
export default class ProjectAPI {

  /**
   * Creates a new project api
   * @param {string} projectDir - the absolute path to the project directory
   */
  constructor(projectDir) {
    this._projectPath = projectDir;
    this._dataPath = path.join(projectDir, PROJECT_TC_DIR);
    this._manifest = null;

    this.writeDataFile = this.writeDataFile.bind(this);
    this.writeDataFileSync = this.writeDataFileSync.bind(this);
    this.readDataDir = this.readDataDir.bind(this);
    this.readDataDirSync = this.readDataDirSync.bind(this);
    this.readFile = this.readFile.bind(this);
    this.readDataFile = this.readDataFile.bind(this);
    this.readFileSync = this.readFileSync.bind(this);
    this.readDataFileSync = this.readDataFileSync.bind(this);
    this.dataPathExists = this.dataPathExists.bind(this);
    this.pathExistsSync = this.pathExistsSync.bind(this);
    this.dataPathExistsSync = this.dataPathExistsSync.bind(this);
    this.deleteDataFile = this.deleteDataFile.bind(this);
    this.deleteDataFileSync = this.deleteDataFileSync.bind(this);
    this.getCategoriesDir = this.getCategoriesDir.bind(this);
    this.importCategoryGroupData = this.importCategoryGroupData.bind(this);
    this.getManifest = this.getManifest.bind(this);
    this.getBookId = this.getBookId.bind(this);
    this.isCategoryLoaded = this.isCategoryLoaded.bind(this);
    this.setCategoryLoaded = this.setCategoryLoaded.bind(this);
    this.getGroupsData = this.getGroupsData.bind(this);
    this.getGroupData = this.getGroupData.bind(this);
    this.setCategoryGroupIds = this.setCategoryGroupIds.bind(this);
    this.getAllCategoryMapping = this.getAllCategoryMapping.bind(this);
  }

  /**
   * Returns the path to the project directory
   * @returns {string}
   */
  get path() {
    return this._projectPath;
  }

  /**
   * Returns the path to the project data directory
   * @returns {*}
   */
  get dataPath() {
    return this._dataPath;
  }

  /**
   * Returns the path to the categories index directory.
   * This is the same as the groups data directory.
   * @param {string} toolName - the name of the tool that the categories belong to
   * @returns {*}
   */
  getCategoriesDir(toolName) {
    // TODO: the book id is redundant to have in the project directory.
    const bookId = this.getBookId();
    return path.join(this._dataPath, "index", toolName, bookId);
  }

  /**
   * Returns a dictionary of all the group data loaded for a given tool.
   * This will silently fail if the groups data does not exist.
   * @param {string} toolName - the name of the tool who's group data will be returned
   * @returns {*}
   */
  getGroupsData(toolName) {
    const data = {};
    const dir = this.getCategoriesDir(toolName);

    if (fs.pathExistsSync(dir) && fs.lstatSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir)
        .filter(item => path.extname(item) === '.json');

      for (let i = 0, len = files.length; i < len; i++) {
        const dataPath = path.join(dir, files[i]);
        const groupName = path.basename(dataPath, ".json");
        try {
          let groupData = fs.readJsonSync(dataPath);

          // check & fix corrupted selections value for each group data item.
          groupData = groupData.map(groupDataItem => {
            if (groupDataItem.selections === true) {// if selections is true then find selections array.
              const {bookId, chapter, verse} = groupDataItem.contextId.reference;
              const loadPath = path.join(
                this._projectPath,
                CHECKDATA_DIRECTORY,
                'selections',
                bookId,
                chapter.toString(),
                verse.toString()
              );

              const {selections} = loadCheckData(loadPath, groupDataItem.contextId);
              groupDataItem.selections = selections || false;
              return groupDataItem;
            }
            return groupDataItem;
          });

          data[groupName] = groupData;
        } catch (e) {
          console.error(`Failed to load group data from ${dataPath}`);
          console.error(e);
        }
      }
    }

    return data;
  }

  /**
   * Returns a single group data item
   * @throws an I/O error if there is a problem reading the file.
   * @param {string} toolName - the tool name. This is synonymous with translationHelp name
   * @param {string} groupId - the group id
   * @returns {object[]} - the group data object
   */
  getGroupData(toolName, groupId) {
    const dataPath = path.join(this.getCategoriesDir(toolName), `${groupId}.json`);
    return fs.readJsonSync(dataPath);
  }

  /**
   * Imports a group data file into the project.
   * Group data that already exists will not be overwritten.
   * @param {string} toolName - the name of the tool that the categories belong to
   * @param {string} dataPath - the path to the group data file
   * @returns {boolean} true if the group data was imported. false if already imported.
   */
  importCategoryGroupData(toolName, dataPath) {
    const destDir = this.getCategoriesDir(toolName);
    const groupName = path.basename(dataPath);
    const destFile = path.join(destDir, groupName);
    const groupsDataLoaded = this.getLoadedCategories(toolName);
    const subCategory = path.parse(dataPath).name;
    if (!groupsDataLoaded.includes(subCategory)) {
      fs.copySync(dataPath, destFile);
      return true;
    }
    return false;
  }

  /**
   * Loads the project manifest from the disk.
   * Subsequent calls are cached.
   * @throws an error if the manifest does not exist.
   * @returns {JSON} the manifest json object
   */
  getManifest() {
    if (this._manifest === null) {
      const data = this.readFileSync("manifest.json");
      this._manifest = JSON.parse(data);
    }
    return this._manifest;
  }

  /**
   * Returns the project's book id
   * @throws an error if the book id does not exist.
   * @returns {string}
   */
  getBookId() {
    const manifest = this.getManifest();
    return manifest.project.id;
  }

  /**
   * Returns the name of the book.
   * If available the name will be localized.
   * @returns {string}
   */
  getBookName() {
    const manifest = this.getManifest();
    if (manifest.target_language && manifest.target_language.book && manifest.target_language.book.name) {
      return manifest.target_language.book.name;
    } else {
      return manifest.project.name;
    }
  }

  /**
   * Checks if a tool (a.k.a. translationHelps) category has been copied into the project.
   * @param {string} toolName - the tool name. This is synonymous with translationHelp name
   * @param {string} category - the category id
   * @returns {boolean}
   */
  isCategoryLoaded(toolName, category) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        const data = fs.readJsonSync(categoriesPath);
        return data.loaded.indexOf(category) >= 0;
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }

    // rebuild missing/corrupt category index
    fs.outputJsonSync(categoriesPath, {
      current: [],
      loaded: []
    });

    return false;
  }
  /**
   * Method to check if project groups data is out of date in relation
   * to the last source content update
   * @param {string} toolName - the tool name. This is synonymous with translationHelp name
   * @returns {Boolean}
   */
  hasNewGroupsData(toolName) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        let rawData = fs.readJsonSync(categoriesPath);
        const lastTimeDataUpdated = rawData.timestamp;
        if (!lastTimeDataUpdated) {
          return true;
        }
        const sourceContentManifestPath = path.join(USER_RESOURCES_PATH, 'source-content-updater-manifest.json');
        const {modified: lastTimeDataDownloaded} = fs.readJSONSync(sourceContentManifestPath);
        return new Date(lastTimeDataDownloaded) > new Date(lastTimeDataUpdated);
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }
    return true; // return true if file missing or error
  }

  /**
   * Resets the `loaded` array of groups data
   * Useful for forcing a reinitialization of groups data from resources into project
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   */
  resetLoadedCategories(toolName) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        let rawData = fs.readJsonSync(categoriesPath);
        rawData.loaded = [];
        fs.outputJsonSync(categoriesPath, rawData);
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }
  }

  /**
   * Removes categories from the currently selected that are not in the loaded array
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   * @param {Object} availableCategories - categories available in resources
   */
  removeStaleCategoriesFromCurrent(toolName, availableCategories) {
    const groupsPath = this.getCategoriesDir(toolName);
    const categoriesPath = path.join(groupsPath,
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        let rawData = fs.readJsonSync(categoriesPath);
        rawData.current.forEach((category, index) => {
          if (!rawData.loaded.includes(category)) {
            //There is something that is selected that is not loaded
            //Or there is something that is selected that is not in the current resources folder
            rawData.current.splice(index, 1);
          }
        });
        fs.outputJsonSync(categoriesPath, rawData);
        const contextIdPath = path.join(groupsPath, 'currentContextId', 'contextId.json');
        if (fs.existsSync(contextIdPath)) {
          try {
            const currentContextId = fs.readJSONSync(contextIdPath);
            const currentContextIdGroup = currentContextId.groupId;
            if (!rawData.loaded.includes(currentContextIdGroup)) {
              fs.removeSync(contextIdPath);
            }
          } catch (e) {
            console.log('Could not reset current context id');
          }
        }
        let loadedSubCategories = rawData.loaded;
        if (toolName === "translationWords") {
          // for tW we don't select by subcategories, so need to get subcategories for the available categories
          loadedSubCategories = [];
          const keys = Object.keys(availableCategories);
          for (let i = 0, l = keys.length; i < l; i++) {
            loadedSubCategories.push.apply(loadedSubCategories,availableCategories[keys[i]]);
          }
        }
        const currentGroupsData = fs.readdirSync(groupsPath).filter((name) => name.includes('.json'));
        currentGroupsData.forEach((category) => {
          if (!loadedSubCategories.includes(path.parse(category).name)) {
            //removing groups data files that are not in loaded
            fs.removeSync(path.join(groupsPath, category));
          }
        });
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }
  }

  /**
   * Marks a category as having been loaded into the project.
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   * @param {string} category - the category that has been copied into the project
   * @param {boolean} [loaded=true] - indicates if the category is loaded
   * @returns {boolean}
   */
  setCategoryLoaded(toolName, category, loaded = true) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    let data = {
      current: [],
      loaded: loaded ? [category] : []
    };

    if (fs.pathExistsSync(categoriesPath)) {
      try {
        let rawData = fs.readJsonSync(categoriesPath);
        // TRICKY: assert data structure before overwriting default to not propagate errors.
        if (loaded) {
          if (!rawData.loaded.includes(category))
            rawData.loaded.push(category);
        } else {
          //Removing the loaded category from list
          rawData.loaded = rawData.loaded.filter(c => c !== category);
        }
        data = rawData;
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }
    data.timestamp = generateTimestamp();
    fs.outputJsonSync(categoriesPath, data);
  }

  /**
   * Removes category index from project, and creates empty directory
   * Useful for getting rid of stale data after a resource update
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   */
  resetCategoryGroupIds(toolName) {
    const indexPath = path.join(this.getCategoriesDir(toolName),
      ".categoryIndex");
    fs.removeSync(indexPath);
    fs.ensureDirSync(indexPath);
  }

  /**
   * Records an index of which groups belong to which category.
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   * @param {string} category - the name of the category to which the groups belong
   * @param {string[]} groups - an array of group ids
   */
  setCategoryGroupIds(toolName, category, groups) {
    const indexPath = path.join(this.getCategoriesDir(toolName),
      ".categoryIndex", `${category}.json`);
    fs.outputJsonSync(indexPath, groups);
  }

  /**
   * Returns an array of groups ids for the given category
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   * @param {string} category - the name of the category
   * @returns {string[]} - an array of group ids that belong to the category
   */
  getCategoryGroupIds(toolName, category) {
    const indexPath = path.join(this.getCategoriesDir(toolName),
      ".categoryIndex", `${category}.json`);
    if (fs.pathExistsSync(indexPath)) {
      try {
        return fs.readJsonSync(indexPath);
      } catch (e) {
        console.error(`Failed to read the category index at ${indexPath}`, e);
      }
    }
    return [];
  }

  getAllCategoryMapping(toolName) {
    const parentCategoriesObject = {};
    const indexPath = path.join(this.getCategoriesDir(toolName),
      ".categoryIndex");
    if (fs.pathExistsSync(indexPath)) {
      try {
        const parentCategories = fs.readdirSync(indexPath).map((fileName) => path.parse(fileName).name);
        parentCategories.forEach((category) => {
          const subCategoryPath = path.join(this.getCategoriesDir(toolName),
            ".categoryIndex", `${category}.json`);
          const arrayOfSubCategories = fs.readJsonSync(subCategoryPath);
          parentCategoriesObject[category] = arrayOfSubCategories;
        });
      } catch (e) {
        console.error(`Failed to read the category index at ${indexPath}`, e);
      }
    }
    return parentCategoriesObject;
  }

  /**
   * Returns an array of categories that have been selected for the given tool.
   * @param toolName - The tool name. This is synonymous with translationHelp name
   * @return {string[]} an array of category names
   */
  getSelectedCategories(toolName, withParent = false) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        const data = fs.readJsonSync(categoriesPath);
        if (withParent) {
          let objectWithParentCategories = {};
          const subCategories = data.current;
          subCategories.forEach((subCategory) => {
            const parentCategoryMapping = this.getAllCategoryMapping(toolName);
            Object.keys(parentCategoryMapping).forEach((categoryName) => {
              if (parentCategoryMapping[categoryName].includes(subCategory)) {
                //Sub categorie name is contained in this parent
                if (!objectWithParentCategories[categoryName])
                  objectWithParentCategories[categoryName] = [];
                objectWithParentCategories[categoryName].push(subCategory);
              }
            });
          });
          return objectWithParentCategories;
        } else {
          return data.current;
        }
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }

    return [];
  }

  /**
 * Returns an array of categories that have been loaded for the given tool.
 * @param toolName - The tool name. This is synonymous with translationHelp name
 * @return {string[]} an array of category names
 */
  getLoadedCategories(toolName) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    if (fs.pathExistsSync(categoriesPath)) {
      try {
        const data = fs.readJsonSync(categoriesPath);
        return data.loaded;
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }

    return [];
  }

  /**
   * Sets the categories that have been selected for the the given tool.
   * Category selection controls which sets of help data will be loaded
   * when the tool is opened.
   * @param {string} toolName - The tool name. This is synonymous with translationHelp name
   * @param {string[]} [categories=[]] - an array of category names
   */
  setSelectedCategories(toolName, categories = []) {
    const categoriesPath = path.join(this.getCategoriesDir(toolName),
      ".categories");
    let data = {
      current: categories,
      loaded: [],
      timestamp: generateTimestamp()
    };

    if (fs.pathExistsSync(categoriesPath)) {
      try {
        const rawData = fs.readJsonSync(categoriesPath);
        // TRICKY: assert data structure before overwriting default to not propagate errors.
        rawData.current = categories;
        data = rawData;
      } catch (e) {
        console.warn(
          `Failed to parse tool categories index at ${categoriesPath}.`, e);
      }
    }
    fs.outputJsonSync(categoriesPath, data);
  }

  /**
   * Handles writing data to the project's data directory.
   *
   * @param {string} filePath - the relative path to be written
   * @param {string} data - the data to write
   * @return {Promise}
   */
  async writeDataFile(filePath, data) {
    const writePath = path.join(this._dataPath, filePath);
    return await fs.outputFile(writePath, data);
  }

  /**
   * Handles synchronously writing data to the project's data directory.
   * @param {string} filePath - the relative path to be written
   * @param {string} data - the data to write
   */
  writeDataFileSync(filePath, data) {
    const writePath = path.join(this._dataPath, filePath);
    fs.outputFileSync(writePath, data);
  }

  /**
   * Reads the contents of the project's data directory.
   * @param {string} dir - the relative path to read
   * @return {Promise<string[]>}
   */
  async readDataDir(dir) {
    const dirPath = path.join(this._dataPath, dir);
    return await fs.readdir(dirPath);
  }

  /**
   * Handles synchronously reading a directory in the project's data directory.
   * @param {string} dir - the relative path to read
   * @return {string[]}
   */
  readDataDirSync(dir) {
    const dirPath = path.join(this._dataPath, dir);
    return fs.readdirSync(dirPath);
  }

  /**
   * Handles reading data from the project's root directory
   *
   * @param {string} filePath - the relative path to read
   * @return {Promise<string>}
   */
  async readFile(filePath) {
    const readPath = path.join(this._projectPath, filePath);
    const data = await fs.readFile(readPath);
    return data.toString();
  }

  /**
   * Handles reading data from the project's data directory
   *
   * @param {string} filePath - the relative path to read
   * @return {Promise<string>}
   */
  async readDataFile(filePath) {
    const readPath = path.join(this._dataPath, filePath);
    const data = await fs.readFile(readPath);
    return data.toString();
  }

  /**
   * Handles reading data from the project's root directory.
   * You probably shouldn't use this in most situations.
   * @throws an exception if the path does not exist.
   * @param {string} filePath - the relative file path
   * @returns {string}
   * @private
   */
  readFileSync(filePath) {
    const readPath = path.join(this._projectPath, filePath);
    const data = fs.readFileSync(readPath);
    return data.toString();
  }

  /**
   * Handles synchronously reading data from the project's data directory.
   * @throws an exception if the path does not exist.
   * @param {string} filePath - the relative path to read
   * @return {string}
   */
  readDataFileSync(filePath) {
    const readPath = path.join(this._dataPath, filePath);
    const data = fs.readFileSync(readPath);
    return data.toString();
  }

  /**
   * Checks if the path exists in the project's data directory
   * @param {string} filePath - the relative path who's existence will be checked
   * @return {Promise<boolean>}
   */
  async dataPathExists(filePath) {
    const readPath = path.join(this._dataPath, filePath);
    return await fs.pathExists(readPath);
  }

  /**
   * Checks if the path exists in the project's root directory
   * @param filePath
   * @returns {Promise<boolean>|*}
   * @private
   */
  pathExistsSync(filePath) {
    const readPath = path.join(this._projectPath, filePath);
    return fs.pathExistsSync(readPath);
  }

  /**
   * Synchronously checks if a path exists in the project's data directory
   * @param {string} filePath - the relative path who's existence will be checked
   * @return {boolean}
   */
  dataPathExistsSync(filePath) {
    const readPath = path.join(this._dataPath, filePath);
    return fs.pathExistsSync(readPath);
  }

  /**
   * Handles deleting global project data files
   *
   * @param {string} filePath - the relative path to delete
   * @return {Promise}
   */
  async deleteDataFile(filePath) {
    const fullPath = path.join(this._dataPath, filePath);
    return await fs.remove(fullPath);
  }

  /**
   * Handles deleting global project data files synchronously
   *
   * @param {string} filePath - the relative path to delete
   */
  deleteDataFileSync(filePath) {
    const fullPath = path.join(this._dataPath, filePath);
    fs.removeSync(fullPath);
  }
}
