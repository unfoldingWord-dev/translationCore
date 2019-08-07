import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// selectors
import {
  getActiveLocaleLanguage,
  getIsSoftwareUpdateOpen
} from '../../selectors';
// containers & components
import HomeContainer from './HomeContainer';
import ToolContainer from '../ToolContainer';
import SoftwareUpdatesDialog from "../SoftwareUpdateDialog";
import CriticalError from './CriticalError';
// helpers
import { withLocale } from '../Locale';
// actions
import { closeSoftwareUpdate } from "../../actions/SoftwareUpdateActions";
import { toggleHomeView, resetReducers } from '../../actions/BodyUIActions';

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100%'
  },
};

class BodyContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
    this.handleCloseSoftwareUpdate = this.handleCloseSoftwareUpdate.bind(this);
    this.returnHome = this.returnHome.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const {loadingProject} = nextProps.reducers.homeScreenReducer;
    if (loadingProject === true) {
      console.log('Prevented BodyContainer loading re-render');
      return false;
    } else return true;
  }

  componentDidCatch(error, info) {
    // Toggling home view to not show app menu
    this.props.toggleHomeView(true);
    this.setState({ error });
    console.error(error);
    console.info(info);
  }

  handleCloseSoftwareUpdate() {
    this.props.closeSoftwareUpdate();
  }

  returnHome() {
    this.setState({ error: null });
    this.props.resetReducers();
    this.props.toggleHomeView(true);
  }

  render () {
    const {currentLanguage, translate, isSoftwareUpdateOpen} = this.props;
    const {displayHomeView} = this.props.reducers.homeScreenReducer;
    const { error } = this.state;

    const softwareUpdateDialog = (
      <SoftwareUpdatesDialog
        open={isSoftwareUpdateOpen}
        translate={translate}
        onClose={this.handleCloseSoftwareUpdate}/>
    );

    if(error !== null) {
      return <CriticalError translate={translate} returnHome={this.returnHome} />;
    } else if (displayHomeView) {
      return (
        <div style={styles.root}>
          <HomeContainer translate={translate}
                         currentLanguage={currentLanguage}/>
          {softwareUpdateDialog}
        </div>
      );
    } else {
      return (
        <div style={styles.root}>
          <ToolContainer currentLanguage={currentLanguage}
                         translate={translate}/>
          {softwareUpdateDialog}
        </div>
      );
    }
  }
}

const mapStateToProps = (state) => {
  return {
    reducers: {
      homeScreenReducer: state.homeScreenReducer
    },
    currentLanguage: getActiveLocaleLanguage(state),
    isSoftwareUpdateOpen: getIsSoftwareUpdateOpen(state)
  };
};

const mapDispatchToProps = {
  closeSoftwareUpdate,
  toggleHomeView,
  resetReducers,
};

BodyContainer.propTypes = {
  reducers: PropTypes.object.isRequired,
  currentLanguage: PropTypes.object,
  translate: PropTypes.func,
  isSoftwareUpdateOpen: PropTypes.bool.isRequired,
  closeSoftwareUpdate: PropTypes.func.isRequired,
  toggleHomeView: PropTypes.func.isRequired,
  resetReducers: PropTypes.func.isRequired,
};

export default withLocale(connect(mapStateToProps, mapDispatchToProps)(BodyContainer));
