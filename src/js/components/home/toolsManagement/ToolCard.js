import React, {Component} from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {Card, CardHeader} from 'material-ui';
import {Glyphicon} from 'react-bootstrap';
// helpers
import * as ToolCardHelpers from '../../../helpers/ToolCardHelpers';
import {getTranslation} from '../../../helpers/localizationHelpers';
// components
import ToolCardBoxes from './ToolCardBoxes';
import Hint from '../../Hint';
import ToolCardProgress from './ToolCardProgress';
import GlDropDownList from './GlDropDownList.js';
import ToolCardNotificationBadges from './ToolCardNotificationBadges';
import {getGatewayLanguageList, hasValidOL} from "../../../helpers/gatewayLanguageHelpers";
import { getToolGatewayLanguage } from "../../../selectors";
import { connect } from "react-redux";

class ToolCard extends Component {
  constructor(props) {
    super(props);
    this.selectionChange = this.selectionChange.bind(this);
    this.state = {
      showDescription: false
    };
  }

  componentWillMount() {
    const {store} = this.context;
    const name = this.props.metadata.name;
    this.props.actions.getProjectProgressForTools(name);
    const gatewayLanguage = getToolGatewayLanguage(store.getState(), name);
    this.selectionChange(gatewayLanguage);
    this.setState({
      selectedGL: gatewayLanguage
    });
  }

  selectionChange(selectedGL) {
    if (selectedGL && selectedGL.trim()) {
      this.props.actions.setProjectToolGL(this.props.metadata.name, selectedGL);
      this.setState({selectedGL});
    }
  }

  getLaunchDisableMessage(id, developerMode, translate, name, selectedCategories) {
    let launchDisableMessage = ToolCardHelpers.getToolCardLaunchStatus(this.state.selectedGL, id, developerMode, translate);
    if (!launchDisableMessage) { // if no errors, make sure we have original language
      const olBookPath = hasValidOL(id);
      if (!olBookPath) {
        launchDisableMessage = translate('tools.book_not_supported');
      }
    }
    if (!launchDisableMessage && !developerMode) { // if no errors and not developer mode , make sure we have a gateway language
      const gatewayLanguageList = getGatewayLanguageList(id, name);
      launchDisableMessage = (gatewayLanguageList && gatewayLanguageList.length) ? null : translate('tools.book_not_supported');
    }
    if (!launchDisableMessage && (name === 'translationWords' && selectedCategories.length === 0)) {
      launchDisableMessage = translate('tools.no_checks_selected');
    }
    return launchDisableMessage;
  }

  render() {
    const {metadata: {
      title,
      version,
      description,
      badgeImagePath,
      folderName,
      name
    },
      manifest: {
        project: {id}
      },
      loggedInUser,
      currentProjectToolsProgress,
      translate,
      invalidatedReducer,
      developerMode,
      actions: {
        updateCheckSelection
      },
      selectedCategories,
      availableCategories
    } = this.props;
    const progress = currentProjectToolsProgress[name] ? currentProjectToolsProgress[name] : 0;
    const launchDisableMessage = this.getLaunchDisableMessage(id, developerMode, translate, name, selectedCategories);
    let desc_key = null;
    let showCheckBoxes = false;
    switch (name) {
      case 'wordAlignment':
        desc_key = 'tools.alignment_description';
        break;

      case 'translationWords':
        showCheckBoxes = true;
        desc_key = 'tools.tw_part1_description';
        break;

      default:
        break;
    }
    let descriptionLocalized = description;
    if (desc_key) {
      descriptionLocalized = getTranslation(translate, desc_key, description);
    }

    return (
      <MuiThemeProvider>
        <Card style={{margin: "6px 0px 10px"}}>
          <img
            style={{float: "left", height: "90px", margin: "10px"}}
            src={badgeImagePath}
          />
          <CardHeader
            title={title}
            titleStyle={{fontWeight: "bold"}}
            subtitle={version}
            style={{display: 'flex', justifyContent: 'space-between'}}>
            <ToolCardNotificationBadges toolName={name} invalidatedReducer={invalidatedReducer} />
          </CardHeader><br />
          <ToolCardProgress progress={progress} />
          {showCheckBoxes && <ToolCardBoxes toolName={name} selectedCategories={selectedCategories} checks={availableCategories} onChecked={updateCheckSelection} />}
          {this.state.showDescription ?
            (<div>
              <span style={{fontWeight: "bold", fontSize: "16px", margin: "0px 10px 10px"}}>{translate('tools.description')}</span>
              <p style={{padding: "10px"}}>
                {descriptionLocalized}
              </p>
            </div>) : (<div />)
          }
          <div style={{display: "flex", justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center'}}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <div
                style={{padding: "10px 10px 0px", fontSize: "18px", cursor: "pointer"}}
                onClick={() => this.setState({showDescription: !this.state.showDescription})}
              >
                <span>{this.state.showDescription ? translate('tools.see_less') : translate('tools.see_more')}</span>
                <Glyphicon
                  style={{fontSize: "18px", margin: "0px 0px 0px 6px"}}
                  glyph={this.state.showDescription ? "chevron-up" : "chevron-down"}
                />
              </div>
            </div>
            <GlDropDownList
              translate={translate}
              selectedGL={this.state.selectedGL}
              selectionChange={this.selectionChange}
              bookID={id}
              toolName={name}
            />
            <Hint
              position={'left'}
              size='medium'
              label={launchDisableMessage}
              enabled={launchDisableMessage ? true : false}
            >
              <button
                disabled={launchDisableMessage ? true : false}
                className='btn-prime'
                onClick={() => {this.props.actions.launchTool(folderName, loggedInUser, name)}}
                style={{width: '90px', margin: '10px'}}
              >
                {translate('buttons.launch_button')}
              </button>
            </Hint>
          </div>
        </Card>
      </MuiThemeProvider>
    );
  }
}

ToolCard.propTypes = {
  translate: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    getProjectProgressForTools: PropTypes.func.isRequired,
    setProjectToolGL: PropTypes.func.isRequired,
    launchTool: PropTypes.func.isRequired
  }),
  loggedInUser: PropTypes.bool.isRequired,
  currentProjectToolsProgress: PropTypes.object.isRequired,
  metadata: PropTypes.object.isRequired,
  manifest: PropTypes.object.isRequired,
  invalidatedReducer: PropTypes.object.isRequired,
  developerMode: PropTypes.bool.isRequired,
  selectedCategories: PropTypes.array.isRequired,
  availableCategories: PropTypes.array.isRequired
};

ToolCard.contextTypes = {
  store: PropTypes.any
};

export default connect()(ToolCard);
