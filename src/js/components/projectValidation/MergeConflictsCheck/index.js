import React, { Component } from 'react';
import PropTypes from 'prop-types';
//components
import { Card } from 'material-ui/Card';
import MergeConflictsCard from './MergeConflictsCard';
const MERGE_CONFLICT_NAMESPACE = "mergeConflictCheck";
//actions
import * as MergeConflictActions from '../../../actions/MergeConflictActions';


class MergeConflictsCheck extends Component {
  constructor(props) {
    super(props);
    this.mergeConflictCards = this.mergeConflictCards.bind(this);
    this.openCard = this.openCard.bind(this);
    this.onCheck = this.onCheck.bind(this);
    this.state = {
      conflictCards: {}
    }
  }

  componentDidMount() {
    this.props.actions.changeProjectValidationInstructions(
      <div>
        <div>Some merge conflicts were found inside of your project.</div>
        <div>Please review and resolve these conflicts before continuing.</div>
      </div>
    )
    const mergeConflictCheckObject = this.props.reducers.projectValidationReducer.projectValidationStepsObject[MERGE_CONFLICT_NAMESPACE];
    let nextButtonEnabled = MergeConflictActions.getNextButtonStatus(mergeConflictCheckObject);
    this.props.actions.toggleNextDisabled(!nextButtonEnabled);
  }

  mergeConflictCards(mergeConflictCheckObject) {
    let allConflictsArray = mergeConflictCheckObject.conflicts;
    let conflictCards = [];
    for (let currentConflictIndex in allConflictsArray) {
      let versions = [];
      let currentConflictObject = allConflictsArray[currentConflictIndex];
      let { chapter } = currentConflictObject[currentConflictIndex];
      let { verses } = currentConflictObject[currentConflictIndex];
      for (let versionIndex in currentConflictObject) {
        if (isNaN(versionIndex)) continue;
        let card = this.state.conflictCards[currentConflictIndex];
        versions.push({
          index: versionIndex,
          textData: currentConflictObject[versionIndex].text,
          checked: currentConflictObject[versionIndex].checked
        })
      }
      let card = this.state.conflictCards[currentConflictIndex];
      conflictCards.push(
        <MergeConflictsCard
          key={`${currentConflictIndex}`}
          chapter={chapter}
          verses={verses}
          mergeConflictIndex={currentConflictIndex}
          versions={versions}
          open={card ? card.open : false}
          onCheck={this.onCheck}
          openCard={this.openCard}
        />
      )
    }
    return conflictCards;
  }

  openCard(index, open) {
    let conflictCards = JSON.parse(JSON.stringify(this.state.conflictCards))
    if (!conflictCards[index]) conflictCards[index] = {};
    conflictCards[index].open = open;
    this.setState({ conflictCards })
  }

  onCheck(mergeConflictIndex, versionIndex, checked) {
    this.props.actions.updateVersionSelection(mergeConflictIndex, versionIndex, checked);
  }

  render() {
    let mergeConflictObject = this.props.reducers.projectValidationReducer.projectValidationStepsObject[MERGE_CONFLICT_NAMESPACE];
    return (
      <Card style={{ width: '100%', height: '100%' }}
        containerStyle={{ overflowY: 'auto', height: '100%' }}>
        {this.mergeConflictCards(mergeConflictObject)}
      </Card>
    );
  }
}

MergeConflictsCheck.propTypes = {
  actions: PropTypes.shape({
    toggleNextDisabled: PropTypes.func.isRequired,
    changeProjectValidationInstructions: PropTypes.func.isRequired,
  }),
  reducers: PropTypes.shape({
    projectValidationReducer: PropTypes.object.isRequired
  })
}

export default MergeConflictsCheck;