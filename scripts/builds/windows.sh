cp ./scripts/builds/index.js ./src/js/pages/index.js
cp ./scripts/builds/index.html ./index.html
babel src --out-dir src
babel tC_apps --out-dir tC_apps
node scripts/builds/build-win.js
unset DISPLAY
VERSION="0.0.0"
if [ -z ${TRAVIS_BRANCH+x} ]; then VERSION=$TRAVIS_BRANCH; else echo "Using default version 0.0.0"; fi
echo $VERSION
wine "C:\inno\ISCC.exe" ".\scripts\inno\windows.iss" "/Qp" "/DVersion=$VERSION"