import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// info
import packagefile from '../../../../package.json';
// components
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import WelcomeSplash from '../../components/home/WelcomeSplash';
import LicenseModal from '../../components/home/license/LicenseModal';
import AppVersion from '../../components/home/AppVersion';
import HomeStepper from '../../components/home/Stepper';
import Overview from '../../components/home/overview';
import HomeScreenNavigation from '../../components/home/HomeScreenNavigation';
// containers
import UsersManagementContainer from './UsersManagementContainer';
import ProjectsManagementContainer from './ProjectsManagementContainer';
import ToolsManagementContainer from './ToolsManagementContainer';
// actions
import * as BodyUIActions from '../../actions/BodyUIActions';
import * as CSVExportActions from '../../actions/CSVExportActions';
import * as ProjectUploadActions from '../../actions/ProjectUploadActions';
import * as USFMExportActions from '../../actions/USFMExportActions';
import * as ProjectInformationCheckActions from '../../actions/ProjectInformationCheckActions';
import * as LocaleActions from '../../actions/LocaleActions';
import * as ProjectDetailsActions from '../../actions/ProjectDetailsActions';

// TRICKY: because this component is heavily coupled with callbacks to set content
// we need to connect locale state change events.
class HomeContainer extends Component {

  render() {
    let {
      stepper: {
        stepIndex
      },
      showWelcomeSplash,
      showLicenseModal
    } = this.props.reducers.homeScreenReducer;

    let displayContainer = <div />;

    switch (stepIndex) {
      case 0:
        displayContainer = <Overview {...this.props}/>;
        break;
      case 1:
        displayContainer = <UsersManagementContainer {...this.props}/>;
        break;
      case 2:
        displayContainer = <ProjectsManagementContainer {...this.props} />;
        break;
      case 3:
        displayContainer = <ToolsManagementContainer {...this.props} />;
        break;
      default:
        break;
    }

    const {translate} = this.props;

    return (
      <div style={{ width: '100%' }}>
        {showWelcomeSplash ?
          <WelcomeSplash {...this.props} /> :
          (
            <MuiThemeProvider style={{ fontSize: '1.1em' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', background: 'var(--background-color-light)' }}>
                <HomeStepper translate={translate}/>
                {displayContainer}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <HomeScreenNavigation translate={translate} {...this.props} />
                    <AppVersion actions={this.props.actions} version={`${packagefile.version} (${process.env.BUILD})`} />
                  </div>
                </div>
              </div>
            </MuiThemeProvider>
          )
        }
        <LicenseModal
          translate={translate}
          version={`${packagefile.version} (${process.env.BUILD})`}
          actions={this.props.actions}
          showLicenseModal={showLicenseModal}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    reducers: {
      homeScreenReducer: state.homeScreenReducer,
      loginReducer: state.loginReducer,
      projectDetailsReducer: state.projectDetailsReducer,
      toolsReducer: state.toolsReducer,
      groupsDataReducer: state.groupsDataReducer,
      localeSettings: state.localeSettings
    }
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      toggleWelcomeSplash: () => {
        dispatch(BodyUIActions.toggleWelcomeSplash());
      },
      closeLicenseModal: () => {
        dispatch(BodyUIActions.closeLicenseModal());
      },
      goToNextStep: () => {
        dispatch(BodyUIActions.goToNextStep());
      },
      goToPrevStep: () => {
        dispatch(BodyUIActions.goToPrevStep());
      },
      goToStep: (stepNumber) => {
        dispatch(BodyUIActions.goToStep(stepNumber));
      },
      toggleHomeView: () => {
        dispatch(BodyUIActions.toggleHomeView());
      },
      openLicenseModal: () => {
        dispatch(BodyUIActions.openLicenseModal());
      },
      exportToCSV: (projectPath) => {
        dispatch(CSVExportActions.exportToCSV(projectPath));
      },
      uploadProject: (projectPath, userdata) => {
        dispatch(ProjectUploadActions.uploadProject(projectPath, userdata));
      },
      exportToUSFM: (projectPath) => {
        dispatch(USFMExportActions.exportToUSFM(projectPath));
      },
      openOnlyProjectDetailsScreen: (projectSaveLocation) => {
        dispatch(ProjectInformationCheckActions.openOnlyProjectDetailsScreen(projectSaveLocation));
      },
      openLocaleScreen: () => {
        dispatch(LocaleActions.openLocaleScreen());
      },
      closeLocaleScreen: () => {
        dispatch(LocaleActions.closeLocaleScreen());
      },
      setLocaleLanguage: (languageCode) => {
        dispatch(LocaleActions.setLanguage(languageCode));
      },
      getProjectProgressForTools: (toolName) => {
        dispatch(ProjectDetailsActions.getProjectProgressForTools(toolName));
      }
    }
  };
};

HomeContainer.propTypes = {
  actions: PropTypes.object.isRequired,
  reducers: PropTypes.object.isRequired,
  translate: PropTypes.func
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeContainer);
