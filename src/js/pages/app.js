import React, { Component } from 'react';
import { connect } from 'react-redux';
import fs from 'fs-extra';
import path from 'path-extra';
import CryptoJS from "crypto-js";
import { Grid, Row, Col } from 'react-bootstrap';
import RootStyles from './RootStyle';
import injectTapEventPlugin from 'react-tap-event-plugin';
// injectTapEventPlugin Handles onTouchTap events from material-ui components
injectTapEventPlugin();
// container
import NotificationContainer from '../containers/NotificationContainer';
import KonamiContainer from "../containers/KonamiContainer.js";
import StatusBarContainer from '../containers/StatusBarContainer';
import SideBarContainer from '../containers/SideBarContainer';
import LoaderContainer from '../containers/LoaderContainer';
import AlertModalContainer from '../containers/AlertModalContainer';
import ModuleWrapperContainer from '../containers/ModuleWrapperContainer';
import PopoverContainer from '../containers/PopoverContainer';
import ModalContainer from '../containers/ModalContainer.js';
// actions
import CoreActions from '../actions/CoreActions.js';
import * as recentProjectActions from '../actions/RecentProjectsActions.js';
import * as DragDropActions from '../actions/DragDropActions.js';
// constant declarations
const api = window.ModuleApi;


class Main extends Component {

  componentWillMount() {
    const tCDir = path.join(path.homedir(), 'translationCore');
    fs.ensureDirSync(tCDir);
  }

  componentDidMount() {
    var packageJson = require(window.__base + '/package.json');
    if (localStorage.getItem('version') !== packageJson.version) {
      localStorage.removeItem('lastProject');
      localStorage.removeItem('lastCheckModule');
      localStorage.setItem('version', packageJson.version);
    }
    if (localStorage.getItem('crashed') == 'true') {
      localStorage.removeItem('crashed');
      localStorage.removeItem('lastProject');
    }

    if (localStorage.getItem('user')) {
      var phrase = api.getAuthToken('phrase') != undefined ? api.getAuthToken('phrase') : "tc-core";
      var decrypted = CryptoJS.AES.decrypt(localStorage.getItem('user'), phrase);
      var userdata = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      this.props.dispatch({
        type: "RECEIVE_LOGIN",
        val: userdata
      });
    }
    var projectSaveLocation = localStorage.getItem('lastProject');
    try {
      if (api.getSettings('tutorialView') !== 'show' && projectSaveLocation) {
        var lastProjectFiles = fs.readdirSync(projectSaveLocation);
        this.props.sendFilePath(projectSaveLocation);
        var lastCheckModule = localStorage.getItem('lastCheckModule');
        if (lastCheckModule) {
          this.props.startLoadingNewProject(lastCheckModule);
        }
      }
    } catch (e) {
      if (e.path) {
        var splitArr = e.path.split("/");
        api.createAlert(
          {
            title: 'Error Opening Last Project',
            content: `Last project ${splitArr[splitArr.length - 1]} was not found.`,
            moreInfo: e,
            leftButtonText: "Ok"
          },
          () => {
            localStorage.removeItem('lastProject');
          });
      }
    }
  }

  render() {
    return (
      <div className="fill-height">
        <KonamiContainer />
        <ModalContainer />
        <PopoverContainer />
        <NotificationContainer />
        <Grid fluid style={{ padding: 0 }}>
          <Row style={{ margin: 0 }}>
            <StatusBarContainer />
          </Row>
          <Col className="col-fluid" xs={1} sm={2} md={2} lg={3} style={{ padding: 0, width: "250px" }}>
            <SideBarContainer />
          </Col>
          <Col style={RootStyles.ScrollableSection} xs={7} sm={8} md={9} lg={9.5}>
            <LoaderContainer />
            <AlertModalContainer />
            <ModuleWrapperContainer />
          </Col>
        </Grid>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    dispatch: dispatch,
    sendFilePath: (filePath, link, callback) => {
      dispatch(DragDropActions.sendFilePath(filePath, link, callback));
    },
    startLoadingNewProject: lastCheckModule => {
      dispatch(recentProjectActions.startLoadingNewProject(lastCheckModule));
    }
  };
};

const mapStateToProps = state => {
  return state;
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);
