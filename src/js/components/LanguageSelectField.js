import React from 'react';
import PropTypes from 'prop-types';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

/**
 * Represents a select field for languages
 * @param {string} selectedLanguageCode the language code that is currently selected
 * @param {array} languages an array of language objects with a code and name.
 * @param {func} onChange the call back when an item is chosen.
 * @return {*}
 * @constructor
 */
const LanguageSelectField = ({selectedLanguageCode, languages, onChange}) => (
  <SelectField
    value={selectedLanguageCode}
    style={{
      border: 'solid 1px var(--text-color-dark)',
      borderRadius: '5px',
      textAlign: 'center'
    }}
    underlineStyle={{
      textDecoration: 'none',
      border: 'none',
      color: 'var(--text-color-dark)'
    }}
    onChange={(e, key, payload) => onChange(payload)}>
    {languages.map((language, key) => {
      return <MenuItem key={key}
                       value={language.code}
                       primaryText={language.name}/>;
    })}
  </SelectField>
);
LanguageSelectField.propTypes = {
  selectedLanguageCode: PropTypes.string.isRequired,
  languages: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
};
export default LanguageSelectField;
