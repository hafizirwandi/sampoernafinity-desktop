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
    },
});
