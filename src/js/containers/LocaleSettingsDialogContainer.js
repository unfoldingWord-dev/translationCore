import React from 'react';
import PropTypes from 'prop-types';
import BaseDialog from '../components/dialogComponents/BaseDialog';
import { LocaleSelectListContainer } from './Locale';
import { connect } from 'react-redux';
import { setLanguage } from '../actions/LocaleActions';

const styles = {
  container: {
    color: 'var(--text-color-dark)'
  },
  selectContainer: {

    textAlign: 'center'
  },
  select: {
    border: 'solid 1px var(--text-color-dark)',
    borderRadius: '5px'
  },
  selectUnderline: {
    textDecoration: 'none',
    border: 'none'
  }
};

/**
 * Renders a dialog for controlling locale settings within the app.
 *
 * @class
 *
 * @property {bool} open - controls whether the dialog is open or closed.
 * @property {func} onClose - callback when the dialog is closed.
 * @property {func} translate - the localization function
 */
class LocaleSettingsDialogContainer extends React.Component {

  constructor (props) {
    super(props);
    this._handleSave = this._handleSave.bind(this);
    this._handleLanguageChange = this._handleLanguageChange.bind(this);
    this.state = {
      selectedLanguage: null
    };
  }

  componentDidCatch(error, info) {
    console.error(error);
    console.warn(info);
  }

  /**
   * Saves the selected language.
   * @private
   */
  _handleSave () {
    const {setLanguage, onClose} = this.props;
    const {selectedLanguage} = this.state;
    // TRICKY: the initial state is null
    if(selectedLanguage) {
      setLanguage(selectedLanguage);
    }
    onClose();
  }

  /**
   * Stores the current language selection in the component state.
   * @param {string} language - the language code
   * @private
   */
  _handleLanguageChange (language) {
    this.setState({
      selectedLanguage: language
    });
  }

  render () {
    const {
      open = false,
      onClose,
      translate
    } = this.props;

    return (
      <BaseDialog onSubmit={this._handleSave}
                  primaryLabel={translate('save')}
                  secondaryLabel={translate('cancel')}
                  onClose={onClose}
                  title={translate('locale.app_locale')}
                  open={open}>
        <div style={styles.container}>
          <p>
            {translate('locale.change_info')}
          </p>
          <p>
            <i>{translate('locale.change_info_note')}</i>
          </p>
          <div style={styles.selectContainer}>
            <LocaleSelectListContainer onChange={this._handleLanguageChange}/>
          </div>
        </div>
      </BaseDialog>
    );
  }
}

LocaleSettingsDialogContainer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  setLanguage: PropTypes.func
};

const mapDispatchToProps = {
  setLanguage
};

export default connect(null, mapDispatchToProps)(LocaleSettingsDialogContainer);
