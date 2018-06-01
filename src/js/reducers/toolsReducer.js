import types from '../actions/ActionTypes';

const initialState = {
  currentToolViews: {},
  currentToolName: null,
  currentToolTitle: null,
  toolsMetadata: [],
  apis: {}
};

const toolsReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SAVE_TOOL_VIEW:
      return {
        ...state,
        currentToolViews: {
          ...state.currentToolViews,
          [action.identifier]: action.module
        }
      };
    case types.SET_CURRENT_TOOL_NAME:
      return {
        ...state,
        currentToolName: action.currentToolName
      };
    case types.SET_CURRENT_TOOL_TITLE:
      return {
        ...state,
        currentToolTitle: action.currentToolTitle
      };
    case types.ADD_TOOL_API:
      return {
        ...state,
        apis: {
          ...state.apis,
          [action.name]: action.api
        }
      };
    case types.SET_TOOLS_METADATA:
      return {
        ...state,
        toolsMetadata: action.val
      };
    case types.CLEAR_CURRENT_TOOL_DATA:
      return {
        ...state,
        currentToolViews: initialState.currentToolViews,
        currentToolName: initialState.currentToolName,
        currentToolTitle: initialState.currentToolTitle,
        apis: initialState.apis
      };
    default:
      return state;
  }
};

export default toolsReducer;

/**
 * Returns the name of the currently selected tool
 * @param state
 * @return {string | undefined}
 */
export const getCurrentName = (state) => {
  if (state && state.currentToolName) {
    return state.currentToolName;
  } else {
    return undefined;
  }
};

/**
 * Returns the react component of the currently selected tool
 * @param state
 * @return {*}
 */
export const getCurrentContainer = state => {
  debugger;
  const name = getCurrentName(state);
  if (name && name in state.currentToolViews) {
    return state.currentToolViews[name];
  }
  return null;
};

/**
 * Returns the api of the currently selected tool
 * @param state
 * @return {ApiController}
 */
export const getCurrentApi = state => {
  const name = getCurrentName(state);
  if (name && name in state.apis) {
    return state.apis[name];
  }
  return null;
};

/**
 * Returns a dictionary of tool apis that support the currently selected tool.
 * These are tools that might in the future be labeled as dependencies, but for
 * now we're including all tool api's other than the currently selected one.
 * @param state
 * @return {ApiController[]}
 */
export const getSupportingToolApis = state => {
  const name = getCurrentName(state);
  const supportingApis = {...state.apis};
  delete supportingApis[name];
  return supportingApis;
};

/**
 * Returns an array of metadata for the tools
 * @param state
 * @return {object[]}
 */
export const getToolsMeta = state => {
  return state.toolsMetadata;
};
