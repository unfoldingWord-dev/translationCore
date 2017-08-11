import React, { Component } from 'react';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';

class VersionCard extends Component {

  getTextObjectSection(verseData) {
    return Object.keys(verseData).map((verseNumber) => {
      return (
        <div style={{ fontSize: 14 }} key={verseNumber}>
          <b>{verseNumber}</b>: {verseData[verseNumber]}
        </div>
      )
    })
  }

  render() {
    let {checked, index, mergeConflictIndex, textData } = this.props;
    return (
      <div style={{ borderBottom: '1px solid black' }}>
        <div style={{ padding: 15 }}>
          <RadioButton
            checked={checked}
            label={`Version ${Number(index) + 1}`}
            onCheck={() => this.props.onCheck(mergeConflictIndex, index, true)}
          />
          {this.getTextObjectSection(textData)}
        </div>
      </div>
    );
  }
}

export default VersionCard;