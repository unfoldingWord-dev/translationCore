import React, { Component } from 'react';
import PropTypes from 'prop-types';
// components
import UserCard from './UserCard';
import ProjectCard from './ProjectCard';
import ToolCard from './ToolCard';
import HomeContainerContentWrapper from '../HomeContainerContentWrapper';

export default class OverviewContainer extends Component {

  constructor(props) {
    super(props);
    this.launchButton = this.launchButton.bind(this);
  }

  /**
  * @description generates the launch button
  * @param {bool} disabled - disable the button
  * @return {component} - component returned
  */
  launchButton(disabled) {
    const {toggleHomeView} = this.props.actions;
    const {translate} = this.props;
    return (
      <button className='btn-prime'
              disabled={disabled}
              onClick={() => toggleHomeView()}>
        {translate('home.overview.launch')}
      </button>
    );
  }

  render() {
    const {translate} = this.props;
    const { currentToolTitle } = this.props.reducers.toolsReducer;
    const launchButtonDisabled = !currentToolTitle;

    const instructions = (
      <div>
        <p>{translate('home.welcome_to_app', { 'app': translate('_.app_name')})}
          <br/>
          {translate('home.overview.to_get_started')}
        </p>
        <ol>
          <li>{translate('home.overview.login')}</li>
          <li>{translate('home.overview.select_project')}</li>
          <li>{translate('home.overview.select_tool')}</li>
          <li>{translate('home.overview.launch')}</li>
        </ol>
      </div>
    );
    return (
      <HomeContainerContentWrapper instructions={instructions}
                                   translate={translate}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <UserCard {...this.props} />
          <ProjectCard {...this.props} />
          <ToolCard {...this.props} />
          <div style={{ textAlign: 'center' }}>
            {this.launchButton(launchButtonDisabled)}
          </div>
        </div>
      </HomeContainerContentWrapper>
    );
  }
}

OverviewContainer.propTypes = {
  reducers: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  translate: PropTypes.func
};
