/**
 * @module Actions/GroupMenu
 */

import consts from './ActionTypes';

/**
 * @description This action expands/collapses the submenu in the group menu
 * @param {bool} isSubMenuExpanded - true or false
 */

export const expandSubMenu = isSubMenuExpanded => {
  return {
    type: consts.GROUP_MENU_EXPAND_SUBMENU,
    isSubMenuExpanded
  };
};

/**
 * @description Sets filter for what items to show.
 * @param {string} name - name of filter to toggle.
 */
export const setFilter = (name, value) => {
  return {
    type: consts.GROUP_MENU_SET_FILTER,
    name,
    value
  };
};
