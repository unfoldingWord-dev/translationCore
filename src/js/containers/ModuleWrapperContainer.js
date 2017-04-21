import React from 'react';
import { connect } from 'react-redux';
// container
import RecentProjectsContainer from './RecentProjectsContainer';
import ToolsContainer from './ToolsContainer';
// components
import SwitchCheck from '../components/core/SwitchCheck';
// actions
import { selectModalTab } from '../actions/ModalActions.js';

class ModuleWrapperContainer extends React.Component {

  render() {
    let {modules, type, mainViewVisible} = this.props.coreStoreReducer
    let {toolName} = this.props.currentToolReducer
    let mainTool = modules[toolName];
    let mainContent;

    if (mainViewVisible) {
      switch (type) {
        case 'tools':
          mainContent = <SwitchCheck {...this.props} />;
          break;
        case 'recent':
          mainContent = <RecentProjectsContainer />;
          break;
        case 'main':
          mainContent = <ToolsContainer currentTool={mainTool} />;
          break;
        default:
          mainContent = (<div> </div>);
          break;
      }
    }
    return (
      <div>
        {mainContent}
      </div>
    );
  }
}


const mapStateToProps = (state) => {
  return {
    contextIdReducer: state.contextIdReducer,
    coreStoreReducer: state.coreStoreReducer,
    toolsReducer: state.toolsReducer,
    settingsReducer: state.settingsReducer,
    loaderReducer: state.loaderReducer,
    projectDetailsReducer: state.projectDetailsReducer,
    currentToolReducer: state.currentToolReducer
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    showLoad: () => {
      dispatch(selectModalTab(2))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModuleWrapperContainer);
