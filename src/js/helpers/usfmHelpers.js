/* eslint-disable no-console */
import Path from 'path-extra';
import * as fs from 'fs-extra';
import usfm from 'usfm-js';
// helpers
import * as bibleHelpers from './bibleHelpers';

/**
* @description Sets up the folder in the tC save location for a USFM project
*
* @param {string} usfmFilePath - Path of the usfm file that has been loaded
*/
export function loadUSFMFile(usfmFilePath) {
  const usfmFile = fs.readFileSync(usfmFilePath).toString();
  return usfmFile
}

/**
 * @description Parses the usfm file using usfm-parse library.
 *
 * @param {string} projectPath - Path in which the USFM project is being loaded from
 */
export function getParsedUSFM(usfmFile) {
  try {
    let parsedUSFM = usfm.toJSON(usfmFile);
    return parsedUSFM;
  } catch (e) {
    console.error(e);
  }
}

/**
 * @description Checks if the folder/file specified is a usfm project
 *
 * @param {string} projectPath - Path in which the project is being loaded from
 */
export function isUSFMProject(projectPath) {
  try {
    fs.readFileSync(projectPath);
    const ext = Path.extname(projectPath).toLowerCase();
    if (ext == ".usfm" || ext == ".sfm" || ext == ".txt") return projectPath;
  } catch (e) {
    try {
      let dir = fs.readdirSync(projectPath);
      for (let i in dir) {
        const ext = Path.extname(dir[i]).toLowerCase();
        if (ext == ".usfm" || ext == ".sfm" || ext == ".txt") return Path.join(projectPath, dir[i]);
      }
      return false;
    } catch (err) {
      return false;
    }
  }
}

/**
* @description Set ups a tC project parameters for a usfm project
* @param {string} bookAbbr - Book abbreviation
* @param {path} projectPath - Path of the usfm project being loaded
* @param {path} direction - Reading direction of the project books
* @return {object} action object.
*/
export function getUSFMParams(projectPath, manifest) {
  let bookAbbr;
  if (manifest.project) bookAbbr = manifest.project.id;
  else if (manifest.ts_project) bookAbbr = manifest.ts_project.id;
  let direction = manifest.target_language.direction;
  let params = {
    originalLanguagePath: '',
    targetLanguagePath: projectPath,
    direction: direction,
    bookAbbr: bookAbbr
  };
  if (bibleHelpers.isOldTestament(bookAbbr)) {
    params.originalLanguage = "hebrew";
  } else {
    params.originalLanguage = "greek";
  }
  return params;
}

/**
* Most important funciton for creating a project from a USFM file alone. This function gets the
* book name, id, language name and direction for starting a tC project.
*
* @param {object} usfmObject - Object created by USFM to JSON module. Contains information
* for parsing and using in tC such as book name.
*/
export function getUSFMDetails(usfmObject) {
  let details = {
    book: {
      id: undefined,
      name: undefined
    },
    language: {
      id: undefined,
      name: undefined,
      direction: 'ltr'
    }
  };

  let headerIDArray = [];
  if (usfmObject.headers && usfmObject.headers.id) {
    /** Conditional to determine how USFM should be parsed*/
    let isSpaceDelimited = usfmObject.headers.id.split(" ").length > 1;
    let isCommaDelimited = usfmObject.headers.id.split(",").length > 1;
    if (isCommaDelimited) {
      /**i.e. TIT, gux_Gourmanchéma_ltr, EN_ULB, Thu Jul 20 2017 16:03:48 GMT-0700 (PDT), tc */
      headerIDArray = usfmObject.headers.id.split(",");
      details.book.id = headerIDArray[0].trim().toLowerCase();
    }
    else if (isSpaceDelimited) {
      /**i.e. TIT EN_ULB sw_Kiswahili_ltr Wed Jul 26 2017 22:14:55 GMT-0700 (PDT) tc */
      headerIDArray = usfmObject.headers.id.split(" ");
      details.book.id = headerIDArray[0].trim().toLowerCase();
    }
    else {
      /**i.e. EPH */
      details.book.id = usfmObject.headers.id.toLowerCase();
    }

    let tcField = headerIDArray[headerIDArray.length - 1] || '';
    if (tcField.trim() == 'tc') {
      /**Checking for tC field to parse with more information than standard usfm */
      for (var index in headerIDArray) {
        /**The language code and resource name field were wrongly parsed in
        * the first implementation. In order to account for usfm files exported
        * from tC with this format this is checking for the string that
        * contains three pieces of information delimited with underscores
        * Therefore deeming it as the langauge code field i.e. 'sw_Kiswahili_ltr'
        * rather than the resource field i.e. 'EN_ULB'
        */
        let languageCodeArray = headerIDArray[index].trim().split('_');
        if (languageCodeArray.length == 3) {
          details.language.id = languageCodeArray[0].toLowerCase();
          details.language.name = languageCodeArray[1];
          details.language.direction = languageCodeArray[2].toLowerCase();
        }
      }
    }

    details.book.name = bibleHelpers.convertToFullBookName(details.book.id);
  }
  return details;
}

/**
 * @description Sets up a USFM project manifest according to tC standards.
 *
 * @param {object} parsedUSFM - The object containing usfm parsed by chapters
 * @param {string} direction - Direction of the book being read for the project target language
 * @param {objet} user - The current user loaded
 */
export function setUpDefaultUSFMManifest(parsedUSFM, direction, username) {
  let { id, name, bookAbbr, bookName } = getUSFMDetails(parsedUSFM);
  const defaultManifest = {
    "source_translations": [
      {
        "language_id": "en",
        "resource_id": "ulb",
        "checking_level": "",
        "date_modified": new Date(),
        "version": ""
      }
    ],
    tcInitialized: true,
    target_language: {
      direction: direction,
      id,
      name
    },
    project: {
      id: bookAbbr,
      name: bookName
    },
    "checkers": [
      username
    ]
  }
  return defaultManifest;
}
