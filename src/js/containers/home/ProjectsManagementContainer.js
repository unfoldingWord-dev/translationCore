import React, { Component } from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
// components
import MyProjects from '../../components/home/projectsManagement/MyProjects';
import ProjectsFAB from '../../components/home/projectsManagement/ProjectsFAB';
import OnlineImportModal from '../../components/home/projectsManagement/onlineImport/OnlineImportModal'
// actions
import * as BodyUIActions from '../../actions/BodyUIActions';
import * as MyProjectsActions from '../../actions/MyProjectsActions';
import * as ProjectSelectionActions from '../../actions/ProjectSelectionActions';
import * as ImportLocalActions from '../../actions/ImportLocalActions';
import * as ImportOnlineActions from '../../actions/ImportOnlineActions';
import * as RecentProjectsActions from '../../actions/RecentProjectsActions';
import * as USFMExportActions from '../../actions/USFMExportActions';
import * as OnlineModeActions from '../../actions/OnlineModeActions';

class ProjectsManagementContainer extends Component {

  componentWillMount() {
    this.props.actions.getMyProjects();
    let instructions = this.instructions();
    if (this.props.reducers.homeScreenReducer.homeInstructions !== instructions) {
      this.props.actions.changeHomeInstructions(instructions);
    }
  }

  instructions() {
    return (
      <div>
        <p>Select a project from the list.</p>
        <p>To import a project, click (=)</p>
        <p>Only projects that have been saved with the latest version of translationStudio can be opened in translationCore at this time.</p>
      </div>
    );
  }

  render() {
<<<<<<< HEAD
    const { projectDetailsReducer, myProjectsReducer } = this.props.reducers;
=======
    const {
      projectDetailsReducer,
      importOnlineReducer,
      myProjectsReducer,
      homeScreenReducer,
      loginReducer
    } = this.props.reducers;
>>>>>>> develop
    const myProjects = myProjectsReducer.projects;

    return (
      <div style={{ height: '100%' }}>
        <MyProjects myProjects={myProjects} actions={this.props.actions} />
<<<<<<< HEAD
        <div style={{ position: "absolute", bottom: "50px", right: "50px", zIndex: "2000" }}>
=======
        <div style={{ position: "absolute", bottom:"50px", right: "50px", zIndex: "999"}}>
>>>>>>> develop
          <ProjectsFAB
            homeScreenReducer={this.props.reducers.homeScreenReducer}
            actions={this.props.actions}
          />
        </div>
        <OnlineImportModal
          importOnlineReducer={importOnlineReducer}
          homeScreenReducer={homeScreenReducer}
          loginReducer={loginReducer}
          actions={this.props.actions}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    reducers: {
      projectDetailsReducer: state.projectDetailsReducer,
      importOnlineReducer: state.importOnlineReducer,
      homeScreenReducer: state.homeScreenReducer,
      myProjectsReducer: state.myProjectsReducer,
      loginReducer: state.loginReducer
    }
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    actions: {
      changeHomeInstructions: (instructions) => {
        dispatch(BodyUIActions.changeHomeInstructions(instructions));
      },
      toggleProjectsFAB: () => {
        dispatch(BodyUIActions.toggleProjectsFAB());
      },
      getMyProjects: () => {
        dispatch(MyProjectsActions.getMyProjects());
      },
      selectProject: (projectPath) => {
        dispatch(ProjectSelectionActions.selectProject(projectPath));
      },
      selectLocalProjectToLoad: () => {
        dispatch(ImportLocalActions.selectLocalProjectToLoad());
      },
      exportToCSV: (projectPath) => {
        dispatch(RecentProjectsActions.exportToCSV(projectPath));
      },
      uploadProject: (projectPath) => {
        const { userdata } = ownProps.reducers.loginReducer
        dispatch(RecentProjectsActions.uploadProject(projectPath, userdata));
      },
<<<<<<< HEAD
      exportToUSFM: (projectPath) => {
        dispatch(USFMExportActions.exportToUSFM(projectPath));
      },
=======
      closeOnlineImportModal: () => {
        dispatch(BodyUIActions.closeOnlineImportModal());
      },
      openOnlineImportModal: () => {
        dispatch(OnlineModeActions.confirmOnlineAction(() => {
          dispatch(BodyUIActions.toggleProjectsFAB());
          dispatch(BodyUIActions.openOnlineImportModal());
        }));
      },
      handleURLInputChange: importLink => {
        dispatch(ImportOnlineActions.getLink(importLink));
      },
      loadProjectFromLink: () => {
        dispatch(ImportOnlineActions.importOnlineProject());
      },
      searchReposByUser: (user) => {
        dispatch(ImportOnlineActions.searchReposByUser(user));
      },
      searchReposByQuery: (query, user) => {
        dispatch(ImportOnlineActions.searchReposByQuery(query, user));
      }
>>>>>>> develop
    }
  };
};

ProjectsManagementContainer.propTypes = {
  reducers: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsManagementContainer);
