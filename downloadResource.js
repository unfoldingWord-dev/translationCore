/**
 * This script updates the resources in a given directory for the given languages
 * Syntax: node scripts/resources/updateResources.js <path to resources> <language> [language...]
 */
require('babel-polyfill'); // required for async/await
const path = require('path-extra');
const fs = require('fs-extra');
const ResourcesDownloadHelpers = require('tc-source-content-updater').resourcesDownloadHelpers;

// console.log('ResourcesDownloadHelpers', ResourcesDownloadHelpers);

/**
 * find resources to update
 * @param {String} downloadUrl - path for resource to download
 * @param {String} destPath - folder to place downloaded resource
 * @param {String} languageId
 * @param {String} resourceId
 * @param {String} version
 * @param {String} subject
 * @return {Boolean} true if success
 */
const getResource = async (downloadUrl, destPath, languageId, resourceId, version, subject) => {
  let success = false;
  const resource = {
    languageId,
    resourceId,
    downloadUrl,
    version,
    subject,
  };
  const downloadErrors = [];

  try {
    await ResourcesDownloadHelpers.downloadAndProcessResource(resource, destPath, downloadErrors)
      .then(() => {
        console.log(`finished getting ${downloadUrl}`);
      });
    success = downloadErrors.length === 0;

    if (!success) {
      console.error('Download failed', { errors: downloadErrors });
    }
    return success;
  } catch (e) {
    const message = `Error getting latest resources: `;
    console.error(message, e);
    return false;
  }
};

/**
 * get last update resources time
 * @param {String} resourcesPath
 * @return {null|Date}
 */
const getResourceUpdateTime = (resourcesPath) => {
  const sourceContentManifestPath = path.join(resourcesPath, 'source-content-updater-manifest.json');
  let manifest = {};

  if (fs.existsSync(sourceContentManifestPath)) {
    manifest = fs.readJSONSync(sourceContentManifestPath);
  }

  if (manifest && manifest.modified) {
    return new Date(manifest.modified);
  }
  return null;
};

/**
 * iterate through process arguments and separate out flags and other parameters
 * @return {{flags: [], otherParameters: []}}
 */
function separateParams() {
  const flags = [];
  const otherParameters = [];

  for (let i = 2, l = process.argv.length; i < l; i++) {
    const param = process.argv[i];

    if (param.substr(0, 1) === '-') { // see if flag
      flags.push(param);
    } else {
      otherParameters.push(param);
    }
  }
  return { flags, otherParameters };
}

/**
 * see if flag is in flags
 * @param {Array} flags
 * @param {String} flag - flag to match
 * @return {Boolean}
 */
function findFlag(flags, flag) {
  const found = flags.find((item) => (item === flag));
  return !!found;
}

// run as main
if (require.main === module) {
  const { flags, otherParameters } = separateParams();

  if (otherParameters.length < 6) {
    console.error('Syntax: node ./updateResources.js [flags] base_url_of_resource destination_folder languageId, resourceId, version');
    console.info(`Examples:`);
    console.info(`  node ./downloadResource.js https://cdn.door43.org ~/resources en ult 18 ult`);
    console.info(`  node ./downloadResource.js https://cdn.door43.org ~/resources en tw 19 bible`);
    console.info(`  node ./downloadResource.js https://cdn.door43.org ~/resources el-x-koine ugnt 0.16 ugnt`);
    return 1;
  }

  const baseUrlOfResource = otherParameters[0];
  const destinationFolder = otherParameters[1];
  const languageId = otherParameters[2];
  const resourceId = otherParameters[3];
  const version = otherParameters[4];
  const resource_name = otherParameters[5];

  const importsFolder = destinationFolder + '/imports';

  let subject = 'Bible';

  switch (resourceId) {
    case 'tw':
      subject = 'Translation_Words';
      break;

    case 'tn':
      subject = 'TSV_Translation_Notes';
      break;

    case 'ta':
      subject = 'Translation_Academy';
      break;

    default:
      subject = 'Bible';
      break;
  };
  console.log(`Using subject ${subject}`);

  try {
    fs.ensureDirSync(destinationFolder);
    fs.ensureDirSync(importsFolder);
  } catch (e) {
    console.error('Could not create folder at: ' + importsFolder , e);
  }

  if (! fs.existsSync(importsFolder)) {
    console.error('Directory does not exist: ' + importsFolder);
    process.exitCode = 1; // set exit error code
    return;
  }

  const urlOfResource = `${baseUrlOfResource}/${languageId}/${resourceId}/v${version}/${resource_name}.zip`;
  console.log(`Downloading: from ${urlOfResource}`);

  getResource(urlOfResource, destinationFolder, languageId, resourceId, version, subject).then(success => {
    process.exitCode = success ? 0 : 1; // set exit code, 0 = no error
  }).catch(err => {
    console.log('error', err);
    process.exitCode = 1;
  });
}
