/* eslint-env jest */
/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path-extra';
//helpers
import * as csvHelpers from '../src/js/helpers/csvHelpers';
import {USER_RESOURCES_PATH, WORD_ALIGNMENT, TRANSLATION_WORDS, TRANSLATION_NOTES } from "../src/js/common/constants";

const checksPerformedPath = path.join(__dirname, 'fixtures/project/csv/checks_performed/fr_eph_text_ulb');

const tWContextId = {
  reference: {
    bookId: "tit",
    chapter: 1,
    verse: 1
  },
  tool: TRANSLATION_WORDS,
  groupId: "apostle",
  quote: "apostle, apostles, apostleship",
  occurrence: 1
};
const tWotherContextId = {
  reference: {
    bookId: "tit",
    chapter: 1,
    verse: 1
  },
  tool: TRANSLATION_WORDS,
  groupId: "confidence",
  quote: "confidence, confident",
  occurrence: 1
};
const tNContextId = {
  information: undefined,
  reference: { bookId: "tit", chapter: 1, verse: 3 },
  tool: TRANSLATION_NOTES,
  groupId: "figs-metaphor",
  quote: "he revealed his word",
  occurrence: 1
};
const autographaContextId = {
  reference: { bookId: "tit", chapter: 1, verse: "1" },
  tool: "Autographa",
  groupId: "1"
};
const fixturesDir = path.join(__dirname, 'fixtures');
const resourcesDir = path.join(fixturesDir, 'resources');
const projectDir = path.join(fixturesDir, 'project');

beforeAll(() => {
  fs.__resetMockFS();
  fs.__loadDirIntoMockFs(resourcesDir, USER_RESOURCES_PATH);
  fs.__loadDirIntoMockFs(projectDir, projectDir);
});

describe('csvHelpers.flattenContextId', () => {
  test('should return a groupName for tW', () => {
    const _flatContextId = {
      bookId: "tit",
      chapter: 1,
      verse: 1,
      tool: TRANSLATION_WORDS,
      type: "kt",
      groupId: "apostle",
      groupName: "apostle, apostleship",
      quote: "apostle, apostles, apostleship",
      gatewayLanguageCode: "N/A",
      gatewayLanguageQuote: "N/A",
      occurrenceNote: "N/A",
      occurrence: 1
    };
    const translate = key => key.split('.')[1];
    const flatContextId = csvHelpers.flattenContextId(tWContextId, translate);
    expect(flatContextId).toEqual(_flatContextId);
  });
});

describe('csvHelpers.groupName', () => {
  test('should return a groupName for tW', () => {
    const groupName = csvHelpers.groupName(tWContextId);
    expect(groupName).toEqual('apostle, apostleship');
  });

  test('should return an `other` groupName for tW', () => {
    const groupName = csvHelpers.groupName(tWotherContextId);
    expect(groupName).toEqual('confidence, confident');
  });

  test('should return a groupName for tN', () => {
    const groupName = csvHelpers.groupName(tNContextId);
    expect(groupName).toEqual('Metaphor');
  });

  test('should return a groupId as groupName for Autographa', () => {
    const groupName = csvHelpers.groupName(autographaContextId);
    expect(groupName).toEqual('1');
  });
});

describe('csvHelpers.combineData', () => {
  test('should return the right response for combinedData', () => {
    const _combinedData = {
      enabled: true,
      bookId: "tit",
      chapter: 1,
      verse: 1,
      tool: TRANSLATION_WORDS,
      type: "kt",
      groupId: "apostle",
      groupName: "apostle, apostleship",
      quote: "apostle, apostles, apostleship",
      gatewayLanguageCode: "N/A",
      gatewayLanguageQuote: "N/A",
      occurrenceNote: "N/A",
      occurrence: 1,
      username: 'klappy'
      // date: '08/22/2017',
      // time: '22:33:45'
    };
    const data = {enabled: true};
    const translate = key => key.split('.')[1];
    const combinedData = csvHelpers.combineData(data, tWContextId, 'klappy', '2017-08-23T02:33:45.377Z', translate);
    // Due to timezone issues this is a pain to test.
    _combinedData.date = combinedData.date;
    _combinedData.time = combinedData.time;
    expect(combinedData).toEqual(_combinedData);
  });
});

describe('csvHelpers.getToolFolderNames', () => {
  test('should return tool folders', () => {
    const toolNames = csvHelpers.getToolFolderNames(checksPerformedPath);
    const _toolNames = [ TRANSLATION_NOTES, TRANSLATION_WORDS, WORD_ALIGNMENT ];
    expect(toolNames).toEqual(_toolNames);
  });
});

describe('csvHelpers.getProjectId', () => {
  test('should return a projectId', () => {
    const projectId = csvHelpers.getProjectId(checksPerformedPath);
    const _projectId = 'eph';
    expect(projectId).toEqual(_projectId);
  });
});

const data = [{a: 'a,a', b: 'b,b'}, {a: 1, b: 2}];
const expected = "a,b\n\"a,a\",\"b,b\"\n1,2\n";
const filePath = path.join(__dirname, 'output/test.csv');

test('generate csv string from array of objects with the same keys', () => {
    return csvHelpers.generateCSVString(data, (err, csvString) => {
        expect(csvString).toEqual(expected);
    });
});

test('generate csv file from array of objects with the same keys', () => {
    return csvHelpers.generateCSVFile(data, filePath).then(() => {
        const csvString = fs.readFileSync(filePath, 'utf8');
        expect(csvString).toEqual(expected);
        fs.removeSync(filePath);
    });
});
