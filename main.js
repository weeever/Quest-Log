/* ============================================
   QUEST LOG — Electron Main Process
   IGDB Proxy + File-based Save + Window
   ============================================ */

const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const RPC = require('discord-rpc');

// Configure auto updater properties
autoUpdater.logger = console;
autoUpdater.autoDownload = false; // Nice interactive download popup
autoUpdater.allowPrerelease = true; // Allow detecting beta / pre-release updates on GitHub

// ---------- Single Instance Lock ----------
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

function showMainWindow() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        try {
            mainWindow.webContents.send('window-shown');
        } catch (e) {}
    }
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
    showMainWindow();
});

// ---------- Discord RPC Config ----------
const DISCORD_CLIENT_ID = '1523420200081428711'; // Quest Log Discord App ID
let rpcClient = null;

// ---------- IGDB Config ----------
const IGDB_CLIENT_ID = 'lcdlmmo05qtixyxlatz4r9e7y2xmnh';
const IGDB_CLIENT_SECRET = 'dcbit3j5hmwt7jocsl6b0grs6mp881';
let igdbToken = null;
let igdbTokenExpiry = 0;

// ---------- Paths ----------
const SAVE_FILE = path.join(app.getPath('userData'), 'questlog_data.json');
const PROFILE_FILE = path.join(app.getPath('userData'), 'questlog_profile.dat');

// ---------- Window & Tray ----------
let mainWindow;
let overlayWindow = null;
let isOverlayLoaded = false;
let pendingSyncGameName = null;
let tray = null;
let isQuitting = false;

function createWindow() {
    const startMinimized = process.argv.includes('--hidden') || process.argv.includes('-s');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Quest Log',
        icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#0a0a0f',
        frame: false,
        show: false, // Don't show immediately to prevent flash and allow background start
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    mainWindow.loadFile('index.html');

    // Show window only when ready (if not starting minimized)
    mainWindow.once('ready-to-show', () => {
        if (!startMinimized) {
            mainWindow.show();
        } else {
            console.log('Quest Log started minimized in tray.');
        }
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Intercept close to minimize to tray
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, 'icon.png');
        if (fs.existsSync(iconPath)) {
            const image = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
            tray = new Tray(image);
        } else {
            tray = new Tray(nativeImage.createEmpty());
        }

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Afficher Quest Log', click: () => showMainWindow() },
            { type: 'separator' },
            { label: 'Quitter', click: () => {
                isQuitting = true;
                app.quit();
            }}
        ]);

        tray.setToolTip('Quest Log — Backlog Tracker');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            showMainWindow();
        });
    } catch (e) {
        console.error('Failed to create tray:', e);
    }
}

// ---------- IGDB Token ----------
function getIgdbToken() {
    return new Promise((resolve, reject) => {
        if (igdbToken && Date.now() < igdbTokenExpiry) {
            return resolve(igdbToken);
        }

        const postData = `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
        const req = https.request('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token) {
                        igdbToken = parsed.access_token;
                        igdbTokenExpiry = Date.now() + (parsed.expires_in - 60) * 1000;
                        resolve(igdbToken);
                    } else {
                        reject(new Error('No access_token in response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// ---------- IGDB Query ----------
function igdbQuery(queryBody) {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getIgdbToken();
            const bodyBuffer = Buffer.from(queryBody, 'utf-8');

            const req = https.request('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain',
                    'Content-Length': bodyBuffer.length
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error('Failed to parse IGDB response'));
                        }
                    } else {
                        // Token might be expired, clear it
                        if (res.statusCode === 401) {
                            igdbToken = null;
                            igdbTokenExpiry = 0;
                        }
                        reject(new Error(`IGDB returned ${res.statusCode}: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(bodyBuffer);
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

// ---------- File Save/Load ----------
function loadData() {
    try {
        if (fs.existsSync(SAVE_FILE)) {
            const raw = fs.readFileSync(SAVE_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }
    return null;
}

function saveData(data) {
    try {
        const dir = path.dirname(SAVE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        // Strip profile data from main JSON to ensure it is only kept in the encrypted file
        const dataCopy = { ...data };
        delete dataCopy.profile;
        fs.writeFileSync(SAVE_FILE, JSON.stringify(dataCopy, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('Failed to save data:', e);
        return false;
    }
}

// ---------- Profile Encryption & Anti-Cheat ----------
const SECRET_SALT = 'QuestLogRPGSecretSaltKey2026';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync(SECRET_SALT, 'salt', 32);

function encryptData(dataString) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptData(encryptedString) {
    try {
        const parts = encryptedString.split(':');
        if (parts.length < 2) return null;
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
}

function loadProfile() {
    try {
        if (fs.existsSync(PROFILE_FILE)) {
            const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
            const decrypted = decryptData(raw);
            if (decrypted) {
                return JSON.parse(decrypted);
            }
        }
    } catch (e) {
        console.error('Failed to load profile:', e);
    }
    return null;
}

function saveProfile(profileData) {
    try {
        const dir = path.dirname(PROFILE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const jsonStr = JSON.stringify(profileData);
        const encrypted = encryptData(jsonStr);
        fs.writeFileSync(PROFILE_FILE, encrypted, 'utf-8');
        return true;
    } catch (e) {
        console.error('Failed to save profile:', e);
        return false;
    }
}

// ---------- IPC Handlers ----------
ipcMain.handle('igdb-query', async (event, queryBody) => {
    try {
        const result = await igdbQuery(queryBody);
        return { success: true, data: result };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('load-data', () => {
    return loadData();
});

ipcMain.handle('save-data', (event, data) => {
    return saveData(data);
});

ipcMain.handle('load-profile', () => {
    return loadProfile();
});

ipcMain.handle('save-profile', (event, profileData) => {
    return saveProfile(profileData);
});

ipcMain.handle('delete-profile', () => {
    try {
        if (fs.existsSync(PROFILE_FILE)) {
            fs.unlinkSync(PROFILE_FILE);
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('export-data', async (event, data) => {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Exporter les données',
        defaultPath: `questlog_backup_${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (!result.canceled && result.filePath) {
        try {
            fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

ipcMain.handle('import-data', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Importer des données',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
            return { success: true, data: JSON.parse(raw) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

ipcMain.handle('scan-local-games', async () => {
    const games = new Set();
    const addGamesFromDir = (dir, platform) => {
        try {
            if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                items.forEach(item => {
                    if (item.isDirectory()) {
                        const name = item.name;
                        // Filter out common non-game folders
                        const ignoreList = ['Steamworks Shared', 'SteamController', 'CommonRedist', 'DirectX', 'DotNet', 'vcredist', 'Crashpad'];
                        if (!ignoreList.includes(name) && !name.startsWith('.') && name.length > 2) {
                            games.add(JSON.stringify({ name, platform }));
                        }
                    }
                });
            }
        } catch (e) { console.warn('Could not scan dir:', dir, e); }
    };

    // Common game directories
    const drives = ['C:', 'D:', 'E:', 'F:', 'G:'];
    const steamPaths = [
        '\\Program Files (x86)\\Steam\\steamapps\\common',
        '\\Program Files\\Steam\\steamapps\\common',
        '\\SteamLibrary\\steamapps\\common'
    ];
    const epicPaths = [
        '\\Program Files\\Epic Games',
        '\\Epic Games'
    ];
    const xboxPaths = [
        '\\XboxGames'
    ];
    const eaPaths = [
        '\\Program Files\\EA Games',
        '\\Program Files (x86)\\Origin Games'
    ];
    const ubiPaths = [
        '\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games'
    ];

    drives.forEach(drive => {
        steamPaths.forEach(p => addGamesFromDir(drive + p, 'PC (Steam)'));
        epicPaths.forEach(p => addGamesFromDir(drive + p, 'PC (Epic)'));
        xboxPaths.forEach(p => addGamesFromDir(drive + p, 'PC (Xbox)'));
        eaPaths.forEach(p => addGamesFromDir(drive + p, 'PC (EA)'));
        ubiPaths.forEach(p => addGamesFromDir(drive + p, 'PC (Ubisoft)'));
    });

    return Array.from(games).map(g => JSON.parse(g));
});

// Steam AppID Lookup Proxy
ipcMain.handle('search-steam-appid', async (event, term) => {
    return new Promise((resolve) => {
        const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=french`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ items: [] });
                }
            });
        }).on('error', () => {
            resolve({ items: [] });
        });
    });
});

// Steam API Proxies & Resolution
const DEFAULT_STEAM_API_KEY = 'D52FE235AB0867B9882020110105618C';

ipcMain.handle('resolve-steam-id', async (event, profileInput) => {
    return new Promise((resolve) => {
        let url = profileInput.trim();
        if (!url) return resolve({ success: false, error: 'Entrée vide.' });

        // If it's just a pseudo/custom URL, build the community URL
        if (!url.includes('steamcommunity.com')) {
            // Check if it's already a 17-digit SteamID64
            if (/^\d{17}$/.test(url)) {
                return resolve({ success: true, steamId: url });
            }
            url = `https://steamcommunity.com/id/${url}/`;
        }

        // Ensure protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Add trailing slash if missing
        if (!url.endsWith('/')) {
            url += '/';
        }

        const handleResponse = (res) => {
            if (res.statusCode === 302 && res.headers.location) {
                https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, handleResponse)
                     .on('error', (e) => resolve({ success: false, error: e.message }));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/"steamid"\s*:\s*"(\d+)"/);
                if (match) {
                    resolve({ success: true, steamId: match[1] });
                } else {
                    // Try searching for any 17-digit SteamID structure
                    const match2 = data.match(/7656119\d{10}/);
                    if (match2) {
                        resolve({ success: true, steamId: match2[0] });
                    } else {
                        resolve({ success: false, error: 'Impossible de trouver ton SteamID. Vérifie que ton profil est public.' });
                    }
                }
            });
        };

        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, handleResponse)
             .on('error', (e) => {
                 resolve({ success: false, error: e.message });
             });
    });
});

ipcMain.handle('fetch-steam-achievements', async (event, apiKey, steamId, appId) => {
    return new Promise((resolve) => {
        const key = apiKey && apiKey.trim() ? apiKey : DEFAULT_STEAM_API_KEY;
        const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${steamId}&appid=${appId}&l=french`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse response' });
                }
            });
        }).on('error', (e) => {
            resolve({ error: e.message });
        });
    });
});

ipcMain.handle('fetch-steam-schema', async (event, apiKey, appId) => {
    return new Promise((resolve) => {
        const key = apiKey && apiKey.trim() ? apiKey : DEFAULT_STEAM_API_KEY;
        const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${appId}&l=french`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse response' });
                }
            });
        }).on('error', (e) => {
            resolve({ error: e.message });
        });
    });
});

ipcMain.handle('fetch-steam-playtime', async (event, apiKey, steamId, appId) => {
    return new Promise((resolve) => {
        const key = apiKey && apiKey.trim() ? apiKey : DEFAULT_STEAM_API_KEY;
        const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&format=json`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const games = parsed.response?.games || [];
                    const game = games.find(g => g.appid === parseInt(appId));
                    resolve(game ? { playtime_forever: game.playtime_forever } : { playtime_forever: 0 });
                } catch (e) {
                    resolve({ playtime_forever: 0 });
                }
            });
        }).on('error', () => {
            resolve({ playtime_forever: 0 });
        });
    });
});

// Game Launching and Monitoring
let activeProcess = null;
let activeGameId = null;
let checkInterval = null;

ipcMain.handle('select-exe', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Sélectionner l\'exécutable du jeu (.exe)',
        filters: [{ name: 'Applications', extensions: ['exe'] }],
        properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Automatically find executable path based on game name
ipcMain.handle('auto-find-exe', async (event, gameName) => {
    try {
        const cleanString = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const getPossibleFolderNames = (name) => {
            const cleaned = cleanString(name);
            return [name, name.replace(/[:™®©]/g, ''), cleaned];
        };

        const possibleNames = getPossibleFolderNames(gameName).map(n => n.toLowerCase());
        
        const roots = [];
        
        // Steam libraries
        try {
            const paths = [
                'C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf',
                'C:\\Program Files\\Steam\\steamapps\\libraryfolders.vdf'
            ];
            const libraries = ['C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam'];
            for (const vdfPath of paths) {
                if (fs.existsSync(vdfPath)) {
                    const content = fs.readFileSync(vdfPath, 'utf-8');
                    const matches = content.match(/"path"\s+"([^"]+)"/g);
                    if (matches) {
                        for (const m of matches) {
                            const p = m.match(/"path"\s+"([^"]+)"/)[1];
                            const normalizedPath = p.replace(/\\\\/g, '\\');
                            if (fs.existsSync(normalizedPath) && !libraries.includes(normalizedPath)) {
                                libraries.push(normalizedPath);
                            }
                        }
                    }
                }
            }
            for (const lib of libraries) {
                roots.push(path.join(lib, 'steamapps', 'common'));
            }
        } catch(e) {}

        // Epic Games
        roots.push('C:\\Program Files\\Epic Games');
        roots.push('C:\\Program Files (x86)\\Epic Games');
        
        // GOG Games
        roots.push('C:\\Program Files (x86)\\GOG Galaxy\\Games');
        roots.push('C:\\GOG Games');
        
        // Generic paths across drives
        const drives = ['C', 'D', 'E', 'F', 'G'];
        for (const drive of drives) {
            roots.push(`${drive}:\\Games`);
            roots.push(`${drive}:\\Jeux`);
            roots.push(`${drive}:\\Program Files\\SteamLibrary\\steamapps\\common`);
            roots.push(`${drive}:\\SteamLibrary\\steamapps\\common`);
        }

        const existingRoots = roots.filter(r => fs.existsSync(r));
        const candidateExes = [];

        const scanDir = (dir, depth = 0) => {
            if (depth > 2) return;
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (file.toLowerCase() !== 'commonredist' && file.toLowerCase() !== 'redist') {
                            scanDir(fullPath, depth + 1);
                        }
                    } else if (file.toLowerCase().endsWith('.exe')) {
                        const lowerFile = file.toLowerCase();
                        const isInstallerOrHelper = 
                            lowerFile.includes('unitycrashhandler') || 
                            lowerFile.includes('unins') || 
                            lowerFile.includes('vc_redist') || 
                            lowerFile.includes('dxwebsetup') || 
                            lowerFile.includes('dotnet') || 
                            lowerFile.includes('cleanup') || 
                            lowerFile.includes('touchup') || 
                            lowerFile.includes('crash') || 
                            lowerFile.includes('update') || 
                            lowerFile.includes('setup') || 
                            lowerFile.includes('config') || 
                            lowerFile.includes('tool');
                        
                        if (!isInstallerOrHelper) {
                            candidateExes.push({
                                path: fullPath,
                                name: file,
                                size: stat.size
                            });
                        }
                    }
                }
            } catch(e) {}
        };

        // Scan folders matching game name
        for (const root of existingRoots) {
            try {
                const files = fs.readdirSync(root);
                for (const file of files) {
                    const fullPath = path.join(root, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        const cleanFile = cleanString(file);
                        if (possibleNames.includes(file.toLowerCase()) || 
                            possibleNames.includes(cleanFile) || 
                            file.toLowerCase().includes(possibleNames[0])) {
                            scanDir(fullPath);
                        }
                    }
                }
            } catch(e) {}
        }

        if (candidateExes.length === 0) {
            return null;
        }

        // Choose the best executable
        const gameNameClean = cleanString(gameName);
        
        // 1. Try exact name match
        let bestExe = candidateExes.find(e => cleanString(e.name) === gameNameClean + 'exe');
        
        // 2. Try prefix/contains match
        if (!bestExe) {
            bestExe = candidateExes.find(e => cleanString(e.name).includes(gameNameClean) || gameNameClean.includes(cleanString(e.name).replace('exe', '')));
        }
        
        // 3. Fallback to largest executable
        if (!bestExe) {
            bestExe = candidateExes.reduce((max, current) => current.size > max.size ? current : max, candidateExes[0]);
        }

        return bestExe.path;
    } catch (e) {
        console.error('Error auto-finding exe:', e);
        return null;
    }
});

ipcMain.handle('launch-game', async (event, gameId, exePath) => {
    if (activeProcess) {
        return { success: false, error: 'Un jeu est déjà en cours d\'exécution.' };
    }
    
    const { spawn } = require('child_process');
    try {
        const dir = path.dirname(exePath);
        // Spawn detached process
        activeProcess = spawn(exePath, [], { cwd: dir, detached: true, stdio: 'ignore' });
        activeProcess.unref();
        activeGameId = gameId;

        if (checkInterval) clearInterval(checkInterval);

        // Periodically verify if the PID is still alive (Windows tasklist check is safer for detached exes)
        const { exec } = require('child_process');
        checkInterval = setInterval(() => {
            if (!activeProcess) {
                clearInterval(checkInterval);
                return;
            }
            // Check PID via tasklist on Windows
            exec(`tasklist /FI "PID eq ${activeProcess.pid}"`, (err, stdout) => {
                const isRunning = stdout.includes(activeProcess.pid.toString());
                if (!isRunning) {
                    clearInterval(checkInterval);
                    activeProcess = null;
                    activeGameId = null;
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('game-closed', gameId);
                    }
                }
            });
        }, 5000);

        return { success: true };
    } catch (e) {
        activeProcess = null;
        activeGameId = null;
        return { success: false, error: e.message };
    }
});

// Goldberg Emulator Achievement Sync
ipcMain.handle('check-goldberg-achievements', async (event, appId) => {
    try {
        const appDataPath = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
        const savePath = path.join(appDataPath, 'Goldberg Steamemu Saves', appId.toString(), 'achievements.json');
        if (fs.existsSync(savePath)) {
            const raw = fs.readFileSync(savePath, 'utf-8');
            const data = JSON.parse(raw); // Typically an array of API names or status object
            return { success: true, achievements: data };
        }
    } catch (e) {
        console.error('Error reading Goldberg saves:', e);
    }
    return { success: false };
});

// Scan local executable directory for steam_settings/achievements.json and steam_appid.txt
ipcMain.handle('scan-local-game-settings', async (event, exePath) => {
    try {
        if (!exePath || !fs.existsSync(exePath)) return null;
        const dir = path.dirname(exePath);
        const result = { appId: null, achievements: null };

        // 1. Check steam_appid.txt in exe folder or parent folder
        const appIdPath = path.join(dir, 'steam_appid.txt');
        if (fs.existsSync(appIdPath)) {
            const content = fs.readFileSync(appIdPath, 'utf-8').trim();
            if (content && parseInt(content)) {
                result.appId = content;
            }
        } else {
            const parentAppIdPath = path.join(path.dirname(dir), 'steam_appid.txt');
            if (fs.existsSync(parentAppIdPath)) {
                const content = fs.readFileSync(parentAppIdPath, 'utf-8').trim();
                if (content && parseInt(content)) {
                    result.appId = content;
                }
            }
        }

        // 2. Check steam_settings/achievements.json in exe folder or parent folder
        const settingsPaths = [
            path.join(dir, 'steam_settings', 'achievements.json'),
            path.join(path.dirname(dir), 'steam_settings', 'achievements.json')
        ];

        for (const p of settingsPaths) {
            if (fs.existsSync(p)) {
                const raw = fs.readFileSync(p, 'utf-8');
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        result.achievements = parsed.map(ach => ({
                            apiname: ach.name,
                            name: ach.display_name || ach.name,
                            description: ach.description || '',
                            icon: ach.icon || ''
                        }));
                        break;
                    }
                } catch(e) {
                    console.error('Failed to parse local achievements.json:', e);
                }
            }
        }

        return result;
    } catch(e) {
        console.error('Error scanning local game settings:', e);
        return null;
    }
});

// Select manual achievements JSON file
ipcMain.handle('select-achievements-json', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Sélectionner le fichier de succès (.json)',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map(ach => ({
                    apiname: ach.name,
                    name: ach.display_name || ach.name,
                    description: ach.description || '',
                    icon: ach.icon || ''
                }));
            } else if (parsed && typeof parsed === 'object') {
                // If it's a Goldberg achievement save file (api_name: status)
                const keys = Object.keys(parsed);
                return keys.map(k => ({
                    apiname: k,
                    name: k,
                    description: '',
                    icon: ''
                }));
            }
        } catch(e) {
            return { error: 'Format de fichier JSON invalide.' };
        }
    }
    return null;
});

// Fetch Steam achievements schema publicly from steamcommunity stats page without API key
ipcMain.handle('fetch-public-steam-schema', async (event, appId) => {
    return new Promise((resolve) => {
        const url = `https://steamcommunity.com/stats/${appId}/achievements/?xml=1`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    let achievements = [];
                    // Try parsing as XML first
                    if (data.includes('<achievement>')) {
                        const achievementRegex = /<achievement>([\s\S]*?)<\/achievement>/g;
                        const nameRegex = /<name><!\[CDATA\[([\s\S]*?)\]\]><\/name>/;
                        const apinameRegex = /<apiname><!\[CDATA\[([\s\S]*?)\]\]><\/apiname>/;
                        const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
                        const iconRegex = /<iconClosed><!\[CDATA\[([\s\S]*?)\]\]><\/iconClosed>/;

                        let match;
                        while ((match = achievementRegex.exec(data)) !== null) {
                            const block = match[1];
                            const nameMatch = block.match(nameRegex);
                            const apinameMatch = block.match(apinameRegex);
                            const descMatch = block.match(descRegex);
                            const iconMatch = block.match(iconRegex);

                            if (nameMatch && apinameMatch) {
                                achievements.push({
                                    name: nameMatch[1],
                                    apiname: apinameMatch[1],
                                    description: descMatch ? descMatch[1] : '',
                                    icon: iconMatch ? iconMatch[1] : ''
                                });
                            }
                        }
                    }
                    
                    // Fallback to HTML parsing if XML parsing yielded nothing
                    if (achievements.length === 0) {
                        const rowRegex = /<div class="achieveRow\s*">([\s\S]*?)<div style="clear:\s*both;?"><\/div>/gi;
                        const imgRegex = /<img src="([^"]+)"/i;
                        const nameRegex = /<h3>([\s\S]*?)<\/h3>/i;
                        const descRegex = /<h5>([\s\S]*?)<\/h5>/i;

                        let match;
                        while ((match = rowRegex.exec(data)) !== null) {
                            const block = match[1];
                            const imgMatch = block.match(imgRegex);
                            const nameMatch = block.match(nameRegex);
                            const descMatch = block.match(descRegex);

                            if (nameMatch) {
                                const rawName = nameMatch[1].replace(/<[^>]*>/g, '').trim();
                                const rawDesc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
                                achievements.push({
                                    name: rawName,
                                    apiname: rawName.replace(/\s+/g, '_').toLowerCase(),
                                    description: rawDesc,
                                    icon: imgMatch ? imgMatch[1].trim() : ''
                                });
                            }
                        }
                    }
                    resolve({ success: true, achievements });
                } catch (e) {
                    resolve({ success: false, error: e.message });
                }
            });
        }).on('error', (err) => {
            resolve({ success: false, error: err.message });
        });
    });
});

// Window Controls
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// ---------- App Lifecycle ----------
app.whenReady().then(() => {
    createWindow();
    createTray();
    startBackgroundProcessMonitor();

    // Check for updates silently after startup (with 3s delay)
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            console.warn('Silent auto-update check failed:', err);
        });
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    // Only quit if not on Windows (on Windows we stay active in Tray)
    if (process.platform !== 'win32') {
        app.quit();
    }
});

// ---------- Auto-Start & Process Monitor ----------
ipcMain.handle('set-auto-launch', async (event, enabled) => {
    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            openAsHidden: enabled,
            path: app.getPath('exe'),
            args: ['--hidden']
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('get-auto-launch', async () => {
    try {
        const settings = app.getLoginItemSettings();
        return settings.openAtLogin;
    } catch (e) {
        return false;
    }
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// ---------- Overlay & Universal Achievements Engine ----------

function createOverlayWindow() {
    if (overlayWindow) return;
    try {
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;

        isOverlayLoaded = false;

        overlayWindow = new BrowserWindow({
            width: width,
            height: height,
            x: 0,
            y: 0,
            transparent: true,
            frame: false,
            resizable: false,
            thickFrame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            focusable: false,
            hasShadow: false,
            show: false, // Prevents white flashes before render
            backgroundColor: '#00000000', // Ensures native transparency on Windows
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                sandbox: false
            }
        });

        overlayWindow.setIgnoreMouseEvents(true);
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

        // Handle load completion
        overlayWindow.webContents.on('did-finish-load', () => {
            isOverlayLoaded = true;
            if (pendingSyncGameName) {
                overlayWindow.webContents.send('show-sync', pendingSyncGameName);
                pendingSyncGameName = null;
            }
        });

        overlayWindow.once('ready-to-show', () => {
            overlayWindow.show();
        });

        overlayWindow.on('closed', () => {
            overlayWindow = null;
            isOverlayLoaded = false;
        });
    } catch(e) {
        console.error('Failed to create overlay window:', e);
    }
}

function destroyOverlayWindow() {
    if (overlayWindow) {
        try {
            overlayWindow.close();
        } catch(e) {}
        overlayWindow = null;
    }
}

function parseIniFile(content) {
    const result = {};
    let currentSection = null;
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            currentSection = trimmed.slice(1, -1).trim();
            result[currentSection] = {};
        } else if (currentSection && trimmed.includes('=')) {
            const parts = trimmed.split('=');
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            result[currentSection][key] = value;
        }
    }
    return result;
}

// Scans RUNE, CODEX, Goldberg and local directories for unlocked achievements
async function scanAllLocalAchievements(appId) {
    const unlocked = [];
    if (!appId) return unlocked;
    const appIdStr = appId.toString();

    // 1. Goldberg Roaming Path
    try {
        const appDataPath = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
        const goldbergPath = path.join(appDataPath, 'Goldberg Steamemu Saves', appIdStr, 'achievements.json');
        if (fs.existsSync(goldbergPath)) {
            const raw = fs.readFileSync(goldbergPath, 'utf-8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                unlocked.push(...data.map(x => x.toLowerCase()));
            } else if (typeof data === 'object') {
                for (const key of Object.keys(data)) {
                    const val = data[key];
                    if (val === 1 || (val && (val.earned === 1 || val.earned === true))) {
                        unlocked.push(key.toLowerCase());
                    }
                }
            }
        }
    } catch(e) {}

    // 2. RUNE Public Documents Path
    try {
        const runePath = path.join('C:\\Users\\Public\\Documents\\Steam\\RUNE', appIdStr, 'achievements.ini');
        if (fs.existsSync(runePath)) {
            const raw = fs.readFileSync(runePath, 'utf-8');
            const parsed = parseIniFile(raw);
            for (const section of Object.keys(parsed)) {
                if (section === 'SteamAchievements') continue;
                const val = parsed[section];
                if (val && (val.Achieved === '1' || val.Achieved === 'true')) {
                    unlocked.push(section.toLowerCase());
                }
            }
        }
    } catch(e) {}

    // 3. CODEX / PLAZA Public Documents Path
    try {
        const codexPath = path.join('C:\\Users\\Public\\Documents\\Steam\\CODEX', appIdStr, 'achievements.ini');
        if (fs.existsSync(codexPath)) {
            const raw = fs.readFileSync(codexPath, 'utf-8');
            const parsed = parseIniFile(raw);
            for (const section of Object.keys(parsed)) {
                if (section === 'SteamAchievements') continue;
                const val = parsed[section];
                if (val && (val.Achieved === '1' || val.Achieved === 'true')) {
                    unlocked.push(section.toLowerCase());
                }
            }
        }
    } catch(e) {}

    return Array.from(new Set(unlocked));
}

let achievementsWatchInterval = null;
let lastUnlockedList = [];
let lastUnlockedCount = -1;

// IPC Handlers for overlay and local achievement synchronization
ipcMain.handle('create-overlay', () => {
    createOverlayWindow();
    return { success: true };
});

ipcMain.handle('destroy-overlay', () => {
    destroyOverlayWindow();
    return { success: true };
});

ipcMain.handle('show-overlay-sync', (event, gameName) => {
    if (!overlayWindow) {
        pendingSyncGameName = gameName;
        createOverlayWindow();
    } else if (isOverlayLoaded) {
        overlayWindow.webContents.send('show-sync', gameName);
    } else {
        pendingSyncGameName = gameName;
    }
    return { success: true };
});

ipcMain.handle('show-overlay-achievement', (event, achievement) => {
    if (!overlayWindow) createOverlayWindow();
    if (overlayWindow) {
        if (isOverlayLoaded) {
            overlayWindow.webContents.send('show-achievement', achievement);
        } else {
            overlayWindow.webContents.once('did-finish-load', () => {
                overlayWindow.webContents.send('show-achievement', achievement);
            });
        }
    }
    return { success: true };
});

ipcMain.handle('show-overlay-levelup', (event, level) => {
    if (!overlayWindow) createOverlayWindow();
    if (overlayWindow) {
        if (isOverlayLoaded) {
            overlayWindow.webContents.send('show-levelup', level);
        } else {
            overlayWindow.webContents.once('did-finish-load', () => {
                overlayWindow.webContents.send('show-levelup', level);
            });
        }
    }
    return { success: true };
});

ipcMain.handle('show-overlay-gamecompleted', (event, gameName, achievementName) => {
    if (!overlayWindow) createOverlayWindow();
    if (overlayWindow) {
        if (isOverlayLoaded) {
            overlayWindow.webContents.send('show-gamecompleted', gameName, achievementName);
        } else {
            overlayWindow.webContents.once('did-finish-load', () => {
                overlayWindow.webContents.send('show-gamecompleted', gameName, achievementName);
            });
        }
    }
    return { success: true };
});

ipcMain.handle('check-local-achievements', async (event, appId) => {
    try {
        const list = await scanAllLocalAchievements(appId);
        return { success: true, achievements: list };
    } catch(e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('watch-local-achievements', (event, appId) => {
    if (achievementsWatchInterval) clearInterval(achievementsWatchInterval);

    lastUnlockedCount = -1;
    lastUnlockedList = [];

    achievementsWatchInterval = setInterval(async () => {
        try {
            const currentUnlocked = await scanAllLocalAchievements(appId);
            
            if (lastUnlockedCount === -1) {
                lastUnlockedCount = currentUnlocked.length;
                lastUnlockedList = [...currentUnlocked];
                return;
            }

            const newlyUnlocked = currentUnlocked.filter(x => !lastUnlockedList.includes(x));
            if (newlyUnlocked.length > 0) {
                lastUnlockedList = [...currentUnlocked];
                lastUnlockedCount = currentUnlocked.length;
                
                // Notify the main window renderer about new achievements
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('local-achievements-updated', newlyUnlocked);
                }
            } else if (currentUnlocked.length < lastUnlockedCount) {
                lastUnlockedList = [...currentUnlocked];
                lastUnlockedCount = currentUnlocked.length;
            }
        } catch(e) {
            console.error('Error polling achievements in watcher:', e);
        }
    }, 2000);

    return { success: true };
});

ipcMain.handle('stop-watching-local-achievements', () => {
    if (achievementsWatchInterval) {
        clearInterval(achievementsWatchInterval);
        achievementsWatchInterval = null;
    }
    return { success: true };
});

let currentlyRunningGameId = null;

function startBackgroundProcessMonitor() {
    setInterval(() => {
        if (!fs.existsSync(SAVE_FILE)) return;
        try {
            const raw = fs.readFileSync(SAVE_FILE, 'utf-8');
            const data = JSON.parse(raw);
            const backlog = data.backlog || [];

            // Filter active games in backlog that have an executable path
            const gamesWithExe = backlog.filter(g => g.exePath);
            if (gamesWithExe.length === 0) {
                if (currentlyRunningGameId) {
                    const closedId = currentlyRunningGameId;
                    currentlyRunningGameId = null;
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('auto-game-closed', closedId);
                    }
                }
                return;
            }

            const { exec } = require('child_process');
            exec('tasklist /NH /FO CSV', (err, stdout) => {
                if (err) return;

                const runningProcesses = stdout.toLowerCase();
                let detectedGame = null;

                for (const game of gamesWithExe) {
                    const exeName = game.exePath.split('\\').pop().toLowerCase();
                    if (runningProcesses.includes(`"${exeName}"`)) {
                        detectedGame = game;
                        break;
                    }
                }

                if (detectedGame) {
                    if (currentlyRunningGameId !== detectedGame.id) {
                        currentlyRunningGameId = detectedGame.id;
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('auto-game-detected', detectedGame.id);
                        }
                    }
                } else {
                    if (currentlyRunningGameId) {
                        const closedId = currentlyRunningGameId;
                        currentlyRunningGameId = null;
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('auto-game-closed', closedId);
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error in background process monitor:', e);
        }
    }, 15000);
}

// ---------- Discord Rich Presence ----------
let rpcReady = false;
let pendingActivity = null;
let currentDiscordClientId = '1523420200081428711'; // Default ID

// Windows Pipe Patch for Node.js compatibility with Discord IPC
if (process.platform === 'win32') {
    try {
        const net = require('net');
        const originalCreateConnection = net.createConnection;
        net.createConnection = function(path, ...args) {
            if (typeof path === 'string' && path.startsWith('\\\\?\\pipe\\discord-ipc-')) {
                const newPath = path.replace('\\\\?\\pipe\\', '\\\\.\\pipe\\');
                console.log(`[DiscordRPC Patch] Redirecting pipe from ${path} to ${newPath}`);
                return originalCreateConnection.call(net, newPath, ...args);
            }
            return originalCreateConnection.call(net, path, ...args);
        };
    } catch (e) {
        console.error('Failed to apply Discord RPC Windows pipe patch:', e);
    }
}

function initDiscordRPC() {
    if (rpcClient) return;
    try {
        console.log(`Initializing Discord RPC with Client ID: ${currentDiscordClientId}`);
        rpcClient = new RPC.Client({ transport: 'ipc' });
        
        rpcClient.on('ready', () => {
            console.log('Discord Rich Presence (DRP) is ready!');
            rpcReady = true;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('discord-rpc-status', 'connected');
            }
            if (pendingActivity) {
                rpcClient.setActivity(pendingActivity).catch(err => {
                    console.warn('Error setting pending RPC activity:', err);
                });
                pendingActivity = null;
            }
        });

        rpcClient.on('disconnected', () => {
            console.log('Discord RPC disconnected');
            rpcReady = false;
            rpcClient = null;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('discord-rpc-status', 'disconnected');
            }
        });

        rpcClient.login({ clientId: currentDiscordClientId }).catch(err => {
            const errMsg = err.message || String(err);
            console.log(`Discord RPC: En attente de connexion avec l'ID ${currentDiscordClientId} (${errMsg}).`);
            rpcReady = false;
            rpcClient = null;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('discord-rpc-status', 'error', errMsg);
            }
        });
    } catch (e) {
        const errMsg = e.message || String(e);
        console.log('Discord RPC: Impossible d\'initialiser le client (Discord éteint).');
        rpcReady = false;
        rpcClient = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('discord-rpc-status', 'error', errMsg);
        }
    }
}

function updateDiscordPresence(gameName, coverUrl, steamAppId) {
    const cleanedGameName = gameName.length > 80 ? gameName.slice(0, 77) + '...' : gameName;
    
    const activity = {
        details: `Joue à ${cleanedGameName}`,
        state: 'via Quest Log',
        startTimestamp: Date.now(),
        buttons: [
            { label: 'Suivre mon Backlog 🎮', url: 'https://github.com/weeever' }
        ]
    };
    
    let optimizedCoverUrl = coverUrl;
    
    // Prioritize high-res Steam Library Capsule if game has a steamAppId linked
    if (steamAppId) {
        optimizedCoverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900.jpg`;
    } else if (coverUrl && coverUrl.includes('igdb.com')) {
        // Optimize cover resolution for high-res rendering on Discord (t_1080p is maximum sharpness)
        optimizedCoverUrl = coverUrl.replace(/\/t_[a-z0-9_]+\//, '/t_1080p/');
    }

    if (optimizedCoverUrl && optimizedCoverUrl.startsWith('http')) {
        // Logo of the game as large image, Quest Log logo as small image (loaded from direct Imgur URL)
        activity.largeImageKey = optimizedCoverUrl;
        activity.largeImageText = cleanedGameName;
        activity.smallImageKey = 'https://i.imgur.com/AfxUIqb.png';
        activity.smallImageText = 'Quest Log';
    } else {
        // Fallback if no game cover
        activity.largeImageKey = 'https://i.imgur.com/AfxUIqb.png';
        activity.largeImageText = cleanedGameName;
    }

    if (rpcReady && rpcClient) {
        try {
            rpcClient.setActivity(activity).catch(err => {
                console.warn('Error setting RPC activity:', err);
            });
        } catch (e) {
            console.error('Failed to set Discord Presence:', e);
        }
    } else {
        // Queue the activity until RPC is ready
        pendingActivity = activity;
        initDiscordRPC();
    }
}

function clearDiscordPresence() {
    pendingActivity = null;
    if (rpcReady && rpcClient) {
        try {
            rpcClient.clearActivity().catch(err => console.warn('Error clearing RPC activity:', err));
        } catch(e) {
            console.error('Failed to clear Discord Presence:', e);
        }
    }
}

// Ensure RPC is cleared when Electron app quits
app.on('will-quit', () => {
    clearDiscordPresence();
});

// DRP IPC Handlers
ipcMain.handle('update-discord-client-id', (event, clientId) => {
    const newId = clientId && clientId.trim() ? clientId.trim() : '1258832042106093618';
    if (newId !== currentDiscordClientId) {
        console.log(`Updating Discord Client ID from ${currentDiscordClientId} to ${newId}`);
        currentDiscordClientId = newId;
        if (rpcClient) {
            try {
                rpcClient.destroy().catch(() => {});
            } catch(e) {}
            rpcClient = null;
            rpcReady = false;
        }
        // If we have a pending activity or Discord is supposed to be active, retry login
        initDiscordRPC();
    }
    return { success: true };
});

ipcMain.handle('set-discord-presence', (event, gameName, coverUrl, steamAppId) => {
    updateDiscordPresence(gameName, coverUrl, steamAppId);
    return { success: true };
});

ipcMain.handle('clear-discord-presence', () => {
    clearDiscordPresence();
    return { success: true };
});

// ---------- Auto-Update System IPC Handlers & Event Listeners ----------
ipcMain.handle('check-for-updates', () => {
    autoUpdater.checkForUpdates().catch(err => {
        console.error('Failed to check for updates:', err);
    });
    return { success: true };
});

ipcMain.handle('start-update-download', () => {
    autoUpdater.downloadUpdate().catch(err => {
        console.error('Failed to start update download:', err);
    });
    return { success: true };
});

ipcMain.handle('install-update-now', () => {
    autoUpdater.quitAndInstall();
    return { success: true };
});

// Relay autoUpdater events to renderer process (mainWindow)
autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', 'checking');
    }
});

autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', 'available', info);
    }
});

autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', 'not-available');
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', progressObj.percent);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', 'ready', info);
    }
});

autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', 'error', err ? err.message : 'Unknown error');
    }
});
