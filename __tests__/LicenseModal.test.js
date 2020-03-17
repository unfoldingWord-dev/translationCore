/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import LicenseModal from '../src/js/components/home/license/LicenseModal';
import { APP_VERSION } from '../src/js/common/constants';
import { getBuild } from "../src/js/common/env";

describe('LicenseModal component renders correctly', () => {
  test('LicenseModal Component render should match snapshot', () => {
    const closeLicenseModal = jest.fn();
    const modal = shallow(<LicenseModal
      version={`${APP_VERSION} (${getBuild()})`}
      actions={{ closeLicenseModal: closeLicenseModal }}
      showLicenseModal={false}
      translate={k=>k}
    />).dive();

    expect(modal).toMatchSnapshot();
  });
});
