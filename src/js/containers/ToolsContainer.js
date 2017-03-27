import React from 'react';
import { connect } from 'react-redux';
import { showNotification } from '../actions/NotificationActions.js';
import { showPopover } from '../actions/PopoverActions.js';
import { addNewResource, addNewBible } from '../actions/ResourcesActions.js';
import { addComment } from '../actions/CommentsActions.js';
import { addVerseEdit } from '../actions/VerseEditActions.js';
import { toggleReminder } from '../actions/RemindersActions.js';
import { addSelections, removeSelections } from '../actions/SelectionsActions.js';
import * as CheckStoreActions from '../actions/CheckStoreActions.js'

class ToolsContainer extends React.Component {
  render() {
    let Tool = this.props.currentTool;
    return (
      <Tool {...this.props} progress={this.props.progress}
        addNewBible={this.props.addNewBible}
        addNewResource={this.props.addNewResource}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    ...state.checkStoreReducer,
    ...state.loginReducer,
    ...state.settingsReducer,
    ...state.statusBarReducer,
    ...state.loaderReducer,
    ...state.resourcesReducer,
    ...state.commentsReducer,
    ...state.remindersReducer,
    ...state.projectDetailsReducer,
    modules: state.coreStoreReducer.modules
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateCurrentCheck: (NAMESPACE, newCurrentCheck) => {
      dispatch(CheckStoreActions.updateCurrentCheck(NAMESPACE, newCurrentCheck));
    },
    handleGoToCheck: (newGroupIndex, newCheckIndex, groups) => {
      dispatch(CheckStoreActions.goToCheck(newGroupIndex, newCheckIndex, groups));
    },
    handleGoToNext: () => {
      dispatch(CheckStoreActions.goToNext());
    },
    handleGoToPrevious: () => {
      dispatch(CheckStoreActions.goToPrevious());
    },
    showNotification: (message, duration) => {
      dispatch(showNotification(message, duration));
    },
    showPopover: (title, bodyText, positionCoord) => {
      dispatch(showPopover(title, bodyText, positionCoord));
    },
    addNewResource: (resourceName, resourceData) => {
      dispatch(addNewResource(resourceName, resourceData));
    },
    addNewBible: (bibleName, bibleData) => {
      dispatch(addNewBible(bibleName, bibleData));
    },
    progress: (progress) => {
      console.log(progress)
    },
    addComment: (text, userName) => {
      dispatch(addComment(text, userName));
    },
    addSelections: (text, userName) => {
      dispatch(addSelections(text, userName));
    },
    removeSelections: (text, userName) => {
      dispatch(removeSelections(text, userName));
    },
    toggleReminder: (userName) => {
      dispatch(toggleReminder(userName));
    },
    addVerseEdit: (text, userName) => {
      dispatch(addVerseEdit(text, userName));
    }
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ToolsContainer);
