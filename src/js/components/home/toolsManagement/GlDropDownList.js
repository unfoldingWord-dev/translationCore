import React from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
// helpers
import { getLanguageTranslation } from '../../../helpers/localizationHelpers';

/**
 * With the `maxHeight` property set, the Select Field will be scrollable
 * if the number of items causes the height to exceed this limit.
 */
const GlDropDownList = ({
  selectedGL,
  selectionChange,
  translate,
  gatewayLanguageList,
}) => {
  const GLs = [];
  let disabled = false;

  if (gatewayLanguageList && gatewayLanguageList.length) {
    gatewayLanguageList.forEach(item => {
      const languageLocalized = getLanguageTranslation(translate, item['name'], item['lc']);
      const primaryText = <span style={{ height: '18px' }}>{languageLocalized}</span>;
      GLs.push(<MenuItem value={item['lc']} key={item['lc']} primaryText={primaryText}/>);
    });
  } else { // no valid languages
    const invalidCode = '  ';
    GLs.push(<MenuItem value={invalidCode} key={invalidCode} primaryText={translate('tools.no_gl_available')}/>);
    selectedGL = invalidCode;
    disabled = true;
  }

  const floatingLabelText = selectedGL ? translate('tools.gateway_language') : translate('tools.select_gateway_language');

  return (
    <SelectField
      id='glddl'
      maxHeight={150}
      value={selectedGL}
      disabled={disabled}
      floatingLabelStyle={{ color: '#000000' }}
      floatingLabelText={floatingLabelText}
      underlineFocusStyle={{ borderColor: 'var(--accent-color-dark)' }}
      onChange={(event, index, value) => selectionChange(value)}
    >
      {GLs}
    </SelectField>
  );
};

GlDropDownList.propTypes = {
  translate: PropTypes.func.isRequired,
  selectedGL: PropTypes.string.isRequired,
  selectionChange: PropTypes.func.isRequired,
  gatewayLanguageList: PropTypes.array.isRequired,
};

export default GlDropDownList;
