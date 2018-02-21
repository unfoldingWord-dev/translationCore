/* eslint-env jest */
import React from 'react';
import {shallow, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import CheckSoftwareUpdatesDialog, {
  STATUS_LOADING, STATUS_OK,
  STATUS_UPDATE, STATUS_ERROR
} from '../src/js/components/dialogComponents/SoftwareUpdateDialog';
import {getUpdateAsset} from '../src/js/containers/SoftwareUpdateDialog/SoftwareUpdateDialogContainer';

describe('Get update asset', () => {
  it('cannot find an update', () => {
    const response = {
      tag_name: '0.0.1',
      assets: [{
        name: 'translationCore-linux-x64-2.0.0.zip'
      }]
    };
    const expectedUpdate = null;
    const update = getUpdateAsset(response, '1.0.0', 'x64', 'linux');
    expect(update).toEqual(expectedUpdate);
  });

  it('cannot find an asset for the system', () => {
    const response = {
      tag_name: '2.0.0',
      assets: [{
        name: 'translationCore-linux-x64-2.0.0.zip'
      }]
    };
    const expectedUpdate = null;
    const update = getUpdateAsset(response, '1.0.0', 'x64', 'darwin');
    expect(update).toEqual(expectedUpdate);
  });

  it('finds an update', () => {
    const response = {
      extra_info: 'foo',
      tag_name: '2.0.0',
      assets: [{
        extra_info: 'bar',
        name: 'translationCore-linux-x64-2.0.0.zip'
      }]
    };
    const expectedUpdate = {
      extra_info: 'bar',
      installed_version: '1.0.0',
      name: 'translationCore-linux-x64-2.0.0.zip',
      latest_version: '2.0.0'
    };
    const update = getUpdateAsset(response, '1.0.0', 'x64', 'linux');
    expect(update).toEqual(expectedUpdate);
  });

  it('finds a legacy windows update', () => {
    const response = {
      extra_info: 'foo',
      tag_name: 'v0.7.0',
      assets: [{
        extra_info: 'bar',
        name: 'translationCoreSetup.exe'
      }]
    };
    const expectedUpdate = {
      extra_info: 'bar',
      installed_version: '0.6.0',
      name: 'translationCoreSetup.exe',
      latest_version: 'v0.7.0'
    };
    const update = getUpdateAsset(response, '0.6.0', 'x64', 'win32');
    expect(update).toEqual(expectedUpdate);
  });

  it('finds a legacy macOS update', () => {
    const response = {
      extra_info: 'foo',
      tag_name: 'v0.7.0',
      assets: [{
        extra_info: 'bar',
        name: 'translationCore-0.7.0.dmg'
      }]
    };
    const expectedUpdate = {
      extra_info: 'bar',
      installed_version: '0.6.0',
      name: 'translationCore-0.7.0.dmg',
      latest_version: 'v0.7.0'
    };
    const update = getUpdateAsset(response, '0.6.0', 'x64', 'darwin');
    expect(update).toEqual(expectedUpdate);
  });
});

describe('CheckSoftwareUpdateDialog state', () => {
  beforeAll(() => {
    configure({adapter: new Adapter()});
  });

  // TRICKY: we are unable to test button state with the 0.x material-ui library

  it('displays loading by default', () => {
    const mockClose = jest.fn();
    const mockSubmit = jest.fn();
    const dialog = shallow(
      <CheckSoftwareUpdatesDialog open={true}
                                  translate={k=>k}
                                  onSubmit={mockSubmit}
                                  onClose={mockClose}
                                  status={STATUS_LOADING}/>
    );
    const message = dialog.find('#message');
    expect(message.text()).toEqual(expect.stringContaining('loading'));
    // TODO: ensure only primary button is visible and disabled
  });

  it('displays up to date', () => {
    const mockClose = jest.fn();
    const mockSubmit = jest.fn();
    const dialog = shallow(
      <CheckSoftwareUpdatesDialog open={true}
                                  translate={k=>k}
                                  onSubmit={mockSubmit}
                                  onClose={mockClose}
                                  status={STATUS_OK}/>
    );
    const message = dialog.find('#message');
    expect(message.text()).toEqual(expect.stringContaining('up_to_date'));
    // TODO: ensure only primary button is visible and enabled
  });

  it('displays error', () => {
    const mockClose = jest.fn();
    const mockSubmit = jest.fn();
    const dialog = shallow(
      <CheckSoftwareUpdatesDialog open={true}
                                  translate={k=>k}
                                  onSubmit={mockSubmit}
                                  onClose={mockClose}
                                  status={STATUS_ERROR}/>
    );
    const message = dialog.find('#message');
    expect(message.text()).toEqual(expect.stringContaining('error'));
    // TODO: ensure only primary button is visible and enabled
  });

  it('displays update available', () => {
    const mockClose = jest.fn();
    const mockSubmit = jest.fn();
    const update = {
      installed_version: '1.0.0',
      latest_version: '2.0.0',
      size: 100000
    };
    const dialog = shallow(
      <CheckSoftwareUpdatesDialog open={true}
                                  translate={k=>k}
                                  update={update}
                                  onSubmit={mockSubmit}
                                  onClose={mockClose}
                                  status={STATUS_UPDATE}/>
    );
    const message = dialog.find('#message');
    expect(message.text()).toEqual(expect.stringContaining('update_available'));
    // TODO: ensure secondary and primary button is visible and enabled
  });
});
