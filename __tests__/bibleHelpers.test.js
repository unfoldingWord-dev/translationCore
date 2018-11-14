import * as bibleHelpers from '../src/js/helpers/bibleHelpers';

describe('test isOldTestament(), isNewTestament() and getOLforBook()', () => {
  test('jon should be OT', () => {
    // given
    const bookID = 'jon';
    const expectOT = true;
    const expectNT = false;
    const expectLanguageId = 'hbo';
    const expectBibleId = 'uhb';

    // when
    const resultsOT = bibleHelpers.isOldTestament(bookID);
    const resultsNT = bibleHelpers.isNewTestament(bookID);
    const {languageId, bibleId} = bibleHelpers.getOLforBook(bookID);

    // then
    expect(resultsOT).toEqual(expectOT);
    expect(resultsNT).toEqual(expectNT);
    expect(languageId).toEqual(expectLanguageId);
    expect(bibleId).toEqual(expectBibleId);
  });

  test('jas should be NT', () => {
    // given
    const bookID = 'jas';
    const expectOT = false;
    const expectNT = true;
    const expectLanguageId = 'grc';
    const expectBibleId = 'ugnt';

    // when
    const resultsOT = bibleHelpers.isOldTestament(bookID);
    const resultsNT = bibleHelpers.isNewTestament(bookID);
    const {languageId, bibleId} = bibleHelpers.getOLforBook(bookID);

    // then
    expect(resultsOT).toEqual(expectOT);
    expect(resultsNT).toEqual(expectNT);
    expect(languageId).toEqual(expectLanguageId);
    expect(bibleId).toEqual(expectBibleId);
  });

  test('zzz should be neither', () => {
    // given
    const bookID = 'zzz';
    const expectOT = false;
    const expectNT = false;
    const expectLanguageId = 'grc';
    const expectBibleId = 'ugnt';

    // when
    const resultsOT = bibleHelpers.isOldTestament(bookID);
    const resultsNT = bibleHelpers.isNewTestament(bookID);
    const {languageId, bibleId} = bibleHelpers.getOLforBook(bookID);

    // then
    expect(resultsOT).toEqual(expectOT);
    expect(resultsNT).toEqual(expectNT);
    expect(languageId).toEqual(expectLanguageId);
    expect(bibleId).toEqual(expectBibleId);
  });
});
