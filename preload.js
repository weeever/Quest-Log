/* ============================================
   QUEST LOG — Electron Preload Script
   Secure bridge between Node.js and renderer
   ============================================ */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('questlog', {
    // IGDB
    igdbQuery: (queryBody) => ipcRenderer.invoke('igdb-query', queryBody),

    // Data persistence
    loadData: () => ipcRenderer.invoke('load-data'),
    saveData: (data) => ipcRenderer.invoke('save-data', data),

    // Export/Import with native dialogs
    exportData: (data) => ipcRenderer.invoke('export-data', data),
    importData: () => ipcRenderer.invoke('import-data'),

    // PC Game Scanner
    scanLocalGames: () => ipcRenderer.invoke('scan-local-games'),

    // Window Controls
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    hideWindowWithAnimation: () => ipcRenderer.invoke('hide-window-with-animation'),

    // Steam & Game Launching
    selectExe: () => ipcRenderer.invoke('select-exe'),
    autoFindExe: (gameName) => ipcRenderer.invoke('auto-find-exe', gameName),
    launchGame: (gameId, exePath) => ipcRenderer.invoke('launch-game', gameId, exePath),
    fetchSteamAchievements: (apiKey, steamId, appId) => ipcRenderer.invoke('fetch-steam-achievements', apiKey, steamId, appId),
    fetchSteamSchema: (apiKey, appId) => ipcRenderer.invoke('fetch-steam-schema', apiKey, appId),
    fetchSteamPlaytime: (apiKey, steamId, appId) => ipcRenderer.invoke('fetch-steam-playtime', apiKey, steamId, appId),
    fetchPublicSteamSchema: (appId) => ipcRenderer.invoke('fetch-public-steam-schema', appId),
    searchSteamAppId: (term) => ipcRenderer.invoke('search-steam-appid', term),
    scanLocalGameSettings: (exePath) => ipcRenderer.invoke('scan-local-game-settings', exePath),
    selectAchievementsJson: () => ipcRenderer.invoke('select-achievements-json'),
    checkGoldbergAchievements: (appId) => ipcRenderer.invoke('check-goldberg-achievements', appId),
    setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
    getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
    onAutoGameDetected: (callback) => ipcRenderer.on('auto-game-detected', (event, gameId) => callback(gameId)),
    onAutoGameClosed: (callback) => ipcRenderer.on('auto-game-closed', (event, gameId) => callback(gameId)),
    onGameClosed: (callback) => ipcRenderer.on('game-closed', (event, gameId) => callback(gameId)),

    // Universal achievements & Overlay
    createOverlay: () => ipcRenderer.invoke('create-overlay'),
    destroyOverlay: () => ipcRenderer.invoke('destroy-overlay'),
    showOverlaySync: (gameName) => ipcRenderer.invoke('show-overlay-sync', gameName),
    showOverlayAchievement: (achievement) => ipcRenderer.invoke('show-overlay-achievement', achievement),
    showOverlayLevelUp: (level) => ipcRenderer.invoke('show-overlay-levelup', level),
    showOverlayGameCompleted: (gameName, achievementName) => ipcRenderer.invoke('show-overlay-gamecompleted', gameName, achievementName),
    checkLocalAchievements: (appId) => ipcRenderer.invoke('check-local-achievements', appId),
    watchLocalAchievements: (appId) => ipcRenderer.invoke('watch-local-achievements', appId),
    stopWatchingLocalAchievements: () => ipcRenderer.invoke('stop-watching-local-achievements'),
    onLocalAchievementsUpdated: (callback) => ipcRenderer.on('local-achievements-updated', (event, unlockedList) => callback(unlockedList)),
    resolveSteamId: (profileInput) => ipcRenderer.invoke('resolve-steam-id', profileInput),
    loadProfile: () => ipcRenderer.invoke('load-profile'),
    saveProfile: (profileData) => ipcRenderer.invoke('save-profile', profileData),
    deleteProfile: () => ipcRenderer.invoke('delete-profile'),
    setDiscordPresence: (gameName, coverUrl, steamAppId) => ipcRenderer.invoke('set-discord-presence', gameName, coverUrl, steamAppId),
    clearDiscordPresence: () => ipcRenderer.invoke('clear-discord-presence'),
    updateDiscordClientId: (clientId) => ipcRenderer.invoke('update-discord-client-id', clientId),
    onDiscordRpcStatus: (callback) => ipcRenderer.on('discord-rpc-status', (event, status, error) => callback(status, error)),

    // Auto-update system
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
    installUpdateNow: () => ipcRenderer.invoke('install-update-now'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, status, info) => callback(status, info)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, percent) => callback(percent)),
    onWindowShown: (callback) => ipcRenderer.on('window-shown', () => callback()),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Platform detection
    isElectron: true
});
