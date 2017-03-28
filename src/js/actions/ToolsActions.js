import consts from './CoreActionConsts';
import path from 'path-extra';
import fs from 'fs-extra';
import CheckDataGrabber from '../components/core/create_project/CheckDataGrabber.js';
import modalActions from './ModalActions.js';
import LoaderActions from './LoaderActions.js';
const api = window.ModuleApi;
const PACKAGE_SUBMODULE_LOCATION = path.join(window.__base, 'tC_apps');

module.exports.loadTool = function(folderName) {
  return ((dispatch, getState) => {
    /*this CheckDataGrabber functioncall will have to change in
    order for us to fully implement redux*/
    dispatch(modalActions.showModalContainer(false));
    CheckDataGrabber.loadModuleAndDependencies(folderName, (err, success) => {
      if (!err) {
        localStorage.setItem('lastCheckModule', folderName);
        dispatch({
          type: consts.LOAD_TOOL,
          val: true
        });
        dispatch({type: consts.SHOW_MODAL_CONTAINER, visible: false});
      }
    }, (data, key) => {
      dispatch(LoaderActions.sendProgressForKey(key, data, getState().loaderReducer));
    });
  });
};

module.exports.getToolsMetadatas = function() {
  return ((dispatch) => {
    getDefaultModules((moduleFolderPathList) => {
      fillDefaultModules(moduleFolderPathList, (metadatas) => {
        sortMetadatas(metadatas);
        api.putToolMetaDatasInStore(metadatas);
        dispatch({
          type: consts.GET_TOOLS_METADATAS,
          val: metadatas
        });
      });
    });
  });
};

const getDefaultModules = (callback) => {
  var defaultModules = [];
  fs.ensureDirSync(PACKAGE_SUBMODULE_LOCATION);
  var moduleBasePath = PACKAGE_SUBMODULE_LOCATION;
  fs.readdir(moduleBasePath, function(error, folders) {
    if (error) {
      console.error(error);
    } else {
      for (var folder of folders) {
        try {
          var manifestPath = path.join(moduleBasePath, folder, 'package.json');
          var packageJson = require(manifestPath);
          var installedPackages = fs.readdirSync(moduleBasePath);
          if (packageJson.display === 'app') {
            var dependencies = true;
            for (var app in packageJson.include) {
              if (!installedPackages.includes(app)) {
                dependencies = false;
              }
            }
            if (dependencies) {
              defaultModules.push(manifestPath);
            }
          }
        } catch (e) {
        }
      }
    }
    callback(defaultModules);
  });
};

const sortMetadatas = (metadatas) => {
  metadatas.sort((a, b) => {
    return a.title < b.title ? -1 : 1;
  });
};

const fillDefaultModules = (moduleFilePathList, callback) => {
  var tempMetadatas = [];
  //This makes sure we're done with all the files first before we call the callback
  var totalFiles = moduleFilePathList.length,
    doneFiles = 0;
  function onComplete() {
    doneFiles++;
    if (doneFiles === totalFiles) {
      callback(tempMetadatas);
    }
  }
  for (let filePath of moduleFilePathList) {
    fs.readJson(filePath, (error, metadata) => {
      if (error) {
        console.error(error);
      } else {
        metadata.folderName = path.dirname(filePath);
        metadata.imagePath = path.resolve(filePath, '../icon.png');
        metadata.badgeImagePath = path.resolve(filePath, '../badge.png');
        tempMetadatas.push(metadata);
      }
      onComplete();
    });
  }
};
