// for performance testing
import fs from 'fs-extra';
import path from 'path-extra';
import usfm from 'usfm-js';
import { performance } from 'perf_hooks';
// helpers
import * as UsfmHelpers from '../src/js/helpers/usfmHelpers';
import * as UsfmFileConversionHelpers from '../src/js/helpers/FileConversionHelpers/UsfmFileConversionHelpers';
import { getUsfmForVerseContent } from '../src/js/helpers/FileConversionHelpers/UsfmFileConversionHelpers';
// constants
import { IMPORTS_PATH } from '../src/js/common/constants';
jest.unmock('fs-extra');
const usfmFilePath = path.join(__dirname, 'fixtures/usfm3', '41-MAT-aligned.usfm');

const validUsfmString = `
\\id TIT N/A cdh_Chambeali_ltr Mon Sep 11 2017 16:44:56 GMT-0700 (PDT) tc
\\h Titus
\\mt Titus
\\s5
\\c 1
\\p
\\v 1 तिन्हा जो तांई चुणेया जे से बेकसुर हो। अत्ते इक ई लाड़ी वाळे होणे चहिंदे। तिन्हेरे बच्चे विस्वासी होणे चहिंदे अत्ते बेलगाम अत्ते बागी ना हो।
\\v 2 किजो कि धार्मिक गल्लां सिखाणे वाळे परमेश्वर रा कम्म करणे तांई बेकसुर होणा चहिंदा; से ना ता जिद्दी, चिड़चिड़ा, अत्ते ना शराब पीणे वाळा हो, ना मार-कुटाई करणे वाळा, अत्ते ना ई गलत कम्मां री कमाई रा लालची हो,
\\v 3 अपण परोणे री इज्जत सत्कार करणे वाळा हो, भलाई चाह्णे वाळा हो, समझदार, सही-गलत री समझ हो, भक्त अत्ते अपणे पर तिस जो काबू हो।
\\v 4 से उस विस्वास करणे लायक वचन पर मजबूत रेह् जिसेरी उस जो सिक्सा मिल्ले री है, ताकि से विरोध करणे वाळेयां रा मूंह् बंद करी सके।
\\v 5 एह् इधेरे तांई जरूरी है किजोकि बड़े मह्णु खिलाफ होई करी बेकार री गल्लां बणाई करी दूज्जेयां जो भटकाई दिंदे। मैं खास कर तिन्हा जो बोलेया करदा है जिन्हेरा खतना होई गेरा है।
\\v 6 तिन्हेरा मूंह् ता बंद ई कित्तेया जाणा चहिंदा। किजो कि जे गल्लां नी सिखाणे वाळी हिन् , तिन्हा जो सिखाई करी घर रे घर तोड़ी दिंदे, किजो कि से गलत रस्तेयां पर चली करी पैसे कमाणे तांई इदेया करदे हिन्।
\\v 7 इक क्रेते रे रेह्णे वाळे ने अपणे मह्णुआं रे बारे खुद बोलेया, “क्रेते रे मह्णु हमेसा झूठ बोलदे, से जंगली जानवर हिन, आलसी ते भूखान्ग हिन्।”
\\v 8 एह् गल्ल सच्च है, इधेरे तांई तिन्हा जो खरा करी समझा ताकि तिन्हेरा विस्वास पक्का होई जाये।
\\v 9 अत्ते से यहूदियां री पुराणी कहाणियां पर अत्ते उन्हा मह्णुआं रे हुक्मां पर, जे सच्चाई का भटकी गेरे हिन, कोई ध्यान मत दो।
\\v 10 सुच्चे मह्णुआं तांई सब चीजा सुच्ची हिन् , अपण भिट्ठा अत्ते जिन्हा बिच विस्वास नी है, उन्हा तांई किच्छ बी सुच्चा नी है, बल्कि उन्हेरी अक्कल अत्ते सही-गलत री समझ दोनो भिट्ठी हिन्।
\\v 11 से परमेश्वर जो जानणे रा दावा करदे। अपण तिन्हेरे कम्म दिखांदे कि से तिस जो जाणदे ई नी। से नफरत करणे अत्ते हुक्मां जो तोड़ने वाळे हिन् अत्ते कुसी बी खरे कम्म करणे रे लायक नी हिन्।
\\v 12 अपण तू इदेह्ई गल्लां बोल्लेया कर जेह्ड़ी खरी सिक्सा जोग्गी होन्।
\\v 13 मतलब कि बुड्ड़े मह्णु सचेत ते गम्भीर ते सबर वाळे होन, ते तिन्हेरा भरोस्सा ते प्यार ते सबर पक्का हो।
\\v 14 इह्याँ ई बुह्ड्ड़ी जनानियाँ रा चाल-चलन खरे मह्णुआं साह्ई हो; से इल्जाम लाणे वाळी ते पियक्कड़ नां होन, अपण खरी गल्लां सखाणे वाळी होन।
\\v 15 ताकि से जुआन जनानियाँ जो सचेत करदी रैह्न कि अपणे लाड़े ते निके-निकेयाँ कने प्यार रखन;
\\v 16 ते सबर वाळी, पतिवरता, ते घरे रा कमकाज करणे वाळी, भली, ते अपणे-अपणे लाड़े रे अधीन रैह्णे वाळियाँ होन, ताकि परमेश्वर रे वचन री नीन्दा नां हो।
\\c 2
\\p
`;

describe.skip('UsfmFileConversionHelpers2', () => {

  describe('generateTargetLanguageBibleFromUsfm()', () => {
    const count = 2;
    let asyncSum = 0;
    let syncSum = 0;

    beforeEach(() => {
      const projectFilename = 'project_folder_name';
      const projectImportsPath = path.join(IMPORTS_PATH, projectFilename);
      fs.removeSync(projectImportsPath);
    });

    for (let i = 0; i < count; i++) {
      test('valid USFM should succeed SYNC ' + i, async () => {
        // given
        let mockManifest = {
          project: { id: 'mat' },
          target_language: { id: 'en' },
        };
        const validUsfmString = fs.readFileSync(usfmFilePath, 'utf8');
        const parsedUsfm = UsfmHelpers.getParsedUSFM(validUsfmString);
        const projectFilename = 'project_folder_name';
        const projectImportsPath = path.join(IMPORTS_PATH, projectFilename);
        const newUsfmProjectImportsPath = path.join(projectImportsPath, mockManifest.project.id);
        const start = performance.now();

        //when
        await UsfmFileConversionHelpers.generateTargetLanguageBibleFromUsfmBlocking(parsedUsfm, mockManifest, projectFilename);

        //then
        const end = performance.now();
        const elapsed = end - start;
        syncSum += elapsed;
        console.log(`Took ${elapsed}ms`);
        expect(fs.existsSync(newUsfmProjectImportsPath)).toBeTruthy();

        const chapter1_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, '1.json'));
        expect(Object.keys(chapter1_data).length - 1).toEqual(25);

        const chapter28_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, '28.json'));
        expect(Object.keys(chapter28_data).length - 1).toEqual(20);

        // verify header info is preserved
        const header_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, 'headers.json'));
        validateUsfmTag(header_data, 'id', validUsfmString);
        validateUsfmTag(header_data, 'h', validUsfmString);
        validateUsfmTag(header_data, 'mt', validUsfmString);
        validateUsfmTag(header_data, 's5', validUsfmString);
      });

      test('valid USFM should succeed ASYNC ' + i, async () => {
        // given
        let mockManifest = {
          project: { id: 'mat' },
          target_language: { id: 'en' },
        };
        const validUsfmString = fs.readFileSync(usfmFilePath, 'utf8');
        const parsedUsfm = UsfmHelpers.getParsedUSFM(validUsfmString);
        const projectFilename = 'project_folder_name';
        const projectImportsPath = path.join(IMPORTS_PATH, projectFilename);
        const newUsfmProjectImportsPath = path.join(projectImportsPath, mockManifest.project.id);
        const start = performance.now();

        //when
        await UsfmFileConversionHelpers.generateTargetLanguageBibleFromUsfm(parsedUsfm, mockManifest, projectFilename);

        //then
        const end = performance.now();
        const elapsed = end - start;
        asyncSum += elapsed;
        console.log(`Took ${elapsed}ms`);
        expect(fs.existsSync(newUsfmProjectImportsPath)).toBeTruthy();

        const chapter1_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, '1.json'));
        expect(Object.keys(chapter1_data).length - 1).toEqual(25);

        const chapter28_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, '28.json'));
        expect(Object.keys(chapter28_data).length - 1).toEqual(20);

        // verify header info is preserved
        const header_data = fs.readJSONSync(path.join(newUsfmProjectImportsPath, 'headers.json'));
        validateUsfmTag(header_data, 'id', validUsfmString);
        validateUsfmTag(header_data, 'h', validUsfmString);
        validateUsfmTag(header_data, 'mt', validUsfmString);
        validateUsfmTag(header_data, 's5', validUsfmString);
      });

    }

    test('summary', () => {
      const aveSyncTime = syncSum/count;
      console.log(`Average SYNC time is ${aveSyncTime}ms`);
      const aveAsyncTime = asyncSum/count;
      console.log(`Average ASYNC time is ${aveAsyncTime}ms`);
      const diff = (1 - aveAsyncTime/aveSyncTime) * 100;
      console.log(`Delta is ${diff}%`);
    });

  });

});

//
// helpers
//

function wrapWithUSFM(text, splitAt, beginMarker, endMarker) {
  const parts = text.split(splitAt);
  const wrapped = beginMarker + parts.join(endMarker + splitAt + beginMarker) + endMarker;
  return wrapped;
}

function validateUsfmTag(header_data, tag, usfmString) {
  const data = UsfmHelpers.getHeaderTag(header_data, tag);
  let match = '\\' + tag;

  if (data) {
    match += ' ' + data;
  }

  usfmString = usfmString || validUsfmString;
  const index = usfmString.indexOf(match);
  const found = (index >= 0);
  if (!found) {
    console.log(`Validating tag ${tag}, looking for \n${match}`);
  }
  expect(found).toBeTruthy();
}

export const getUsfmFromJson = (verseData) => {
  const outputData = {
    'chapters': {},
    'headers': [],
    'verses': { '1': verseData },
  };
  const USFM = usfm.toUSFM(outputData, { chunk: true });
  let split = USFM.split('\\v 1 ');

  if (split.length <= 1) {
    split = USFM.split('\\v 1');
  }
  return split.length > 1 ? split[1] : '';
};
