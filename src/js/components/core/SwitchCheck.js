const React = require('react');
const Path = require('path');
const pathex = require('path-extra');
const PARENT = pathex.datadir('translationCore');
const PACKAGE_COMPILE_LOCATION = pathex.join(PARENT, 'packages-compiled')
const PACKAGE_SUBMODULE_LOCATION = pathex.join(window.__base, 'tC_apps');

const api = window.ModuleApi;
const fs = require(window.__base + 'node_modules/fs-extra');
const AppDescription = require('./AppDescription');

const CoreStore = require('../../stores/CoreStore.js');
const CoreActions = require('../../actions/CoreActions.js');
const CheckDataGrabber = require('./create_project/CheckDataGrabber.js');

class SwitchCheck extends React.Component{
  render() {
    var buttons = [];
    if(this.props.moduleMetadatas.length == 0) {
      return <div>No tC default modules found.</div>;
    } else if (!api.getDataFromCommon('saveLocation') || !api.getDataFromCommon('tcManifest')) {
      return <h3 style={{color: 'white', textAlign: 'center', fontWeight: 'bold', margin: '55px 0'}}>Please <a> load a project </a> before choosing a tool</h3>;

    }
    else {
      for (var i in this.props.moduleMetadatas) {
        const metadata = this.props.moduleMetadatas[i];
        buttons.push(<AppDescription key={i}
                                     metadata={metadata}
                                     useApp={this.props.moduleClick}
                     />)
      }
    }
    return (
      <div>
          {buttons}
      </div>
    );
  }
}
module.exports = SwitchCheck;
