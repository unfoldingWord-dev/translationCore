/* eslint-disable no-async-promise-executor */
import React from 'react';
import fs from 'fs-extra';
import path from 'path-extra';
import usfmjs from 'usfm-js';
import _ from 'lodash';
import wordaligner from 'word-aligner';
// helpers
import * as usfmHelpers from '../usfmHelpers';
import * as manifestHelpers from '../manifestHelpers';
import * as BibleHelpers from '../bibleHelpers';
// actions
import * as ResourcesActions from '../../actions/ResourcesActions';
// constants
import { IMPORTS_PATH, TARGET_LANGUAGE } from '../../common/constants';

export const convertToProjectFormat = (sourceProjectPath, selectedProjectFilename) => new Promise (async (resolve, reject) => {
  try {
    const usfmData = await verifyIsValidUsfmFile(sourceProjectPath);
    const parsedUsfm = usfmHelpers.getParsedUSFM(usfmData);
    const manifest = await generateManifestForUsfm(parsedUsfm, sourceProjectPath, selectedProjectFilename);
    await moveUsfmFileFromSourceToImports(sourceProjectPath, manifest, selectedProjectFilename);
    await generateTargetLanguageBibleFromUsfm(parsedUsfm, manifest, selectedProjectFilename);
    resolve();
  } catch (error) {
    reject(error);
  }
});

export const verifyIsValidUsfmFile = (sourceProjectPath) => new Promise ((resolve, reject) => {
  const usfmData = usfmHelpers.loadUSFMFile(path.join(sourceProjectPath));

  if (usfmData.includes('\\h ') || usfmData.includes('\\id ')) { // moved verse checking to generateTargetLanguageBibleFromUsfm
    resolve(usfmData);
  } else {
    reject(
      <div>
          The project you selected ({sourceProjectPath}) is an invalid usfm project. <br/>
          Please verify the project you selected is a valid usfm file.
      </div>
    );
  }
});

/**
 * generate manifest from USFM data
 * @param {Object} parsedUsfm - The object containing usfm parsed by chapters
 * @param {string} sourceProjectPath
 * @param {string} selectedProjectFilename
 * @return {Promise<any>}
 */
export const generateManifestForUsfm = (parsedUsfm, sourceProjectPath, selectedProjectFilename) => new Promise ((resolve, reject) => {
  try {
    const manifest = manifestHelpers.generateManifestForUsfmProject(parsedUsfm);
    const manifestPath = path.join(IMPORTS_PATH, selectedProjectFilename, 'manifest.json');
    fs.outputJsonSync(manifestPath, manifest, { spaces: 2 });
    resolve(manifest);
  } catch (error) {
    console.log(error);
    reject(
      <div>
          Something went wrong when generating a manifest for ({sourceProjectPath}).
      </div>
    );
  }
});

export const moveUsfmFileFromSourceToImports = (sourceProjectPath, manifest, selectedProjectFilename) => new Promise ((resolve, reject) => {
  try {
    const usfmData = fs.readFileSync(sourceProjectPath);
    const projectId = manifest && manifest.project && manifest.project.id ? manifest.project.id : undefined;
    const usfmFilename = projectId ? projectId + '.usfm' : selectedProjectFilename + '.usfm';
    const newUsfmProjectImportsPath = path.join(IMPORTS_PATH, selectedProjectFilename, usfmFilename);
    fs.outputFileSync(newUsfmProjectImportsPath, usfmData);
    resolve();
  } catch (error) {
    console.log(error);
    reject(
      <div>
        {
          sourceProjectPath ?
            `Something went wrong when importing (${sourceProjectPath}).`
            :
            `Something went wrong when importing your project.`
        }
      </div>
    );
  }
});

/**
 * get the original language chapter resources for project book
 * @param {string} projectBibleID
 * @param {string} chapter
 * @return {Object} resources for chapter
 */
export const getOriginalLanguageChapterResources = function (projectBibleID, chapter) {
  const { languageId, bibleId } = BibleHelpers.getOrigLangforBook(projectBibleID);
  return ResourcesActions.loadChapterResource(bibleId, projectBibleID, languageId, chapter);
};

/**
 * remove single trailing newline from end of string
 * @param text
 */
const trimNewLine = function (text) {
  if (text && text.length) {
    let lastChar = text.substr(-1);

    if (lastChar === '\n') {
      text = text.substr(0, text.length - 1);
    }
  }
  return text;
};

/**
 * generate the target language bible from parsed USFM and manifest data
 * @param {Object} parsedUsfm - The object containing usfm parsed by chapters
 * @param {Object} manifest
 * @param {String} selectedProjectFilename
 * @return {Promise<any>}
 */
export const generateTargetLanguageBibleFromUsfm = (parsedUsfm, manifest, selectedProjectFilename) => new Promise ((resolve, reject) => {
  try {
    const chaptersObject = parsedUsfm.chapters;
    const bibleDataFolderName = manifest.project.id || selectedProjectFilename;
    let verseFound = false;

    Object.keys(chaptersObject).forEach((chapter) => {
      let chapterAlignments = {};
      const bibleChapter = {};
      const verses = Object.keys(chaptersObject[chapter]);

      // check if chapter has alignment data
      const alignmentIndex = verses.findIndex(verse => {
        const verseParts = chaptersObject[chapter][verse];
        let alignmentData = false;

        for (let part of verseParts.verseObjects) {
          if (part.type === 'milestone') {
            alignmentData = true;
            break;
          }
        }
        return alignmentData;
      });
      const alignmentData = (alignmentIndex >= 0);
      let bibleData;

      if (alignmentData) {
        bibleData = getOriginalLanguageChapterResources(bibleDataFolderName, chapter, bibleData);
      }

      verses.forEach((verse) => {
        const verseParts = chaptersObject[chapter][verse];
        let verseText;

        if (alignmentData) {
          verseText = getUsfmForVerseContent(verseParts);
        } else {
          verseText = convertVerseDataToUSFM(verseParts);
        }
        bibleChapter[verse] = trimNewLine(verseText);

        if (alignmentData && bibleData && bibleData[chapter]) {
          const bibleVerse = bibleData[chapter][verse];
          const object = wordaligner.unmerge(verseParts, bibleVerse);

          chapterAlignments[verse] = {
            alignments: object.alignment,
            wordBank: object.wordBank,
          };
        }
        verseFound = true;
      });

      const filename = parseInt(chapter, 10) + '.json';
      const projectBibleDataPath = path.join(IMPORTS_PATH, selectedProjectFilename, bibleDataFolderName, filename);
      fs.outputJsonSync(projectBibleDataPath, bibleChapter, { spaces: 2 });

      if (alignmentData) {
        const alignmentDataPath = path.join(IMPORTS_PATH, selectedProjectFilename, '.apps', 'translationCore', 'alignmentData', bibleDataFolderName, filename);
        fs.outputJsonSync(alignmentDataPath, chapterAlignments, { spaces: 2 });
      }
    });

    const projectBibleDataPath = path.join(IMPORTS_PATH, selectedProjectFilename, bibleDataFolderName, 'headers.json');
    fs.outputJsonSync(projectBibleDataPath, parsedUsfm.headers, { spaces: 2 });

    if (!verseFound) {
      reject(
        <div>
          {
            selectedProjectFilename ?
              `No chapter & verse found in project (${selectedProjectFilename}).`
              :
              `No chapter & verse found in your project.`
          }
        </div>
      );
      return;
    }

    // generating and saving manifest for target language for scripture pane to use as reference
    const targetLanguageManifest = {
      language_id: manifest.target_language.id || '',
      language_name: manifest.target_language.name || '',
      direction: manifest.target_language.direction || '',
      subject: 'Bible',
      resource_id: TARGET_LANGUAGE,
      resource_title: '',
      description: 'Target Language',
    };
    const projectBibleDataManifestPath = path.join(IMPORTS_PATH, selectedProjectFilename, bibleDataFolderName, 'manifest.json');
    fs.outputJsonSync(projectBibleDataManifestPath, targetLanguageManifest, { spaces: 2 });
    resolve();
  } catch (error) {
    console.log(error);
    reject(error);
  }
});

/**
 * dive down into milestone to extract words and text
 * @param {Object} verseObject - milestone to parse
 * @return {string} text content of milestone
 */
const parseMilestone = verseObject => {
  let text = verseObject.text || '';
  let wordSpacing = '';
  const length = verseObject.children ? verseObject.children.length : 0;

  for (let i = 0; i < length; i++) {
    let child = verseObject.children[i];

    switch (child.type) {
    case 'word':
      text += wordSpacing + child.text;
      wordSpacing = ' ';
      break;

    case 'milestone':
      text += wordSpacing + parseMilestone(child);
      wordSpacing = ' ';
      break;

    default:
      if (child.text) {
        text += child.text;
        const lastChar = text.substr(-1);

        if ((lastChar !== ',') && (lastChar !== '.') && (lastChar !== '?') && (lastChar !== ';')) { // legacy support, make sure padding before word
          wordSpacing = '';
        }
      }
      break;
    }
  }
  return text;
};

/**
 * get text from word and milestone markers
 * @param {Object} verseObject - to parse
 * @param {String} wordSpacing - spacing to use before next word
 * @return {*} new verseObject and word spacing
 */
const replaceWordsAndMilestones = (verseObject, wordSpacing) => {
  let text = '';

  if (verseObject.type === 'word') {
    text = wordSpacing + verseObject.text;
  } else if (verseObject.type === 'milestone') {
    text = wordSpacing + parseMilestone(verseObject);
  }

  if (text) { // replace with text object
    verseObject = {
      type: 'text',
      text,
    };
    wordSpacing = ' ';
  } else {
    wordSpacing = ' ';

    if (verseObject.nextChar) {
      wordSpacing = ''; // no need for spacing before next word if this item has it
    } else if (verseObject.text) {
      const lastChar = verseObject.text.substr(-1);

      if (![',', '.', '?', ';'].includes(lastChar)) { // legacy support, make sure padding before next word if punctuation
        wordSpacing = '';
      }
    }

    if (verseObject.children) { // handle nested
      const verseObject_ = _.cloneDeep(verseObject);
      let wordSpacing_ = '';
      const length = verseObject.children.length;

      for (let i = 0; i < length; i++) {
        const flattened =
          replaceWordsAndMilestones(verseObject.children[i], wordSpacing_);
        wordSpacing_ = flattened.wordSpacing;
        verseObject_.children[i] = flattened.verseObject;
      }
      verseObject = verseObject_;
    }
  }
  return { verseObject, wordSpacing };
};

/**
 * check if string has alignment markers
 * @param {String} usfmData
 * @return {Boolean} true if string has alignment markers
 */
export const hasAlignments = usfmData => {
  const hasAlignment = usfmData.includes('\\zaln-s') || usfmData.includes('\\w');
  return hasAlignment;
};

/**
 * @description verseObjects with occurrences via string
 * @param {String} usfmData - The string to search in
 * @return {String} - cleaned USFM
 */
export const cleanAlignmentMarkersFromString = usfmData => {
  if (hasAlignments(usfmData)) {
    // convert string using usfm to JSON
    const verseObjects = usfmjs.toJSON('\\v 1 ' + usfmData, { chunk: true }).verses['1'];
    return getUsfmForVerseContent(verseObjects);
  }
  return usfmData;
};

/**
 * converts verse from verse objects to USFM string
 * @param verseData
 * @return {string}
 */
function convertVerseDataToUSFM(verseData) {
  const outputData = {
    'chapters': {},
    'headers': [],
    'verses': { '1': verseData },
  };
  const USFM = usfmjs.toUSFM(outputData, { chunk: true });
  const split = USFM.split('\\v 1');

  if (split.length > 1) {
    let content = split[1];

    if (content.substr(0, 1) === ' ') { // remove space separator
      content = content.substr(1);
    }
    return content;
  }
  return ''; // error on JSON to USFM
}

/**
 * @description convert verse from verse objects to USFM string, removing milestones and word markers
 * @param {Object|Array} verseData
 * @return {String}
 */
export const getUsfmForVerseContent = (verseData) => {
  if (verseData.verseObjects) {
    let wordSpacing = '';
    const flattenedData = [];
    const length = verseData.verseObjects.length;

    for (let i = 0; i < length; i++) {
      const verseObject = verseData.verseObjects[i];
      const flattened = replaceWordsAndMilestones(verseObject, wordSpacing);
      wordSpacing = flattened.wordSpacing;
      flattenedData.push(flattened.verseObject);
    }
    verseData = { // use flattened data
      verseObjects: flattenedData,
    };
  }
  return convertVerseDataToUSFM(verseData);
};
