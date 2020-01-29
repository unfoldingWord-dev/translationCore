import React from 'react';
import PropTypes from 'prop-types';
import fs from 'fs-extra';
import path from 'path-extra';
import { Card, CardText } from 'material-ui';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
// components
// helpers
import { getTsvOLVersion } from '../../../helpers/originalLanguageResourcesHelpers';
import { getAvailableCategories } from '../../../helpers/ResourcesHelpers';
// constants
import { USER_RESOURCES_PATH, TRANSLATION_NOTES } from '../../../common/constants';
import ToolCard from './ToolCard';

const ToolsCards = ({
  tools,
  actions,
  translate,
  onSelectTool,
  bookName,
  loggedInUser,
  projectSaveLocation,
  manifest,
  // invalidatedReducer,
  toolsCategories,
  originalLanguageBookManifest,
  onMissingResource,
  toggleHomeView,
  sourceContentUpdateCount,
}) => {
  if (!tools || tools.length === 0) {
    return (
      <MuiThemeProvider>
        <Card style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0px 10px', height: '200px',
        }}>
          <CardText style={{ fontWeight: 'bold' }}>
            {translate('tools.no_tools', { app: translate('_.app_name') })}
          </CardText>
        </Card>
      </MuiThemeProvider>
    );
  } else if (bookName.length === 0 && projectSaveLocation === 0) {
    return (
      <MuiThemeProvider>
        <Card style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0px 10px', height: '200px',
        }}>
          <CardText style={{ fontWeight: 'bold' }}>
            {translate('projects.no_project')}
            <span
              style={{ color: 'var(--accent-color-dark)', cursor: 'pointer' }}
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
      <div style={{
        height: '100%', overflowY: 'auto', paddingRight: '10px',
      }}>
        {
          tools.map((tool, i) => {
            const glSelected = manifest.toolsSelectedGLs[tool.name];
            const availableCategories = getAvailableCategories(glSelected, tool.name, projectSaveLocation, { withCategoryName: true });
            let isOLBookVersionMissing = false;
            let missingOLResource = {};

            if (tool.name === TRANSLATION_NOTES) {
              const {
                language_id: languageId,
                resource_id: resourceId,
              } = originalLanguageBookManifest;
              const { tsv_relation } = manifest;
              const tsvOLVersion = getTsvOLVersion(tsv_relation, resourceId);
              const neededOLPath = path.join(USER_RESOURCES_PATH, languageId, 'bibles', resourceId, 'v' + tsvOLVersion);

              if (neededOLPath) {
                isOLBookVersionMissing = tsvOLVersion && !fs.existsSync(neededOLPath);
              }
              missingOLResource = {
                languageId,
                resourceId,
                version: tsvOLVersion,
              };
            }

            return (
              <ToolCard
                key={i}
                tool={tool}
                onSelect={onSelectTool}
                toggleHomeView={toggleHomeView}
                availableCategories={availableCategories}
                selectedCategories={toolsCategories[tool.name] || []}
                translate={translate}
                actions={actions}
                loggedInUser={loggedInUser}
                metadata={{
                  title: tool.title,
                  version: tool.version,
                  description: tool.description,
                  badgeImagePath: tool.badge,
                  folderName: tool.path,
                  name: tool.name,
                }}
                isOLBookVersionMissing={!!isOLBookVersionMissing}
                onMissingResource={() => onMissingResource(missingOLResource)}
                glSelected={glSelected || ''}
                sourceContentUpdateCount={sourceContentUpdateCount}
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
  onSelectTool: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  bookName: PropTypes.string.isRequired,
  loggedInUser: PropTypes.bool.isRequired,
  projectSaveLocation: PropTypes.string.isRequired,
  manifest: PropTypes.object.isRequired,
  toolsCategories: PropTypes.object.isRequired,
  originalLanguageBookManifest: PropTypes.object.isRequired,
  onMissingResource: PropTypes.func.isRequired,
  toggleHomeView: PropTypes.func.isRequired,
  sourceContentUpdateCount: PropTypes.number.isRequired,
};

export default ToolsCards;
