babel tC_apps --out-dir tC_apps ^
babel src --out-dir src ^
& node scripts/builds/build-win.js ^
& node scripts/builds/build-win-installer.js ^
