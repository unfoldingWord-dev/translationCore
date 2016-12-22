/**
 * @author Ian Hoegen
 * @description: This is the modal for the drag and drop upload feature.
 ******************************************************************************/
const React = require('react');
const api = window.ModuleApi;

const Button = require('react-bootstrap/lib/Button.js');
const Modal = require('react-bootstrap/lib/Modal.js');
const FormGroup = require('react-bootstrap/lib/FormGroup.js');
const ControlLabel = require('react-bootstrap/lib/ControlLabel.js');
const FormControl = require('react-bootstrap/lib/FormControl.js');

const Actions = require('../../actions');

const SettingsModal = React.createClass({
  close: function() {
    Actions.sendAction('UPDATE_SETTINGS', false);
  },
  changeTutorial: function(e) {
    var chosen = e.target.value;
    if (chosen === 'show') {
      api.setSettings('showTutorial', true);
    } else if (chosen === 'hide'){
      api.setSettings('showTutorial', false);
    }
  },
  changeTextSelect: function(e) {
    var chosen = e.target.value;
    if (chosen === 'drag') {
      api.setSettings('textSelect', 'drag');
    } else if (chosen === 'click'){
      api.setSettings('textSelect', 'click');
    }
  },
  enableDeveloperMode: function(e){
    var chosen = e.target.value;
    if(chosen == 'enable'){
      api.setSettings('developerMode', true);
    } else if(chosen == 'disable'){
      api.setSettings('developerMode', false);
    }
  },
  render: function() {
    var tutorialView = api.getSettings('showTutorial');
    var tutorialSelected = (tutorialView === false) ? 'hide' : 'show';
    var selectMethod = api.getSettings('textSelect');
    var developerMode = api.getSettings('developerMode');
    var developerSelected = (developerMode === true) ? 'enable' : 'disable';
    return (
      <div>
        <Modal show={this.props.show} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormGroup controlId="tutorialView">
              <ControlLabel>Tutorial</ControlLabel>
              <FormControl componentClass="select" placeholder="select" defaultValue={tutorialSelected} onChange={this.changeTutorial}>
                <option value="show">Show</option>
                <option value="hide">Hide</option>
              </FormControl>
            </FormGroup>
            <FormGroup controlId="textSelect">
              <ControlLabel>Text Select Method</ControlLabel>
              <FormControl componentClass="select" placeholder="select" defaultValue={selectMethod} onChange={this.changeTextSelect}>
                <option value="drag">Drag to select</option>
                <option value="click">Click to select</option>
              </FormControl>
            </FormGroup>
            <FormGroup controlId="developerMode">
              <ControlLabel>Enable Developer Mode</ControlLabel>
              <FormControl componentClass="select" placeholder="select" defaultValue={developerSelected} onChange={this.enableDeveloperMode}>
                <option value="disable">Disabled</option>
                <option value="enable">Enabled</option>
              </FormControl>
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = SettingsModal;
