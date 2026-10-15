const { app, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

// Two layers keep installs current:
//  1. electron-updater polls <server>/downloads/desktop/latest.yml, downloads
//     new builds in the background, and installs them on quit (or right away
//     when the user clicks "Restart").
//  2. The server can declare a minimum version. Anything older gets a 426
//     from the API (or sees min_version from /api/app/version) and the
//     renderer swaps to a blocking "update required" screen.
//
// A restart mid-stream would kill overlays, sounds and TTS, so a voluntary
// install is refused while a TikTok Live connection is active; it still
// lands automatically the next time the app is closed.

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

let getWebContents = () => null;
let apiBaseUrl = '';
let feedUrl = '';
let downloadPageUrl = '';
let checkTimer = null;

let state = {
    currentVersion: app.getVersion(),
    // idle | checking | available | downloading | downloaded | not-available | error | unsupported
    status: 'idle',
    latestVersion: null,
    progress: 0,
    error: null,
    required: false,
    minVersion: null,
    liveActive: false,
};

function setState(next) {
    state = { ...state, ...next };
    getWebContents()?.send('updater:state', state);
}

function getState() {
    return state;
}

// Plain numeric compare (1.10.0 > 1.9.3); pre-release suffixes are ignored.
function compareVersions(a, b) {
    const parse = (v) => String(v).replace(/^v/i, '').split(/[-+]/)[0].split('.').map((n) => parseInt(n, 10) || 0);
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

function markRequired({ minVersion, downloadUrl } = {}) {
    if (downloadUrl) downloadPageUrl = downloadUrl;
    if (state.required && state.minVersion === (minVersion || state.minVersion)) return;

    setState({ required: true, minVersion: minVersion || state.minVersion });

    // A forced update shouldn't wait for the next poll.
    checkForUpdates();
}

async function checkMinimumVersion() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/app/version`, {
            headers: { Accept: 'application/json', 'X-App-Version': app.getVersion() },
        });
        if (!response.ok) return;

        const body = await response.json();
        if (body.download_url) downloadPageUrl = body.download_url;

        if (body.min_version && compareVersions(app.getVersion(), body.min_version) < 0) {
            markRequired({ minVersion: body.min_version, downloadUrl: body.download_url });
        } else if (state.required) {
            // Minimum was lowered again server-side (e.g. set by mistake).
            setState({ required: false, minVersion: body.min_version || null });
        }
    } catch {
        // Server unreachable — the API calls themselves will surface that.
    }
}

async function checkForUpdates() {
    // electron-updater only works from an installed build; in `npm run dev`
    // the min-version gate still runs, but downloading is left to the
    // manual download button.
    if (!app.isPackaged) {
        setState({ status: 'unsupported' });
        return;
    }

    if (['checking', 'downloading', 'downloaded'].includes(state.status)) return;

    try {
        await autoUpdater.checkForUpdates();
    } catch (error) {
        setState({ status: 'error', error: error?.message || String(error) });
    }
}

function wireAutoUpdater() {
    autoUpdater.logger = console;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });

    autoUpdater.on('checking-for-update', () => setState({ status: 'checking', error: null }));
    autoUpdater.on('update-available', (info) => setState({ status: 'available', latestVersion: info.version, progress: 0 }));
    autoUpdater.on('update-not-available', () => setState({ status: 'not-available' }));
    autoUpdater.on('download-progress', (p) => setState({ status: 'downloading', progress: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (info) => setState({ status: 'downloaded', latestVersion: info.version, progress: 100 }));
    autoUpdater.on('error', (error) => setState({ status: 'error', error: error?.message || String(error) }));
}

function setLiveActive(active) {
    if (state.liveActive !== active) setState({ liveActive: active });
}

function install() {
    if (state.status !== 'downloaded') return { ok: false, reason: 'not-ready' };
    // A forced update wins over the live guard: the old build can't talk to
    // the API anymore anyway.
    if (state.liveActive && !state.required) return { ok: false, reason: 'live' };

    // Silent NSIS install, then relaunch the app.
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return { ok: true };
}

function openDownloadPage() {
    return shell.openExternal(downloadPageUrl || `${apiBaseUrl}/download`);
}

function start(options) {
    getWebContents = options.getWebContents;
    apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '');
    feedUrl = options.feedUrl || `${apiBaseUrl}/downloads/desktop`;
    downloadPageUrl = `${apiBaseUrl}/download/windows`;

    if (app.isPackaged) wireAutoUpdater();

    const runChecks = () => {
        checkMinimumVersion();
        checkForUpdates();
    };

    runChecks();
    clearInterval(checkTimer);
    checkTimer = setInterval(runChecks, CHECK_INTERVAL_MS);
}

module.exports = { start, getState, markRequired, setLiveActive, checkForUpdates, install, openDownloadPage };
