/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path-extra';
import csv from 'csv';
// helpers
import { getLatestVersionInPath } from './ResourcesHelpers';
import * as groupsIndexHelpers from './groupsIndexHelpers';

/**
 * @description - To prevent these files from being read in for every groupName lookup, read them in once.
 */
const tHelpsPath = path.join(__dirname, '..', '..', '..', 'tC_resources', 'resources', 'en', 'translationHelps');
const tWpath = path.join(tHelpsPath, 'translationWords');
let tWversionPath = getLatestVersionInPath(tWpath) || tWpath;
const tWktIndexPath = path.join(tWversionPath, 'kt', 'index.json');
const tWnamesIndexPath = path.join(tWversionPath, 'names', 'index.json');
const tWotherIndexPath = path.join(tWversionPath, 'other', 'index.json');
let tWktIndex = [];
if (fs.existsSync(tWktIndexPath))
  tWktIndex = fs.readJsonSync(tWktIndexPath);
let tWotherIndex = [];
if (fs.existsSync(tWotherIndexPath))
  tWotherIndex = fs.readJsonSync(tWotherIndexPath);
let tWnamesIndex = [];
if (fs.existsSync(tWnamesIndexPath))
  tWnamesIndex = fs.readJsonSync(tWnamesIndexPath);
const tWIndex = tWktIndex.concat(tWnamesIndex).concat(tWotherIndex);
const tNpath = path.join(tHelpsPath, 'translationNotes');
let tNversionPath = getLatestVersionInPath(tNpath) || tNpath;
const tNIndexPath = path.join(tNversionPath, 'index.json');
const tNIndex = fs.readJsonSync(tNIndexPath);

/**
 * todo: fix makeBlank
 * @description - combines all data needed for csv
 * @param {object} data - the data that the rest appends to
 * @param {object} contextId - to be merged in
 * @param {object} indexObject - to be used to get groupName
 * @param {array} indexObject - Array of index.json with {id, name} keys
 * @param {string} username
 * @param {timestamp} timestamp to be converted into date and time
 * @param {boolean} - This is a temporary flag to hide bad data
 * @return {object}
 */
export function combineData(data, contextId, username, timestamp, makeBlank = false) {
  const blankParams = ['groupId', 'groupName', 'gateway Language Quote', 'occurrence', 'quote'];
  const flatContextId = flattenContextId(contextId);
  const userTimestamp = userTimestampObject(username, timestamp);
  const combinedData = Object.assign({}, data, flatContextId, userTimestamp);
  if (makeBlank) blankParams.forEach((key) => {
    if (combinedData[key]) combinedData[key] = '';
  });
  return combinedData;
}
/**
 * @description - flattens the context id for csv usage
 * @param {object} contextId - contextID object that needs to go onto the csv row
 * @param {array} indexObject - Array of index.json with {id, name} keys
 * @return {object}
 */
export const flattenContextId = (contextId) => {
  const flatContextId = {
    tool: contextId.tool,
    groupId: contextId.groupId,
    groupName: groupName(contextId),
    occurrence: contextId.occurrence,
    quote: contextId.quote,
    bookId: contextId.reference.bookId,
    chapter: contextId.reference.chapter,
    verse: contextId.reference.verse
  };
  return flatContextId;
};

/**
 * @description - Returns the corresponding group name i.e. Metaphor
 * given the group id such as figs_metaphor
 * @param {Object} contextId - context id to get toolName and groupName
 */
export const groupName = (contextId) => {
  let indexArray;
  let {tool, groupId} = contextId;
  switch (tool) {
    case 'translationNotes':
      indexArray = tNIndex;
      break;
    case 'translationWords':
      indexArray = tWIndex;
      break;
    default:
      indexArray = undefined;
      // do something later with other resources
  }
  let indexObject = {};
  let groupName;
  if (indexArray) {
    indexArray.forEach( group => {
      indexObject[group.id] = group.name;
    });
    groupName = indexObject[groupId];
    if (!groupName) {
      console.warn('Could not find group name for id: ', groupId, ' in tool: ', tool);
    }
  } else {
    // if other tools don't have an indexArray, just return groupId as groupName
    groupName = groupId;
  }
  return groupName;
};

/**
 * @description - turns a username and timestamp into usable object for csv
 * @param {string} username
 * @param {timestamp} timestamp to be converted into date and time
 */
export const userTimestampObject = (username, timestamp) => {
  return {
    username,
    date: dateFromTimestamp(timestamp),
    time: timeFromTimestamp(timestamp)
  };
};
/**
 * @description - turns a timestamp into date
 * @param {timestamp} timestamp to be converted into date
 */
export const dateFromTimestamp = (timestamp) => {
    const datetime = timestamp.replace(/_/g, ":");
    const dateObj = new Date(datetime);
    //Converts to format as such DD/MM/YYYY
    const date = [pad(dateObj.getMonth() + 1), pad(dateObj.getDate()), dateObj.getFullYear()].join("/");
    return date;
};
/**
 * @description - turns a timestamp into time
 * @param {timestamp} timestamp to be converted into time
 */
export const timeFromTimestamp = (timestamp) => {
  const datetime = timestamp.replace(/_/g, ":");
  //Converts to format as such HH:MM:SS
  const time = new Date(datetime).toString().split(" ")[4];
  return time;
};
/**
 * @description - Pad numbers to make them sortable and human readable
 * @param {int} number
 */
const pad = (number) => {
  return number < 10 ? 0 + `${number}` : number;
};
/**
 * @description - Gets the tool folder names
 * @param {string} projectPath
 */
export function getToolFolderNames(projectPath) {
  const _dataPath = dataPath(projectPath);
  let toolsPath = path.join(_dataPath, 'index');
  if (fs.existsSync(toolsPath)) {
    let toolNames = fs.readdirSync(toolsPath)
    .filter(file => { return fs.lstatSync(path.join(toolsPath, file)).isDirectory() });
    return toolNames;
    // TODO! check to see if it is a directory and only return those
  } else {
    console.log('Could not find index path for tool information');
  }
}
export const dataPath = (projectPath) => {
  return path.join(projectPath, '.apps', 'translationCore');
};
export const tmpPath = (projectPath) => {
  return path.join(dataPath(projectPath), 'output');
};
/**
 * @description - cleanup the temporary csv files
 * @param {string} tmpPath - Path to cleanup
 */
export const cleanupTmpPath = (projectPath) => {
  const _tmpPath = tmpPath(projectPath);
  if (fs.existsSync(_tmpPath)) {
    fs.removeSync(path.join(_tmpPath));
  }
};
/**
 * @description - get the project id from the manifest in the projectPath
 * @param {string} projectPath - Path to current project
 */
export const getProjectId = (projectPath) => {
  let projectId;
  const manifestPath = path.join(projectPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readJsonSync(manifestPath);
    projectId = (manifest && manifest.project) ? manifest.project.id : undefined;
    return projectId;
  }
  throw 'Cannot read project manifest: ', manifestPath;
};
/**
 * @description - Generates a CSVString from an array of objects
 * @param {Array} objectArray - array of objects to convert to csv
 * @param {function} callback - The callback that passes err, csv string output
 */
export const generateCSVString = (objectArray, callback) => {
  if (objectArray.length > 0) {
    // extract the headers from the objectArray, assuming first is representative
    const headers = Object.keys(objectArray[0]);
    // loop through the objectArray to generate a row from each object in the array
    const rows = objectArray.map(object => {
      // use the headers to get the values of each object to create the row
      const row = headers.map(header => {
        return object[header];
      });
      return row;
    });
    // make the headers the first row and append the rows
    const data = [headers].concat(rows);
    csv.stringify(data, function(err, data){
      callback(err, data);
    });
  } else { // there is no data, give back enough data to create an empty file.
    const data = [['No data']];
    callback(null, data);
  }
};
/**
 * @description - Generates a CSV and writes to File from an array of objects
 * @param {Array} objectArray - array of objects to convert to csv
 * @param {string} filePath - path of the file to write
 */
export const generateCSVFile = (objectArray, filePath) => {
  return new Promise(function(resolve, reject) {
    generateCSVString(objectArray, (err, csvString) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        try {
          if (csvString) {
            fs.outputFileSync(filePath, csvString);
          }
          resolve(true);
        } catch (_err) {
          console.log(_err);
          reject(_err);
        }
      }
    });
  });
};

/**
 * loads the groups index array using the toolname
 * from objectData
 * @param {Object} objectData
 */
export function getGroupsIndexForCsvExport(objectData) {
  try {
    let groupsIndex = [];
    if (objectData && objectData.contextId && objectData.contextId.tool && objectData.contextId.groupId) {
      const toolName = objectData.contextId.tool;
      groupsIndex = groupsIndexHelpers.getGroupsIndex('en', toolName);
    }
  return groupsIndex;
  } catch (error) {
    console.error(error);
  }
}
