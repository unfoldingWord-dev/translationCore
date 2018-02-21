import React from 'react';
import PropTypes from 'prop-types';
import Konami from 'konami-code-js';
import {connect} from 'react-redux';
// Actions
import {setSetting} from '../actions/SettingsActions';
import {openAlertDialog} from '../actions/AlertModalActions';
import {getSetting} from '../selectors';
import {withLocale} from '../components/Locale';

const developerModeSettingKey = 'developerMode';

class KonamiContainer extends React.Component {

  constructor(props) {
    super(props);
    this.toggleDeveloperMode = this.toggleDeveloperMode.bind(this);
  }

  componentWillMount() {
    // Konami Code ( << Up, Up, Down, Down, Left, Right, Left, Right, B, A >> )
    // This is used to enable or disable developer mode
    this.kc = new Konami(this.toggleDeveloperMode);
  }

  componentWillUnmount() {
    this.kc.disable();
  }

  toggleDeveloperMode() {
    const {developerMode, translate, openAlertDialog, setSetting} = this.props;
    setSetting(developerModeSettingKey, !developerMode);
    if (developerMode) {
      openAlertDialog(translate('developer_mode.disabled'));
    } else {
      openAlertDialog(translate('developer_mode.enabled', {app: translate('_.app_name')}));
    }
  }

  render() {
    return null;
  }
}

KonamiContainer.propTypes = {
  developerMode: PropTypes.bool,
  openAlertDialog: PropTypes.func,
  setSetting: PropTypes.func,
  translate: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  developerMode: getSetting(state, developerModeSettingKey)
});

const mapDispatchToProps = {
  setSetting,
  openAlertDialog
};

export default withLocale(connect(
  mapStateToProps,
  mapDispatchToProps
)(KonamiContainer));
