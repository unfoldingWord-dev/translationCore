/* eslint-disable no-console */
import { getTranslate } from '../selectors';
import consts from './ActionTypes';
// actions
import * as AlertModalActions from './AlertModalActions';

export function searchReposByQuery(query) {
  return (dispatch) => {
    if (query) {
      if (query.user && query.bookId && query.languageId) {
        // search by user, bookId and languageId
        dispatch(searchReposByUser(query.user, query.bookId, query.languageId));
      } else if (query.user && query.bookId) {
        // search by user and bookId
        dispatch(searchReposByUser(query.user, query.bookId));
      } else if (query.user && query.languageId) {
        // search by user and languageId
        dispatch(searchReposByUser(query.user, query.languageId));
      } else if (query.bookId && query.languageId) {
        // search by languageId and bookId
        const searchQuery = `${query.languageId}_${query.bookId}`;
        dispatch(searchByQuery(searchQuery));
      } else if (query.bookId) {
        // search only by bookId
        dispatch(searchByQuery(query.bookId));
      } else if (query.languageId) {
        // search only by languageId
        dispatch(searchByQuery(query.languageId));
      } else if (query.user) {
        // search by user only
        dispatch(searchReposByUser(query.user));
      }
    }
  };
}

export const searchReposByUser = (user, firstFilter, secondFilter, onLine = navigator.onLine) => async (dispatch, getState) => {
  const translate = getTranslate(getState());

  if (onLine) {
    dispatch(AlertModalActions.openAlertDialog(translate('projects.searching_alert'), true));

    try {
      const response = await fetch(`https://git.door43.org/api/v1/users/${user}/repos`);
      let repos = await response.json();
      repos = firstFilter || secondFilter ? filterReposBy(repos, firstFilter, secondFilter) : repos;
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos,
      });
    } catch (e) {
      // Failed to find repo for user specified therefore clear repos list in the reducer.
      dispatch({
        type: consts.SET_REPOS_DATA,
        repos: [],
        e,
      });
    }
    dispatch(AlertModalActions.closeAlertDialog());
  } else {
    dispatch(AlertModalActions.openAlertDialog(translate('no_internet')));
  }
};

export function searchByQuery(query, onLine = navigator.onLine) {
  return async (dispatch, getState) => {
    const translate = getTranslate(getState());

    if (onLine) {
      dispatch(AlertModalActions.openAlertDialog(translate('projects.searching_alert'), true));

      try {
        const response = await fetch(`https://git.door43.org/api/v1/repos/search?q=${query}&uid=0&limit=100`);
        const json = await response.json();

        dispatch({
          type: consts.SET_REPOS_DATA,
          repos: json.data,
        });
      } catch (e) {
        // Failed to find repo for user specified therefore clear repos list in the reducer.
        dispatch({
          type: consts.SET_REPOS_DATA,
          repos: [],
        });
      }
      dispatch(AlertModalActions.closeAlertDialog());
    } else {
      dispatch(AlertModalActions.openAlertDialog(translate('no_internet')));
    }
  };
}

function filterReposBy(repos, firstFilter, secondFilter) {
  return repos.filter((repo) => {
    if (!secondFilter) {
      return repo.name.includes(firstFilter);
    } else {
      return repo.name.includes(firstFilter) && repo.name.includes(secondFilter);
    }
  });
}
