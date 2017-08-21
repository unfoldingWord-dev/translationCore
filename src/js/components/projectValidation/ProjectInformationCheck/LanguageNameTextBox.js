/* eslint-disable no-console */
import React from 'react';
import PropTypes from 'prop-types';
// components
import { TextField } from 'material-ui';
import TranslateIcon from 'material-ui/svg-icons/action/translate';

const LanguageNameTextBox = ({
  languageName,
  updateLanguageName
}) => {
  return (
    <div>
      <TextField
        value={languageName}
        style={{ width: '150px' }}
        underlineFocusStyle={{ borderColor: "var(--accent-color-dark)" }}
        floatingLabelStyle={{ color: "var(--text-color-dark)", opacity: "1", fontWeight: "bold" }}
        floatingLabelText={
          <div style={{ width: '200px' }}>
            <TranslateIcon style={{ height: "20px", width: "20px", color: "#000000" }} />&nbsp;
            <span>Language Name</span>&nbsp;
            <span style={{ color: '#800020'}}>*</span>
          </div>
        }
        onChange={e => updateLanguageName(e.target.value)}
        autoFocus={languageName === "" ? true : false }
      />
    </div>
  );
}

LanguageNameTextBox.propTypes = {
  languageName: PropTypes.string.isRequired,
  updateLanguageName: PropTypes.func.isRequired
};

export default LanguageNameTextBox;
