/* eslint-env jest */
import React from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import ProjectCardMenu from '../src/js/components/home/projectsManagement/ProjectCardMenu';
import renderer from 'react-test-renderer';

// Tests for ProjectCardMenu React Component
describe('Test ProjectCardMenu component', () => {
  it('Should match snapshot with required props', () => {
    let props = {
      projectSaveLocation: '',
      actions: {},
      user: {}
    };
    const renderedValue = renderer.create(
      <MuiThemeProvider>
        <ProjectCardMenu {...props} />
      </MuiThemeProvider>
    ).toJSON();
    expect(renderedValue).toMatchSnapshot();
  });

});