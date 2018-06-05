import consts from '../actions/ActionTypes';

const InitialState = {
  bookId: '',
  resourceId: '',
  nickname: '',
  languageId: '',
  languageName: '',
  languageDirection: '',
  contributors: [],
  checkers: [],
  alreadyImported: false
};

const projectInformationCheckReducer = (state = InitialState, action) => {
  switch (action.type) {
    case consts.SET_BOOK_ID_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        bookId: action.bookId
      };
    case consts.SET_RESOURCE_ID_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        resourceId: action.resourceId
      };
    case consts.SET_NICKNAME_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        nickname: action.nickname
      };
    case consts.SET_LANGUAGE_ID_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        languageId: action.languageId
      };
    case consts.SET_LANGUAGE_NAME_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        languageName: action.languageName
      };
    case consts.SET_LANGUAGE_DIRECTION_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        languageDirection: action.languageDirection
      };
    case consts.SET_ALL_LANGUAGE_INFO_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        languageId: action.languageId,
        languageName: action.languageName,
        languageDirection: action.languageDirection
      };
    case consts.SET_CONTRIBUTORS_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        contributors: action.contributors
      };
    case consts.SET_CHECKERS_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        checkers: action.checkers
      };
    case consts.SET_ALREADY_IMPORTED_IN_PROJECT_INFORMATION_REDUCER:
      return {
        ...state,
        alreadyImported: action.alreadyImported
      };
    case consts.CLEAR_PROJECT_INFORMATION_REDUCER:
      return InitialState;
    default:
      return state;
  }
};

export default projectInformationCheckReducer;
