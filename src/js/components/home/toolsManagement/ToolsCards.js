import React from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
// components
import ToolCard from './ToolCard';
import { Card, CardText } from 'material-ui';

/**
 * Renders a list of tools.
 * TODO: rename this to ToolsList and make it a self contained container with supporting components
 * @param tools
 * @param actions
 * @param translate
 * @param bookName
 * @param loggedInUser
 * @param projectSaveLocation
 * @param currentProjectToolsProgress
 * @param manifest
 * @param invalidatedReducer
 * @param developerMode
 * @param selectedCategories
 * @param availableCategories
 * @returns {*}
 * @constructor
 */
const ToolsCards = ({
  tools,
  actions,
  translate,
  bookName,
  loggedInUser,
  projectSaveLocation,
  currentProjectToolsProgress,
  manifest,
  invalidatedReducer,
  developerMode,
  toolsCategories,
  availableCategories
}) => {
  if (!tools || tools.length === 0) {
    return (
      <MuiThemeProvider>
        <Card style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "6px 0px 10px", height: "200px" }}>
          <CardText style={{ fontWeight: "bold" }}>
            {translate('tools.no_tools', {app: translate('_.app_name')})}
          </CardText>
        </Card>
      </MuiThemeProvider>
    );
  } else if (bookName.length === 0 && projectSaveLocation === 0) {
    return (
      <MuiThemeProvider>
        <Card style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "6px 0px 10px", height: "200px" }}>
          <CardText style={{ fontWeight: "bold" }}>
            {translate('projects.no_project')}
            <span
              style={{ color: "var(--accent-color-dark)", cursor: "pointer" }}
              onClick={() => this.props.actions.goToStep(2)}
            >
              &nbsp;{translate('select_project')}&nbsp;
            </span>
          </CardText>
        </Card>
      </MuiThemeProvider>
    );
  } else {
    return (
      <div style={{ height: '100%', overflowY: 'auto', paddingRight: '10px' }}>
        {
          tools.map((tool, i) => {
            return (
              <ToolCard
                availableCategories={availableCategories[tool.name] || []}
                selectedCategories={toolsCategories[tool.name]}
                translate={translate}
                key={i}
                actions={actions}
                loggedInUser={loggedInUser}
                metadata={{
                  title: tool.title,
                  version: tool.version,
                  description: tool.description,
                  badgeImagePath: tool.badge,
                  folderName: tool.path,
                  name: tool.name
                }}
                invalidatedReducer={invalidatedReducer}
                currentProjectToolsProgress={currentProjectToolsProgress}
                manifest={manifest}
                developerMode={developerMode}
              />
            );
          })
        }
      </div>
    );
  }
};

ToolsCards.propTypes = {
  tools: PropTypes.array,
  translate: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  bookName: PropTypes.string.isRequired,
  loggedInUser: PropTypes.bool.isRequired,
  projectSaveLocation: PropTypes.string.isRequired,
  currentProjectToolsProgress: PropTypes.object.isRequired,
  manifest: PropTypes.object.isRequired,
  invalidatedReducer: PropTypes.object.isRequired,
  developerMode: PropTypes.bool.isRequired,
  toolsCategories: PropTypes.object.isRequired,
  availableCategories: PropTypes.object.isRequired,
};

export default ToolsCards;
