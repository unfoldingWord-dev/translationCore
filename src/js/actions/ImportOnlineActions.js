/* eslint-disable no-console */
import consts from './ActionTypes';
import Gogs from '../components/login/GogsApi';
import rimraf from 'rimraf';
import React from 'react';
// actions
import * as ProjectSelectionActions from './ProjectSelectionActions';
import * as AlertModalActions from './AlertModalActions';
import * as OnlineModeActions from './OnlineModeActions';
import * as MyProjectsActions from './MyProjectsActions';
import * as ImportLocalActions from './ImportLocalActions'
// helpers
import * as loadOnline from '../helpers/LoadOnlineHelpers';
import * as ProjectSelectionHelpers from '../helpers/ProjectSelectionHelpers';

export function updateRepos() {
    return ((dispatch, getState) => {
        var user = getState().loginReducer.userdata;
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
                    })
                });
            }
        }))
    })
}

export function importOnlineProject() {
  return ((dispatch, getState) => {
    const link = getState().importOnlineReducer.importLink;
    dispatch(OnlineModeActions.confirmOnlineAction(() => {
      dispatch(
        AlertModalActions.openAlertDialog("Importing " + link + " Please wait...", true)
      );

      loadOnline.openManifest(link, function (err, savePath, url) {
        if (err) {
          let errmessage = "An unknown problem occurred during import";

          if (err.toString().includes("fatal: unable to access")) {
              errmessage = "Unable to connect to the server. Please check your Internet connection.";
          } else if (err.toString().includes("fatal: The remote end hung up")) {
              errmessage = "Unable to connect to the server. Please check your Internet connection.";
          } else if (err.toString().includes("Failed to load")) {
              errmessage = "Unable to connect to the server. Please check your Internet connection.";
          } else if (err.toString().includes("fatal: repository")) {
              errmessage = "The URL does not reference a valid project";
          } else if (err.type && err.type === "custom") {
              errmessage = err.text;
          }

          dispatch(AlertModalActions.openAlertDialog(errmessage));
          dispatch({ type: "LOADED_ONLINE_FAILED" });
          dispatch({ type: consts.RESET_IMPORT_ONLINE_REDUCER })
        } else {
          dispatch({ type: consts.RESET_IMPORT_ONLINE_REDUCER })
          dispatch(clearLink());
          dispatch(AlertModalActions.closeAlertDialog());
          let invalidProjectTypeError = ProjectSelectionHelpers.verifyProjectType(savePath);
          if (invalidProjectTypeError) {
            dispatch(AlertModalActions.openAlertDialog(
              <div>
                Project selection failed<br />
                {invalidProjectTypeError}<br />
              </div>
            ));
            dispatch(ProjectSelectionActions.clearLastProject());
            /** Need to re-run projects retreival because a project may have been deleted */
            return dispatch(MyProjectsActions.getMyProjects());
          }
          dispatch(ImportLocalActions.verifyAndSelectProject(savePath, url));
        }
      });
    }));
  })
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
    Gogs().searchReposByUser(user).then((repos) => {
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: repos.data
      });
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
    Gogs().searchReposByUser(user).then((repos) => {
      let filteredRepos = repos.data.filter((repo) => {
        if (!secondFilter) {
          return repo.name.includes(filterBy);
        } else {
          return repo.name.includes(filterBy) && repo.name.includes(secondFilter)
        }
      });
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: filteredRepos
      });
    });
  });
}

function searchAndFilter(searchBy, filterBy, secondFilter) {
  return ((dispatch) => {
    Gogs().searchRepos(searchBy).then((repos) => {
      let filteredRepos = repos.filter((repo) => {
        if (!secondFilter) {
          return repo.name.includes(filterBy);
        } else {
          return repo.name.includes(filterBy) && repo.name.includes(secondFilter)
        }
      });
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: filteredRepos
      });
    });
  });
}

function searchBy(searchBy) {
  return ((dispatch) => {
    Gogs().searchRepos(searchBy).then((repos) => {
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos
      });
    });
  });
}
