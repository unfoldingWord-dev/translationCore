import React from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
import { getGatewayLanguageList, DEFAULT_GATEWAY_LANGUAGE } from '../../../helpers/gatewayLanguageHelpers';
import {getLanguageTranslation} from "../../../helpers/localizationHelpers";

/**
 * With the `maxHeight` property set, the Select Field will be scrollable
 * if the number of items causes the height to exceed this limit.
 */
const GlDropDownList = ({
  selectedGL,
  selectionChange,
  bookID,
  translate,
  toolName
}) => {
  const GLs = [];
  getGatewayLanguageList(bookID, toolName).forEach(item => {
    const languageLocalized = getLanguageTranslation(translate, item['name'], item['lc']);
    const primaryText= <span style={{ height: '18px'}}>{languageLocalized}</span>;
    GLs.push(<MenuItem value={item['lc']} key={item['lc']} primaryText={primaryText} />);
  });
  if (!selectedGL) {
    selectedGL = DEFAULT_GATEWAY_LANGUAGE;
  }
  return (
    <SelectField
      floatingLabelText={translate('tools.gateway_language')}
      floatingLabelStyle={{ color: '#000000' }}
      value={selectedGL}
      onChange={ (event, index, value) => selectionChange(value) }
      maxHeight={150}
      id='glddl'
    >
      {GLs}
    </SelectField>
  );
};

GlDropDownList.propTypes = {
  selectedGL: PropTypes.string,
  selectionChange: PropTypes.func.isRequired,
  bookID: PropTypes.string,
  translate: PropTypes.func.isRequired,
  toolName: PropTypes.string
};

export default GlDropDownList;
