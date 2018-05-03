import React from 'react';
import path from 'path';
import fs from 'fs-extra';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// actions
import { showPopover } from '../actions/PopoverActions';
import { addComment } from '../actions/CommentsActions';
import { editTargetVerse } from '../actions/VerseEditActions';
import { toggleReminder } from '../actions/RemindersActions';
import {
  changeSelections,
  validateSelections
} from '../actions/SelectionsActions';
import {
  changeCurrentContextId,
  changeToNextContextId,
  changeToPreviousContextId,
  loadCurrentContextId
} from '../actions/ContextIdActions';
import { addGroupData } from '../actions/GroupsDataActions';
import { setGroupsIndex } from '../actions/GroupsIndexActions';
import { setToolSettings } from '../actions/SettingsActions';
import {
  closeAlertDialog,
  openAlertDialog,
  openOptionDialog
} from '../actions/AlertModalActions';
import { selectModalTab } from '../actions/ModalActions';
import * as ResourcesActions from '../actions/ResourcesActions';
import * as WordAlignmentActions from '../actions/WordAlignmentActions';
import {showResetAlignmentsDialog} from '../actions/WordAlignmentLoadActions';
//helpers
import * as ResourcesHelpers from '../helpers/ResourcesHelpers';
import {VerseObjectUtils} from 'word-aligner';
import * as LexiconHelpers from '../helpers/LexiconHelpers';
import {
  getContext,
  getProjectSaveLocation,
  getSelectedSourceVerse,
  getSelectedTargetVerse,
  getSelectedSourceChapter,
  getSelectedTargetChapter,
  getAlertIsOpen
} from '../selectors';

class ToolsContainer extends React.Component {

  constructor (props) {
    super(props);
    this.onWriteGlobalToolData = this.onWriteGlobalToolData.bind(this);
    this.onReadGlobalToolData = this.onReadGlobalToolData.bind(this);
    this.onShowAlert = this.onShowAlert.bind(this);
    this.onShowConfirm = this.onShowConfirm.bind(this);
  }

  componentDidMount () {
    let {contextId} = this.props.contextIdReducer;
    if (!contextId) this.props.actions.loadCurrentContextId();
  }

  componentWillReceiveProps (nextProps) {
    let {contextId} = nextProps.contextIdReducer;
    let {currentToolName} = nextProps.toolsReducer;
    // if contextId does not match current tool, then remove contextId
    if (contextId && contextId.tool !== currentToolName) {
      nextProps.actions.changeCurrentContextId(undefined);
    }
  }

  /**
   * Handles writing global project data
   *
   * @param {string} filePath - the relative path to be written
   * @param {string} data - the data to write
   * @return {Promise}
   */
  onWriteGlobalToolData (filePath, data) {
    const {projectSaveLocation} = this.props;
    const writePath = path.join(projectSaveLocation,
      '.apps/translationCore/', filePath);
    return fs.outputFile(writePath, data);
  }

  /**
   * Handles reading global project data
   *
   * @param {string} filePath - the relative path to read
   * @return {Promise<string>}
   */
  async onReadGlobalToolData (filePath) {
    const {projectSaveLocation} = this.props;
    const readPath = path.join(projectSaveLocation,
      '.apps/translationCore/', filePath);
    const exists = await fs.pathExists(readPath);
    if (!exists) {
      return Promise.reject();
    }
    try {
      const data = await fs.readFile(readPath);
      return data.toString();
    } catch (e) {
      Promise.reject(e);
    }
  }

  /**
   * Displays a modal dialog with a single button to dismiss the dialog.
   * @param {string} message
   * @return {Promise}
   */
  onShowAlert(message) {
    const {showResetAlignmentsDialog} = this.props;
    // TODO: show modal and return a promise that resolves when the modal is dismissed.
    console.log(message);
    return showResetAlignmentsDialog();
  }

  /**
   * Displays a modal dialog with confirmation and cancel button.
   * @param {string} message
   * @return {Promise}
   */
  onShowConfirm(message) {
    return Promise.resolve(message);
  }

  render () {
    const {
      currentLanguage,
      contextId,
      targetVerseText,
      sourceVerse,
      targetChapter,
      sourceChapter
    } = this.props;
    let {currentToolViews, currentToolName} = this.props.toolsReducer;
    let Tool = currentToolViews[currentToolName];

    const {code} = currentLanguage;

    return (
      <Tool
        {...this.props}
        writeGlobalToolData={this.onWriteGlobalToolData}
        readGlobalToolData={this.onReadGlobalToolData}
        showAlert={this.onShowAlert}
        contextId={contextId}
        targetVerseText={targetVerseText}
        sourceVerse={sourceVerse}
        targetChapter={targetChapter}
        sourceChapter={sourceChapter}

        appLanguage={code}
        currentToolViews={currentToolViews}/>
    );
  }
}

ToolsContainer.propTypes = {
  contextId: PropTypes.object,
  projectSaveLocation: PropTypes.string.isRequired,
  targetVerseText: PropTypes.string,
  sourceVerse: PropTypes.object,
  sourceChapter: PropTypes.object,
  targetChapter: PropTypes.object,
  toolsReducer: PropTypes.any.isRequired,
  actions: PropTypes.any.isRequired,
  contextIdReducer: PropTypes.any.isRequired,
  currentLanguage: PropTypes.object.isRequired,
  dialogIsOpen: PropTypes.bool.isRequired,

  showResetAlignmentsDialog: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    dialogIsOpen: getAlertIsOpen(state),
    sourceVerse: getSelectedSourceVerse(state),
    targetVerseText: getSelectedTargetVerse(state),
    sourceChapter: getSelectedSourceChapter(state),
    targetChapter: getSelectedTargetChapter(state),
    contextId: getContext(state),
    projectSaveLocation: getProjectSaveLocation(state),
    toolsReducer: state.toolsReducer,
    loginReducer: state.loginReducer,
    settingsReducer: state.settingsReducer,
    loaderReducer: state.loaderReducer,
    resourcesReducer: state.resourcesReducer,
    commentsReducer: state.commentsReducer,
    remindersReducer: state.remindersReducer,
    invalidatedReducer: state.invalidatedReducer,
    contextIdReducer: state.contextIdReducer,
    projectDetailsReducer: state.projectDetailsReducer,
    selectionsReducer: state.selectionsReducer,
    verseEditReducer: state.verseEditReducer,
    groupsIndexReducer: state.groupsIndexReducer,
    groupsDataReducer: state.groupsDataReducer,
    wordAlignmentReducer: state.wordAlignmentReducer
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showResetAlignmentsDialog: () => {
      dispatch(showResetAlignmentsDialog());
    },
    actions: {
      goToNext: () => {
        dispatch(changeToNextContextId());
      },
      goToPrevious: () => {
        dispatch(changeToPreviousContextId());
      },
      showPopover: (title, bodyText, positionCoord) => {
        dispatch(showPopover(title, bodyText, positionCoord));
      },
      addNewBible: (bibleName, bibleData) => {
        dispatch(ResourcesActions.addNewBible(bibleName, bibleData));
      },
      loadResourceArticle: (resourceType, articleId, languageId) => {
        dispatch(ResourcesActions.loadResourceArticle(resourceType, articleId,
          languageId));
      },
      loadLexiconEntry: (lexiconId, entryId) => {
        dispatch(ResourcesActions.loadLexiconEntry(lexiconId, entryId));
      },
      addComment: (text, userName) => {
        dispatch(addComment(text, userName));
      },
      changeSelections: (selections, userName) => {
        dispatch(changeSelections(selections, userName));
      },
      validateSelections: (targetVerse) => {
        dispatch(validateSelections(targetVerse));
      },
      toggleReminder: (userName) => {
        dispatch(toggleReminder(userName));
      },
      selectModalTab: (tab, section, vis) => {
        dispatch(selectModalTab(tab, section, vis));
      },
      editTargetVerse: (chapter, verse, before, after, tags, username) => {
        dispatch(
          editTargetVerse(chapter, verse, before, after, tags, username));
      },
      changeCurrentContextId: (contextId) => {
        dispatch(changeCurrentContextId(contextId));
      },
      loadCurrentContextId: () => {
        dispatch(loadCurrentContextId());
      },
      addGroupData: (groupId, groupData) => {
        dispatch(addGroupData(groupId, groupData));
      },
      setGroupsIndex: (groupsIndex) => {
        dispatch(setGroupsIndex(groupsIndex));
      },
      setToolSettings: (NAMESPACE, settingsPropertyName, toolSettingsData) => {
        dispatch(
          setToolSettings(NAMESPACE, settingsPropertyName, toolSettingsData));
      },
      openAlertDialog: (message) => {
        dispatch(openAlertDialog(message));
      },
      openOptionDialog: (alertMessage, callback, button1Text, button2Text) => {
        dispatch(
          openOptionDialog(alertMessage, callback, button1Text, button2Text));
      },
      closeAlertDialog: () => {
        dispatch(closeAlertDialog());
      },
      moveWordBankItemToAlignment: (DropBoxItemIndex, WordBankItem) => {
        dispatch(
          WordAlignmentActions.moveWordBankItemToAlignment(DropBoxItemIndex,
            WordBankItem));
      },
      moveTopWordItemToAlignment: (topWordItem, fromAlignmentIndex, toAlignmentIndex) => {
        dispatch(WordAlignmentActions.moveTopWordItemToAlignment(topWordItem,
          fromAlignmentIndex, toAlignmentIndex));
      },
      moveBackToWordBank: (wordBankItem) => {
        dispatch(WordAlignmentActions.moveBackToWordBank(wordBankItem));
      },
      getWordListForVerse: VerseObjectUtils.getWordListForVerse,
      getGLQuote: ResourcesHelpers.getGLQuote,
      getLexiconData: LexiconHelpers.getLexiconData
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolsContainer);
