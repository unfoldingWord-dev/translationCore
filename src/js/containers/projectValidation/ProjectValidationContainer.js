import { connect } from 'react-redux'
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
//actions
import * as ProjectValidationActions from '../../actions/ProjectValidationActions';
import * as MergeConflictActions from '../../actions/MergeConflictActions';
import * as CopyrightActions from '../../actions/CopyrightActions';
import * as ProjectInformationActions from '../../actions/ProjectInformationActions';
import * as MissingVersesActions from '../../actions/MissingVersesActions';

//components
import { Card } from 'material-ui/Card';
import Dialog from 'material-ui/Dialog';
import ProjectValidationStepper from '../../components/projectValidation/ProjectValidationStepper';
import ProjectValidationInstructions from '../../components/projectValidation/ProjectValidationInstructions';
import CopyRightCheck from '../../components/projectValidation/CopyRightCheck';
import ProjectInformationCheck from '../../components/projectValidation/ProjectInformationCheck';
import MissingVersesCheck from '../../components/projectValidation/MissingVersesCheck';
import MergeConflictsCheck from '../../components/projectValidation/MergeConflictsCheck';
import ProjectValidationNavigation from '../../components/projectValidation/ProjectValidationNavigation';

class ProjectValidationContainer extends Component {
  render() {
    let { stepIndex } = this.props.reducers.projectValidationReducer.stepper;
    const { showProjectValidationStepper } = this.props.reducers.projectValidationReducer;

    const projectValidationContentStyle = {
      opacity: "1",
      width: '90%',
      maxWidth: 'none',
      height: '100%',
      maxHeight: 'none',
      padding: 0,
      top: -30
    };

    let displayContainer = <div />;

    switch (stepIndex) {
      case 1:
        displayContainer = <CopyRightCheck {...this.props} />;
        break;
      case 2:
        displayContainer = <ProjectInformationCheck {...this.props} />;
        break;
      case 3:
        displayContainer = <MergeConflictsCheck {...this.props} />;
        break;
      case 4:
        displayContainer = <MissingVersesCheck {...this.props} />;
        break;
      default:
        break;
    }
    return (
      <MuiThemeProvider>
        <Dialog
          actionsContainerStyle={{ backgroundColor: 'var(--background-color-light)' }}
          actions={<ProjectValidationNavigation {...this.props} />}
          modal={true}
          style={{ padding: "0px", zIndex: 2501 }}
          contentStyle={projectValidationContentStyle}
          bodyStyle={{ padding: 0, minHeight: '80vh', backgroundColor: 'var(--background-color-light)' }}
          open={showProjectValidationStepper}>
          <div style={{ height: '80vh' }}>
            <ProjectValidationStepper {...this.props} />
            <div style={{ display: 'flex', flexDirection: 'row', height: '85%', marginTop: '10px' }}>
              <div style={{ minWidth: '400px', height: '100%', padding: '0px 20px 0 65px' }}>
                <ProjectValidationInstructions {...this.props} />
              </div>
              <div style={{ height: '100%', width: '100%', padding: '20px 65px 0 20px' }}>
                {displayContainer}
              </div>
            </div>
          </div>
        </Dialog>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    reducers: {
      projectValidationReducer: state.projectValidationReducer,
      mergeConflictReducer: state.mergeConflictReducer
    }
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    actions: {
      goToProjectValidationStep: (val) => {
        dispatch(ProjectValidationActions.goToProjectValidationStep(val));
      },
      previousStep: () => {
        dispatch(ProjectValidationActions.goToPreviousProjectValidationStep());
      },
      nextStep: () => {
        dispatch(ProjectValidationActions.goToNextProjectValidationStep());
      },
      changeProjectValidationInstructions: (instructions) => {
        dispatch(ProjectValidationActions.changeProjectValidationInstructions(instructions));
      },
      toggleNextDisabled: (isDisabled) => {
        dispatch(ProjectValidationActions.toggleNextButton(isDisabled))
      },
      updateVersionSelection: (mergeConflictIndex, versionIndex, value) => {
        dispatch(MergeConflictActions.updateVersionSelection(mergeConflictIndex, versionIndex, value));
      },
      updateMergeConflictNextButton: () => {
        dispatch(MergeConflictActions.updateMergeConflictNextButton());
      },
      finalizeCopyrightCheck: () => {
          dispatch(CopyrightActions.finalize());
      },
      finalizeMergeConflictCheck: () => {
        dispatch(MergeConflictActions.finalize());
      },
      finalizeMissingVersesCheck: () => {
        dispatch(MissingVersesActions.finalize());
      },
      finalizeProjectInformationCheck: () => {
        dispatch(ProjectInformationActions.finalize());
      }
    }
  }
}

ProjectValidationContainer.propTypes = {
  actions: PropTypes.object.isRequired,
  reducers: PropTypes.shape({
    projectValidationReducer: PropTypes.shape({
      stepper: PropTypes.shape({
        stepIndex: PropTypes.number.isRequired
      }),
      showProjectValidationStepper:PropTypes.bool.isRequired
    }),
    mergeConflictReducer: PropTypes.object.isRequired,
  })
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectValidationContainer)