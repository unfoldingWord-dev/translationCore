/* istanbul lignore next */
const ActionTypes = {
  CHANGE_ONLINE_STATUS: 'CHANGE_ONLINE_STATUS',
  SHOW_MODAL_CONTAINER: 'SHOW_MODAL_CONTAINER',
  SELECT_MODAL_TAB: 'SELECT_MODAL_TAB',
  LOGOUT_USER: 'LOGOUT_USER',
  LOGIN_USER: 'LOGIN_USER',
  GET_RECENT_PROJECTS: 'GET_RECENT_PROJECTS',
  RECIEVE_REPOS: 'RECIEVE_REPOS',
  IMPORT_LINK: 'IMPORT_LINK',
  SELECT_MODAL_SECTION: 'SELECT_MODAL_SECTION',
  SHOW_POPOVER: 'SHOW_POPOVER',
  CLOSE_POPOVER: 'CLOSE_POPOVER',
  // Resources Actions
  ADD_NEW_BIBLE_TO_RESOURCES: 'ADD_NEW_BIBLE_TO_RESOURCES',
  ADD_TRANSLATIONHELPS_ARTICLE: 'ADD_TRANSLATIONHELPS_ARTICLE',
  ADD_LEXICON_ENTRY: 'ADD_LEXICON_ENTRY',
  // Other actions that need organized
  SET_SAVE_PATH_LOCATION: 'SET_SAVE_PATH_LOCATION',
  STORE_MANIFEST: 'STORE_MANIFEST',
  STORE_PROJECT_SETTINGS: 'STORE_PROJECT_SETTINGS',
  STORE_SAVE_LOCATION: 'STORE_SAVE_LOCATION',
  UPDATE_TARGET_VERSE: 'UPDATE_TARGET_VERSE',
  SHOW_LOADING_CIRCLE: 'SHOW_LOADING_CIRCLE',
  HIDE_LOADING_CIRCLE: 'HIDE_LOADING_CIRCLE',
  GOGS_SERVER_ERROR: 'GOGS_SERVER_ERROR',
  OPEN_ALERT_DIALOG: 'OPEN_ALERT_DIALOG',
  OPEN_OPTION_DIALOG: 'OPEN_OPTION_DIALOG',
  CLOSE_ALERT_DIALOG: 'CLOSE_ALERT_DIALOG',
  LOGIN_LOCAL_USER: 'LOGIN_LOCAL_USER',
  RESET_PROJECT_DETAIL: 'RESET_PROJECT_DETAIL',
  CLEAR_RESOURCES_REDUCER: 'CLEAR_RESOURCES_REDUCER',
  UPDATE_ONLINE_MODE: 'UPDATE_ONLINE_MODE',
  // Online import actions
  SET_REPOS_DATA: 'SET_REPOS_DATA',
  // project actions
  SET_PROJECT_PROGRESS_FOR_TOOL: 'SET_PROJECT_PROGRESS_FOR_TOOL',
  SET_GL_FOR_TOOL: 'SET_GL_FOR_TOOL',
  // Home
  RESET_HOME_SCREEN: 'RESET_HOME_SCREEN',
  TOGGLE_HOME_VIEW: 'TOGGLE_HOME_VIEW',
  TOGGLE_WELCOME_SPLASH: 'TOGGLE_WELCOME_SPLASH',
  GO_TO_STEP: 'GO_TO_STEP',
  OPEN_PROJECTS_FAB: 'OPEN_PROJECTS_FAB',
  CLOSE_PROJECTS_FAB: 'CLOSE_PROJECTS_FAB',
  GET_MY_PROJECTS: 'GET_MY_PROJECTS',
  ARCHIVE_PROJECT: 'ARCHIVE_PROJECT',
  OPEN_ONLINE_IMPORT_MODAL: 'OPEN_ONLINE_IMPORT_MODAL',
  CLOSE_ONLINE_IMPORT_MODAL: 'CLOSE_ONLINE_IMPORT_MODAL',
  OPEN_LICENSE_MODAL: 'OPEN_LICENSE_MODAL',
  CLOSE_LICENSE_MODAL: 'CLOSE_LICENSE_MODAL',
  RESET_IMPORT_ONLINE_REDUCER: 'RESET_IMPORT_ONLINE_REDUCER',
  SHOW_DIMMED_SCREEN: 'SHOW_DIMMED_SCREEN',
  ERROR_FEEDBACK_MESSAGE: 'ERROR_FEEDBACK_MESSAGE',
  ERROR_FEEDBACK_DETAILS: 'ERROR_FEEDBACK_DETAILS',
  ERROR_FEEDBACK_CATEGORY: 'ERROR_FEEDBACK_CATEGORY',
  FEEDBACK_CALLBACK_ON_CLOSE: 'FEEDBACK_CALLBACK_ON_CLOSE',
  //Project Validation
  RESET_PROJECT_VALIDATION_REDUCER: 'RESET_PROJECT_VALIDATION_REDUCER',
  ONLY_SHOW_PROJECT_INFORMATION_SCREEN: 'ONLY_SHOW_PROJECT_INFORMATION_SCREEN',
  SHOW_OVERWRITE_BUTTON: 'SHOW_OVERWRITE_BUTTON',
  TOGGLE_PROJECT_VALIDATION_STEPPER: 'TOGGLE_PROJECT_VALIDATION_STEPPER',
  GO_TO_PROJECT_VALIDATION_STEP: 'GO_TO_PROJECT_VALIDATION_STEP',
  UPDATE_PROJECT_VALIDATION_NEXT_BUTTON_STATUS: 'UPDATE_PROJECT_VALIDATION_NEXT_BUTTON_STATUS',
  MISSING_VERSES_CHECK: 'MISSING_VERSES_CHECK',
  ADD_PROJECT_VALIDATION_STEP: 'ADD_PROJECT_VALIDATION_STEP',
  REMOVE_PROJECT_VALIDATION_STEP: 'REMOVE_PROJECT_VALIDATION_STEP',
  // project Details reducer
  SET_CHECK_CATEGORIES: 'SET_CHECK_CATEGORIES',
  UPDATE_SELECTED_PROJECT_FILENAME: 'UPDATE_SELECTED_PROJECT_FILENAME',
  UPDATE_SOURCE_PROJECT_PATH: 'UPDATE_SOURCE_PROJECT_PATH',
  SAVE_BOOK_ID_AND_BOOK_NAME_IN_MANIFEST: 'SAVE_BOOK_ID_AND_BOOK_NAME_IN_MANIFEST',
  SAVE_RESOURCE_ID_IN_MANIFEST: 'SAVE_RESOURCE_ID_IN_MANIFEST',
  SAVE_NICKNAME_IN_MANIFEST: 'SAVE_NICKNAME_IN_MANIFEST',
  SAVE_LANGUAGE_DETAILS_IN_MANIFEST: 'SAVE_LANGUAGE_DETAILS_IN_MANIFEST',
  SAVE_TRANSLATORS_LIST_IN_MANIFEST: 'SAVE_TRANSLATORS_LIST_IN_MANIFEST',
  SAVE_CHECKERS_LIST_IN_MANIFEST: 'SAVE_CHECKERS_LIST_IN_MANIFEST',
  ADD_MANIFEST_PROPERTY: 'ADD_MANIFEST_PROPERTY',
  ADD_PROJECT_SETTINGS_PROPERTY: 'ADD_PROJECT_SETTINGS_PROPERTY',
  SET_PROJECT_TYPE: 'SET_PROJECT_TYPE',
  OLD_SELECTED_PROJECT_FILENAME: 'OLD_SELECTED_PROJECT_FILENAME',
  // copy right check reducer
  SELECT_PROJECT_LICENSE_ID: 'SELECT_PROJECT_LICENSE_ID',
  LOAD_PROJECT_LICENSE_MARKDOWN: 'LOAD_PROJECT_LICENSE_MARKDOWN',
  CLEAR_COPYRIGHT_CHECK_REDUCER: 'CLEAR_COPYRIGHT_CHECK_REDUCER',
  // project information check reducer
  SET_BOOK_ID_IN_PROJECT_INFORMATION_REDUCER: 'SET_BOOK_ID_IN_PROJECT_INFORMATION_REDUCER',
  SET_RESOURCE_ID_IN_PROJECT_INFORMATION_REDUCER: 'SET_RESOURCE_ID_IN_PROJECT_INFORMATION_REDUCER',
  SET_NICKNAME_IN_PROJECT_INFORMATION_REDUCER: 'SET_NICKNAME_IN_PROJECT_INFORMATION_REDUCER',
  SET_LANGUAGE_ID_IN_PROJECT_INFORMATION_REDUCER: 'SET_LANGUAGE_ID_IN_PROJECT_INFORMATION_REDUCER',
  SET_LANGUAGE_NAME_IN_PROJECT_INFORMATION_REDUCER: 'SET_LANGUAGE_NAME_IN_PROJECT_INFORMATION_REDUCER',
  SET_LANGUAGE_DIRECTION_IN_PROJECT_INFORMATION_REDUCER: 'SET_LANGUAGE_DIRECTION_IN_PROJECT_INFORMATION_REDUCER',
  SET_ALL_LANGUAGE_INFO_IN_PROJECT_INFORMATION_REDUCER: 'SET_ALL_LANGUAGE_INFO_IN_PROJECT_INFORMATION_REDUCER',
  SET_CONTRIBUTORS_IN_PROJECT_INFORMATION_REDUCER: 'SET_CONTRIBUTORS_IN_PROJECT_INFORMATION_REDUCER',
  SET_CHECKERS_IN_PROJECT_INFORMATION_REDUCER: 'SET_CHECKERS_IN_PROJECT_INFORMATION_REDUCER',
  SET_ALREADY_IMPORTED_IN_PROJECT_INFORMATION_CHECK_REDUCER: 'SET_ALREADY_IMPORTED_IN_PROJECT_INFORMATION_CHECK_REDUCER',
  SET_USFM_PROJECT_IN_PROJECT_INFORMATION_CHECK_REDUCER: 'SET_USFM_PROJECT_IN_PROJECT_INFORMATION_CHECK_REDUCER',
  SET_LOCAL_IMPORT_IN_PROJECT_INFORMATION_CHECK_REDUCER: 'SET_LOCAL_IMPORT_IN_PROJECT_INFORMATION_CHECK_REDUCER',
  SET_OVERWRITE_PERMITTED_IN_PROJECT_INFORMATION_CHECK_REDUCER: 'SET_OVERWRITE_PERMITTED_IN_PROJECT_INFORMATION_CHECK_REDUCER',
  SET_SKIP_PROJECT_NAME_CHECK_IN_PROJECT_INFORMATION_CHECK_REDUCER: 'SET_SKIP_PROJECT_NAME_CHECK_IN_PROJECT_INFORMATION_CHECK_REDUCER',
  SET_PROJECT_FONT_IN_PROJECT_INFORMATION_REDUCER: 'SET_PROJECT_FONT_IN_PROJECT_INFORMATION_REDUCER',
  CLEAR_PROJECT_INFORMATION_REDUCER: 'CLEAR_PROJECT_INFORMATION_REDUCER',
  // online mode reducer / actions
  RESET_ONLINE_MODE_WARNING_ALERT: 'RESET_ONLINE_MODE_WARNING_ALERT',
  //merge conflict
  CLEAR_MERGE_CONFLICTS_REDUCER: 'CLEAR_MERGE_CONFLICTS_REDUCER',
  MERGE_CONFLICTS_CHECK: 'MERGE_CONFLICTS_CHECK',
  //locale actions
  LOCALE_LOADED: 'LOCALE_LOADED',
  // settings actions
  SET_CSV_SAVE_LOCATION: 'SET_CSV_SAVE_LOCATION',
  SET_USFM_SAVE_LOCATION: 'SET_USFM_SAVE_LOCATION',
  UPDATE_TOOL_SETTINGS: 'UPDATE_TOOL_SETTINGS',
  SET_SETTING: 'SET_SETTING',
  TOGGLE_SETTING: 'TOGGLE_SETTING',
  ADD_TOOL: 'ADD_TOOL',
  OPEN_TOOL: 'OPEN_TOOL',
  CLOSE_TOOL: 'CLOSE_TOOL',
  // SOURCE CONTENT UPDATE
  NEW_LIST_OF_SOURCE_CONTENT_TO_UPDATE: 'NEW_LIST_OF_SOURCE_CONTENT_TO_UPDATE',
  RESET_LIST_OF_SOURCE_CONTENT_TO_UPDATE: 'RESET_LIST_OF_SOURCE_CONTENT_TO_UPDATE',
  INCREMENT_SOURCE_CONTENT_UPDATE_COUNT: 'INCREMENT_SOURCE_CONTENT_UPDATE_COUNT',
  OPEN_ALERT: 'OPEN_ALERT',
  CLOSE_ALERT: 'CLOSE_ALERT',
  IGNORE_ALERT: 'IGNORE_ALERT',
  OPEN_SOFTWARE_UPDATE: 'OPEN_SOFTWARE_UPDATE',
  CLOSE_SOFTWARE_UPDATE: 'CLOSE_SOFTWARE_UPDATE',
};

export default ActionTypes;
