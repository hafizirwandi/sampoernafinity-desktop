const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    auth: {
        login: (payload) => ipcRenderer.invoke('auth:login', payload),
        loginWithProvider: (provider) => ipcRenderer.invoke('auth:oauth-start', provider),
        logout: () => ipcRenderer.invoke('auth:logout'),
        getSession: () => ipcRenderer.invoke('auth:session'),
        onOAuthResult: (callback) => {
            const listener = (_event, result) => callback(result);
            ipcRenderer.on('auth:oauth-result', listener);

            return () => ipcRenderer.removeListener('auth:oauth-result', listener);
        },
    },
    tiktok: {
        connect: (username) => ipcRenderer.invoke('tiktok:connect', username),
        disconnect: () => ipcRenderer.invoke('tiktok:disconnect'),
        getStatus: () => ipcRenderer.invoke('tiktok:status'),
        onStatus: (callback) => {
            const listener = (_event, state) => callback(state);
            ipcRenderer.on('tiktok:status', listener);

            return () => ipcRenderer.removeListener('tiktok:status', listener);
        },
    },
    stats: {
        get: (options) => ipcRenderer.invoke('stats:get', options),
    },
    gifts: {
        list: () => ipcRenderer.invoke('gifts:list'),
        sync: () => ipcRenderer.invoke('gifts:sync'),
        onSyncProgress: (callback) => {
            const listener = (_event, progress) => callback(progress);
            ipcRenderer.on('gifts:sync-progress', listener);

            return () => ipcRenderer.removeListener('gifts:sync-progress', listener);
        },
    },
    actions: {
        list: () => ipcRenderer.invoke('actions:list'),
        create: (payload) => ipcRenderer.invoke('actions:create', payload),
        update: (id, payload) => ipcRenderer.invoke('actions:update', id, payload),
        remove: (id) => ipcRenderer.invoke('actions:remove', id),
        duplicate: (id) => ipcRenderer.invoke('actions:duplicate', id),
        run: (id) => ipcRenderer.invoke('actions:run', id),
        pickMedia: (kind) => ipcRenderer.invoke('actions:pick-media', kind),
        onPlayAudioLocal: (callback) => {
            const listener = (_event, payload) => callback(payload);
            ipcRenderer.on('actions:play-audio-local', listener);

            return () => ipcRenderer.removeListener('actions:play-audio-local', listener);
        },
        onSpeakLocal: (callback) => {
            const listener = (_event, payload) => callback(payload);
            ipcRenderer.on('actions:speak-local', listener);

            return () => ipcRenderer.removeListener('actions:speak-local', listener);
        },
    },
    events: {
        list: () => ipcRenderer.invoke('events:list'),
        create: (payload) => ipcRenderer.invoke('events:create', payload),
        update: (id, payload) => ipcRenderer.invoke('events:update', id, payload),
        remove: (id) => ipcRenderer.invoke('events:remove', id),
        duplicate: (id) => ipcRenderer.invoke('events:duplicate', id),
        toggle: (id) => ipcRenderer.invoke('events:toggle', id),
    },
    overlay: {
        getSettings: () => ipcRenderer.invoke('overlay:get-settings'),
        updateSettings: (payload) => ipcRenderer.invoke('overlay:update-settings', payload),
        listScreens: () => ipcRenderer.invoke('overlay:list-screens'),
        addScreen: (name) => ipcRenderer.invoke('overlay:add-screen', name),
        updateScreen: (id, payload) => ipcRenderer.invoke('overlay:update-screen', id, payload),
        removeScreen: (id) => ipcRenderer.invoke('overlay:remove-screen', id),
        onScreenStatus: (callback) => {
            const listener = (_event, status) => callback(status);
            ipcRenderer.on('overlay:screen-status', listener);

            return () => ipcRenderer.removeListener('overlay:screen-status', listener);
        },
    },
    minecraft: {
        getSettings: () => ipcRenderer.invoke('minecraft:get-settings'),
        saveSettings: (payload) => ipcRenderer.invoke('minecraft:save-settings', payload),
        testConnection: () => ipcRenderer.invoke('minecraft:test-connection'),
    },
});
