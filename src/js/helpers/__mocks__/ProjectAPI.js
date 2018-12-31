export const mockGetCategoriesDir = jest.fn();
export const mockIsCategoryLoaded = jest.fn();
export const mockSetCategoryLoaded = jest.fn();
export const mockImportCategoryGroupData = jest.fn();
export const mockGetBookId = jest.fn();
export const mockGetSelectedCategories = jest.fn();

const mock = jest.fn().mockImplementation(() => {
  return {
    getCategoriesDir: mockGetCategoriesDir,
    isCategoryLoaded: mockIsCategoryLoaded,
    setCategoryLoaded: mockSetCategoryLoaded,
    importCategoryGroupData: mockImportCategoryGroupData,
    getBookId: mockGetBookId,
    getSelectedCategories: mockGetSelectedCategories,
  };
});

export default mock;
