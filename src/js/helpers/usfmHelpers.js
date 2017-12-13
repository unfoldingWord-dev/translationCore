/* eslint-disable no-console */
import fs from 'fs-extra';
import usfm from 'usfm-js';
// helpers
import * as bibleHelpers from './bibleHelpers';

/**
 * @description Sets up the folder in the tC save location for a USFM project
 * @param {String} usfmFilePath - Path of the usfm file that has been loaded
 */
export function loadUSFMFile(usfmFilePath) {
  let usfmFile;
  try {
    usfmFile = fs.readFileSync(usfmFilePath).toString();
  } catch (e) {
    return null;
  }
  return usfmFile;
}

/**
 * @description Parses the usfm file using usfm-parse library.
 * @param {string} usfmFile - Path in which the USFM project is being loaded from
 */
export function getParsedUSFM(usfmFile) {
  try {
    if (usfmFile)
      return usfm.toJSON(usfmFile);
  } catch (e) {
    console.error(e);
  }
}

/**
* Most important funciton for creating a project from a USFM file alone. This function gets the
* book name, id, language name and direction for starting a tC project.
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
    // Conditional to determine how USFM should be parsed.
    let isSpaceDelimited = usfmObject.headers.id.split(" ").length > 1;
    let isCommaDelimited = usfmObject.headers.id.split(",").length > 1;
    if (isSpaceDelimited) {
      // i.e. TIT EN_ULB sw_Kiswahili_ltr Wed Jul 26 2017 22:14:55 GMT-0700 (PDT) tc.
      // Could have attached commas if both comma delimited and space delimited
      headerIDArray = usfmObject.headers.id.split(" ");
      headerIDArray.forEach((element, index) => {
        headerIDArray[index] = element.replace(',', '');
      });
      details.book.id = headerIDArray[0].trim().toLowerCase();
    } else if (isCommaDelimited) {
      // i.e. TIT, gux_Gourmanchéma_ltr, EN_ULB, Thu Jul 20 2017 16:03:48 GMT-0700 (PDT), tc.
      headerIDArray = usfmObject.headers.id.split(",");
      details.book.id = headerIDArray[0].trim().toLowerCase();
    }
    else {
      // i.e. EPH
      details.book.id = usfmObject.headers.id.toLowerCase();
    }

    let fullBookName = bibleHelpers.convertToFullBookName(details.book.id);
    if (fullBookName) details.book.name = fullBookName;
    else {
      fullBookName = bibleHelpers.convertToFullBookName(usfmObject.book);
      if (fullBookName)
        details.book.name = fullBookName;
      else {
        details.book.id = null;
      }
    }

    let tcField = headerIDArray[headerIDArray.length - 1] || '';
    if (tcField.trim() == 'tc') {
      // Checking for tC field to parse with more information than standard usfm.
      for (var index in headerIDArray) {
        let languageCodeArray = headerIDArray[index].trim().split('_');
        if (languageCodeArray.length == 3) {
          details.language.id = languageCodeArray[0].toLowerCase();
          details.language.name = languageCodeArray[1];
          details.language.direction = languageCodeArray[2].toLowerCase();
        }
      }
    }
  }
  return details;
}
