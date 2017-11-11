const gulp = require('gulp');
const mkdirp = require('mkdirp');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const request = require('./scripts/request');
const packager = require('electron-packager');

const BUILD_DIR = 'out/';
const RELEASE_DIR = 'release/';

gulp.task('build', done => {
  let platforms = [];

  if (argv.win) platforms.push('win32');
  if (argv.osx) platforms.push('darwin');
  if (argv.linux) platforms.push('linux');
  if (!platforms.length) platforms.push('win32', 'darwin', 'linux');

  let p = require('./package');
  let ignored = Object.keys(p['devDependencies']).concat([
    '.github',
    'coverage',
    '.idea',
    '__tests__',
    '__mocks__',
    'vendor',
    BUILD_DIR,
    'scripts',
    '\\.'
  ]).map(name => {
    return new RegExp('(^/' + name + '|' + '^/node_modules/' + name + ')');
  });

  packager({
    'asar': true,
    'quiet': true,
    'arch': 'all',
    'platform': platforms,
    'dir': '.',
    'ignore': function (name) {
      for (let i = 0, len = ignored.length; i < len; ++i) {
        if (ignored[i].test(name)) {
          console.log('\t(Ignoring)\t', name);
          return true;
        }
      }

      return false;
    },
    'out': BUILD_DIR,
    'app-version': p.version,
    'icon': './src/images/icon'
  }, () => {
    console.log('Done building...');
    done();
  });
});

gulp.task('release', done => {
  const p = require('./package');
  const archiver = require('archiver');
  const exec = require('child_process').exec;
  const isLinux = /^linux/.test(process.platform);

  let promises = [];
  let platforms = [];
  const gitVersion = '2.9.2';

  if (argv.win) platforms.push('win32', 'win64');
  if (argv.win32) platforms.push('win32');
  if (argv.win64) platforms.push('win64');
  if (argv.osx) platforms.push('darwin');
  if (argv.linux) platforms.push('linux');
  if (!platforms.length) platforms.push('win32', 'win64', 'darwin', 'linux');

  /**
   *
   * @param version 2.9.2
   * @param arch 64|32
   * @returns {Promise}
   */
  const downloadGit = function(version, arch) {
    let url = `https://github.com/git-for-windows/git/releases/download/v${version}.windows.1/Git-${version}-${arch}-bit.exe`;
    let dir = './vendor';
    let dest = dir + `/Git-${version}-${arch}-bit.exe`;
    mkdirp.sync(dir);
    if(!fs.existsSync(dest)) {
      console.log(`Downloading git ${version} for ${arch} bit from ${url}`);
      return request.download(url, dest);
    } else {
      console.log('Using cached git installer');
      return Promise.resolve();
    }
  };

  /**
   * This depends on first installing InnoSetup. On linux run ./scripts/innosetup/setup.sh
   * On windows download and install from http://www.jrsoftware.org/isinfo.php
   *
   * @param arch 64|32
   * @param os
   * @returns {Promise}
   */
  const releaseWin = function(arch, os) {
    let isccPath;
    if(isLinux) {
      isccPath = './scripts/innosetup/iscc';
    } else if(/^win/.test(process.platform)) {
      isccPath = `"${process.env['ProgramFiles(x86)']}/Inno Setup 5/ISCC.exe"`;
    } else {
      return Promise.reject('Windows builds can only be released on linux and windows');
    }

    // on windows you can manually install Inno Setup
    // on linux you can execute ./scripts/innosetup/setup.sh
    if(!fs.existsSync(isccPath.replace(/"/g, ''))) {
      return Promise.reject('Inno Setup is not installed. Please install Inno Setup and try again.');
    }

    // TRICKY: the iss script cannot take the .exe extension on the file name
    let file = `translationCore-win-x${arch}-${p.version}.setup`;
    let cmd = `${isccPath} scripts/win_installer.iss /DArch=${arch === '64' ? 'x64' : 'x86'} /DRootPath=../ /DVersion=${p.version} /DGitVersion=${gitVersion} /DDestFile=${file} /DDestDir=${RELEASE_DIR} /DBuildDir=${BUILD_DIR} /q`;
    return new Promise(function(resolve, reject) {
      console.log(`Generating ${arch} bit windows installer`);
      console.log(`executing: \n${cmd}\n`);
      exec(cmd, function(err, stdout, stderr) {
        if(err) {
          console.error(err);
          resolve({
            os: os,
            status: 'error',
            path: null
          });
        } else {
          resolve({
            os: 'win' + arch,
            status: 'ok',
            path: RELEASE_DIR + file + '.exe'
          });
        }
      });
    });
  };

  mkdirp('release', function() {
    for(let os of platforms) {
      switch (os) {
        case 'win32':
          if (fs.existsSync(BUILD_DIR + p.name + '-win32-ia32/')) {
            promises.push(downloadGit(gitVersion, '32')
              .then(releaseWin.bind(undefined, '32', os)));
          } else {
            promises.push(Promise.resolve({
              os: os,
              status: 'missing',
              path: null
            }));
          }
          break;
        case 'win64':
          if (fs.existsSync(BUILD_DIR + p.name + '-win32-x64/')) {
            promises.push(downloadGit(gitVersion, '64')
              .then(releaseWin.bind(undefined, '64', os)));
          } else {
            promises.push(Promise.resolve({
              os: os,
              status: 'missing',
              path: null
            }));
          }
          break;
        case 'darwin':
          if (isLinux && fs.existsSync(BUILD_DIR + p.name + '-darwin-x64/')) {
            promises.push(new Promise(function (os, resolve, reject) {
              let src = `out/${p.name}-darwin-x64`;
              let dest = `${RELEASE_DIR}translationCore-macos-x64-${p.version}.dmg`;
              let cmd = `scripts/osx/makedmg.sh "${p.name}" ${src} ${dest}`;

              exec(cmd, function(err, stdout, stderr) {
                if(err) {
                  console.log(err);
                  resolve({
                    os: os,
                    status: 'error',
                    path: null
                  });
                } else {
                  resolve({
                    os: os,
                    status: 'ok',
                    path: dest
                  });
                }
              });
            }.bind(undefined, os)));
          } else {
            if(!isLinux) console.log('You must be on linux to create macOS releases');
            promises.push(Promise.resolve({
              os: os,
              status: 'missing',
              path: null
            }));
          }
          break;
        case 'linux':
          if (isLinux && fs.existsSync(BUILD_DIR + p.name + '-linux-x64/')) {
            promises.push(new Promise(function (os, resolve, reject) {
              let dest = `${RELEASE_DIR}translationCore-linux-x64-${p.version}.zip`;
              try {
                let output = fs.createWriteStream(dest);
                output.on('close', function () {
                  resolve({
                    os: os,
                    status: 'ok',
                    path: dest
                  });
                });
                let archive = archiver.create('zip');
                archive.on('error', reject);
                archive.pipe(output);
                archive.directory(BUILD_DIR + p.name + '-linux-x64/', p.name);
                archive.finalize();
              } catch (e) {
                console.error(e);
                resolve({
                  os: os,
                  status: 'error',
                  path: null
                });
              }
            }.bind(undefined, os)));
          } else {
            if(!isLinux) console.log('You must be on linux to create linux releases');
            promises.push(Promise.resolve({
              os: os,
              status: 'missing',
              path: null
            }));
          }
          break;
        default:
          console.warn('No release procedure has been defined for ' + os);
      }
    }
    Promise.all(promises).then(function() {
      done();
    }).catch(done);
  });
});