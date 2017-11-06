/* eslint-disable no-console */
import consts from './ActionTypes';
import Gogs from '../components/login/GogsApi';
// actions
import * as AlertModalActions from './AlertModalActions';
import * as OnlineModeActions from './OnlineModeActions';
import * as ImportLocalActions from './ImportLocalActions';
// helpers
import * as loadOnline from '../helpers/LoadOnlineHelpers';

export function updateRepos() {
    return ((dispatch, getState) => {
        let user = getState().loginReducer.userdata;
        dispatch(OnlineModeActions.confirmOnlineAction(() => {
            if (user) {
                dispatch(clearLink());
                dispatch(
                    AlertModalActions.openAlertDialog("Retrieving list of projects...", true)
                );

                Gogs().listRepos(user).then((repos) => {
                    dispatch(AlertModalActions.closeAlertDialog());
                    dispatch({
                        type: consts.RECIEVE_REPOS,
                        repos: repos
                    });
                    dispatch({ type: consts.GOGS_SERVER_ERROR, err: null }); //Equivalent of saying "there is no error, successfull fetch"
                }).catch((e) => {
                    console.log(e);
                    dispatch(AlertModalActions.closeAlertDialog());
                    dispatch({
                        type: consts.GOGS_SERVER_ERROR,
                        err: e
                    });
                });
            }
        }));
    });
}

/**
 * @description handles the import results.  If errMessage is not null then displays the error message.  Otherwise
 *                  it verifies and selects the project.
 * @param {module} dispatch
 * @param {string} url - url of project imported
 * @param {string} savePath - destination folder for project
 * @param {string} errMessage - if not null, then error message returned from load
 */
function handleImportResults(dispatch, url, savePath, errMessage) {
  if (errMessage) {
    dispatch(AlertModalActions.openAlertDialog(errMessage));
    dispatch({type: "LOADED_ONLINE_FAILED"});
    dispatch({type: consts.RESET_IMPORT_ONLINE_REDUCER});
  } else {
    dispatch({type: consts.RESET_IMPORT_ONLINE_REDUCER});
    dispatch(clearLink());
    dispatch(AlertModalActions.closeAlertDialog());
    dispatch(ImportLocalActions.verifyAndSelectProject(savePath, url));
  }
}

/**
 * @description import online project
 * @return {function(*=, *)}
 */
export function importOnlineProject() {
  return ((dispatch, getState) => {
    const link = getState().importOnlineReducer.importLink;
    dispatch(OnlineModeActions.confirmOnlineAction(() => {
      dispatch(
        AlertModalActions.openAlertDialog("Importing " + link + " Please wait...", true)
      );
      loadOnline.importOnlineProjectFromUrl(link, dispatch, handleImportResults);
    }));
  });
}

export function getLink(importLink) {
  return {
    type: consts.IMPORT_LINK,
    importLink
  };
}

export function clearLink() {
    return {
        type: consts.IMPORT_LINK,
        importLink: ""
    };
}

export function searchReposByUser(user) {
  return ((dispatch) => {
    dispatch( AlertModalActions.openAlertDialog("Searching, Please wait...", true));
    Gogs().searchReposByUser(user).then((repos) => {
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: repos.data
      });
      dispatch(AlertModalActions.closeAlertDialog());
    });
  });
}

export function searchReposByQuery(query) {
  return ((dispatch) => {
    if (query) {
      if (query.user && query.bookId && query.laguageId) {
        // search by user, bookId and laguageId
        dispatch(searchByUserAndFilter(query.user, query.bookId, query.laguageId));
      } else if (query.user && query.bookId) {
        // search by user and bookId
        dispatch(searchByUserAndFilter(query.user, query.bookId));
      } else if (query.user && query.laguageId) {
        // search by user and laguageId
        dispatch(searchByUserAndFilter(query.user, query.laguageId));
      } else if (query.bookId && query.laguageId) {
        // search by bookId and laguageId
        dispatch(searchAndFilter(query.bookId, query.laguageId));
      } else if (query.bookId) {
        // search only by bookId
        dispatch(searchBy(query.bookId));
      } else if (query.laguageId) {
        // search only by laguageId
        dispatch(searchBy(query.laguageId));
      } else if (query.user) {
        // search by user only
        dispatch(searchReposByUser(query.user));
      }
    }
  });
}

function searchByUserAndFilter(user, filterBy, secondFilter) {
  return ((dispatch) => {
    dispatch( AlertModalActions.openAlertDialog("Searching, Please wait...", true));
    Gogs().searchReposByUser(user).then((repos) => {
      let filteredRepos = repos.data.filter((repo) => {
        if (!secondFilter) {
          return repo.name.includes(filterBy);
        } else {
          return repo.name.includes(filterBy) && repo.name.includes(secondFilter);
        }
      });
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: filteredRepos
      });
      dispatch(AlertModalActions.closeAlertDialog());
    });
  });
}

function searchAndFilter(bookId, languageId) {
  return ((dispatch) => {
    dispatch( AlertModalActions.openAlertDialog("Searching, Please wait...", true));
    let searchBy = `${languageId}_${bookId}`;
    Gogs().searchRepos(searchBy).then((repos) => {
      let filteredRepos = repos.filter((repo) => {
        return repo.name.includes(languageId);
      });
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: filteredRepos
      });
      dispatch(AlertModalActions.closeAlertDialog());
    });
  });
}

function searchBy(searchBy) {
  return ((dispatch) => {
    dispatch( AlertModalActions.openAlertDialog("Searching, Please wait...", true));
    Gogs().searchRepos(searchBy).then((repos) => {
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos
      });
      dispatch(AlertModalActions.closeAlertDialog());
    });
  });
}
