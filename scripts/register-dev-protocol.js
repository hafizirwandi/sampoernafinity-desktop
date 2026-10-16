// macOS only routes a custom URL scheme to an app whose Info.plist declares
// it, and the stock Electron.app used by `npm run dev` doesn't. Without this
// the sampoernafinity://oauth-callback link after Google login never reaches
// the dev app. Packaged builds get the scheme from the "protocols" build
// config, so this only patches the dev copy in node_modules. Idempotent.
const { execFileSync } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') process.exit(0);

const SCHEME = process.env.DESKTOP_APP_SCHEME || 'sampoernafinity';
const appPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'Electron.app');
const plist = path.join(appPath, 'Contents', 'Info.plist');
const lsregister =
    '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';

function plistBuddy(command) {
    return execFileSync('/usr/libexec/PlistBuddy', ['-c', command, plist], { stdio: 'pipe' }).toString();
}

let declared = false;
try {
    declared = plistBuddy('Print :CFBundleURLTypes').includes(SCHEME);
} catch {
    // No CFBundleURLTypes yet.
}

if (!declared) {
    try {
        plistBuddy('Add :CFBundleURLTypes array');
    } catch {
        // Array already exists, just without our scheme.
    }
    plistBuddy('Add :CFBundleURLTypes:0 dict');
    plistBuddy(`Add :CFBundleURLTypes:0:CFBundleURLName string ${SCHEME}`);
    plistBuddy('Add :CFBundleURLTypes:0:CFBundleURLSchemes array');
    plistBuddy(`Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string ${SCHEME}`);
}

// Re-register so LaunchServices picks up the scheme right away.
execFileSync(lsregister, ['-f', appPath]);
