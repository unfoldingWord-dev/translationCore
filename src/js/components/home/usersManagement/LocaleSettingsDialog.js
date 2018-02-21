import React from 'react';
import PropTypes from 'prop-types';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Dialog from 'material-ui/Dialog';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const DialogActions = ({onClose, onSave, translate}) => (
  <div>
    <button onClick={onClose} className="btn-second">
      {translate('cancel')}
    </button>
    <button onClick={onSave} className="btn-prime">
      {translate('save')}
      </button>
  </div>
);
DialogActions.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired
};

/**
 * The dialog for controlling locale settings within the app
 */
export default class  LocaleSettingsDialog extends React.Component {

  constructor(props) {
    super(props);
    this.handleSave = this.handleSave.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
    this.state = {
      selectedLanguage: props.currentLanguage
    };
  }

  handleSave() {
    const {setActiveLanguage, onClose} = this.props;
    setActiveLanguage(this.state.selectedLanguage);
    onClose();
  }

  handleLanguageChange(language) {
    this.setState({
      selectedLanguage: language
    });
  }

  render() {
    const {
      open=false,
      onClose,
      translate,
      languages
    } = this.props;
    const dialogActions = (
      <DialogActions onClose={onClose}
                     onSave={this.handleSave}
                     translate={translate}/>
    );
    const {selectedLanguage} = this.state;
    return (
      <MuiThemeProvider>
        <Dialog open={open}
                actions={dialogActions}
        >
          <div style={{ padding: '30px'}}>
            <SelectField
              floatingLabelText={translate('locale.app_language')}
              value={selectedLanguage}
              onChange={(e, key, payload) => this.handleLanguageChange(payload)}
            >
              {languages.map((language, key) => {
                return <MenuItem key={key}
                                 value={language.code}
                                 primaryText={language.name}/>;
              })}
            </SelectField>

          </div>
        </Dialog>
      </MuiThemeProvider>
    );
  }
}

LocaleSettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  setActiveLanguage: PropTypes.func.isRequired,
  languages: PropTypes.array.isRequired,
  currentLanguage: PropTypes.string.isRequired
};
