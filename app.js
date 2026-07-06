/* ============================================
   QUEST LOG — APPLICATION LOGIC v4
   Electron + IGDB + File Save + UX Polish
   ============================================ */

// ---------- Platform Detection ----------
const isElectron = !!(window.questlog && window.questlog.isElectron);

// ---------- Constants ----------
const STATE_KEY = 'questlog_state';

const GENRE_ICONS = {
    'RPG': '⚔️', 'Action': '💥', 'Aventure': '🗺️', 'Adventure': '🗺️',
    'FPS': '🔫', 'Shooter': '🔫', 'Stratégie': '♟️', 'Strategy': '♟️',
    'Plateforme': '🍄', 'Platformer': '🍄', 'Sport': '⚽', 'Sports': '⚽',
    'Horreur': '👻', 'Horror': '👻', 'Puzzle': '🧩', 'Simulation': '🏗️',
    'Indie': '💎', 'Racing': '🏎️', 'Fighting': '🥊', 'Arcade': '👾',
    'Board Games': '🎲', 'Casual': '🎯', 'Educational': '📚',
    'Family': '👨‍👩‍👧‍👦', 'Card': '🃏', 'Massively Multiplayer': '🌐',
    'Music': '🎵', 'Autre': '🎮',
};

// ---------- State ----------
let state = {
    backlog: [],
    completed: [],
    currentGameId: null,
    backlogSort: 'newest',
    completedSort: 'newest',
    theme: 'violet',
    steamApiKey: '',
    steamId: '',
    profile: { xp: 0, level: 1, gold: 0 },
    lastVersionSeen: ''
};

// ---------- Changelogs ----------
const CHANGELOGS = {
    '0.0.2': {
        title: "Quest Log v0.0.2 — Update Expérience",
        date: "6 Juillet 2026",
        badge: "Hotfix & Features",
        items: [
            {
                title: "🕒 Temps de Jeu Cumulé",
                desc: "Un nouveau compteur de temps global dans le header pour suivre ton temps de jeu total accumulé sur tout ton backlog.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`
            },
            {
                title: "⌨️ Raccourci Clavier Global",
                desc: "Affiche ou masque instantanément Quest Log depuis n'importe où en appuyant sur Ctrl + Alt + Q.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                    <line x1="6" y1="8" x2="6.01" y2="8"/>
                    <line x1="10" y1="8" x2="10.01" y2="8"/>
                    <line x1="14" y1="8" x2="14.01" y2="8"/>
                    <line x1="18" y1="8" x2="18.01" y2="8"/>
                    <line x1="6" y1="12" x2="6.01" y2="12"/>
                    <line x1="10" y1="12" x2="10.01" y2="12"/>
                    <line x1="14" y1="12" x2="14.01" y2="12"/>
                    <line x1="18" y1="12" x2="18.01" y2="12"/>
                    <line x1="7" y1="16" x2="17" y2="16"/>
                </svg>`
            },
            {
                title: "📐 Coins Arrondis Windows 11",
                desc: "La fenêtre de l'application s'aligne sur les codes de l'OS avec des coins arrondis natifs et une ombre portée premium.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                </svg>`
            }
        ]
    },
    '0.0.1': {
        title: "Quest Log v0.0.1 — Update Stabilité",
        date: "6 Juillet 2026",
        badge: "Beta Update",
        items: [
            {
                title: "📥 Auto-Updater Intégré",
                desc: "Recherche en arrière-plan et téléchargement en un clic de tes futures mises à jour avec barre de progression néon.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>`
            },
            {
                title: "📦 Installateur Windows Setup",
                desc: "Création d'un exécutable d'installation (.exe) pour intégrer proprement l'app, le Tray et les raccourcis système.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>`
            },
            {
                title: "🔒 Instance de Processus Unique",
                desc: "Empêche d'ouvrir l'application plusieurs fois en tâche de fond et résout les doublons d'icônes dans ton Tray.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>`
            },
            {
                title: "💨 Fermeture Animée & Tray",
                desc: "Fermer l'app déclenche une transition de fondu avec notification pour t'indiquer qu'elle continue de tourner en arrière-plan.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>`
            },
            {
                title: "🆕 Écran des Nouveautés",
                desc: "Cette interface s'ouvre dorénavant d'elle-même après chaque mise à jour pour te présenter tous les derniers ajouts !",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>`
            }
        ]
    }
};

// ---------- Update UI Flag ----------
let isManualUpdateCheck = false;

// ---------- Sound Synthesizer (Web Audio API) ----------
function playSynthSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (type === 'achievement') {
            // High pitch double-ding (double coin arpeggio)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'triangle'; osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start(); osc.stop(ctx.currentTime + 0.25);
            
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2); gain2.connect(ctx.destination);
                osc2.type = 'triangle'; osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
                gain2.gain.setValueAtTime(0.08, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                osc2.start(); osc2.stop(ctx.currentTime + 0.35);
            }, 80);
        } else if (type === 'levelup') {
            // Ascending major arpeggio
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                    osc.start(); osc.stop(ctx.currentTime + 0.4);
                }, idx * 70);
            });
        } else if (type === 'connect') {
            // Futuristic dual-sine chime
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(659.25, now);
            osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
            
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.8);
            osc2.stop(now + 0.8);
        }
    } catch(e) { console.warn('AudioContext failed:', e); }
}

// ---------- XP, Gold & Levels System ----------
function getXpForLevel(level) {
    return level * 1000;
}

async function addXp(amount) {
    if (!state.profile) state.profile = { xp: 0, level: 1, gold: 0 };
    state.profile.xp += amount;
    
    let leveledUp = false;
    while (state.profile.xp >= getXpForLevel(state.profile.level)) {
        state.profile.xp -= getXpForLevel(state.profile.level);
        state.profile.level++;
        leveledUp = true;
    }
    
    await saveState();
    updateProfileUI();
    
    if (leveledUp) {
        playSynthSound('levelup');
        if (window.launchConfetti) window.launchConfetti();
        showToast(`🎉 NIVEAU ${state.profile.level} ATTEINT !`, '⭐');
        if (isElectron) {
            window.questlog.showOverlayLevelUp(state.profile.level);
        }
    }
}

async function addGold(amount) {
    if (!state.profile) state.profile = { xp: 0, level: 1, gold: 0 };
    if (state.profile.gold === undefined) state.profile.gold = 0;
    state.profile.gold += amount;
    await saveState();
    updateProfileUI();
}

function updateProfileUI() {
    if (!state.profile) state.profile = { username: 'Aventurier', xp: 0, level: 1, gold: 0 };
    if (state.profile.gold === undefined) state.profile.gold = 0;
    const xpNeeded = getXpForLevel(state.profile.level);
    const pct = (state.profile.xp / xpNeeded) * 100;
    
    $('#profile-level').textContent = `${state.profile.username || 'Aventurier'} • Lvl ${state.profile.level}`;
    const formattedPoints = state.profile.xp.toLocaleString();
    const formattedNeeded = xpNeeded.toLocaleString();
    $('#profile-points').textContent = `${formattedPoints} / ${formattedNeeded} XP`;
    $('#xp-bar-fill').style.width = `${pct}%`;
    
    // Update gold count in header
    $('#gold-count').textContent = state.profile.gold.toLocaleString();
}

function showAchievementToast(name, description, xpAwarded, iconUrl = '') {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-achievement';
    
    const iconHtml = iconUrl 
        ? `<div class="toast-achievement-icon"><img src="${iconUrl}" alt="Success"></div>`
        : `<div class="toast-achievement-icon"><svg class="panel-svg" style="width:20px; height:20px;" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z"/></svg></div>`;
        
    toast.innerHTML = `
        ${iconHtml}
        <div class="toast-achievement-info">
            <div class="toast-achievement-title">Succès déverrouillé !</div>
            <div class="toast-achievement-name">${name}</div>
            <div class="toast-achievement-xp">+${xpAwarded} XP • +50 🪙</div>
        </div>
    `;
    
    container.appendChild(toast);
    playSynthSound('achievement');
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 4500);
}

// Details Modal State
let currentDetailsId = null;
let currentDetailsSource = null;

// Search State
let currentSearchQuery = '';
let searchOffset = 0;
let isSearching = false;
let hasMoreSearchResults = true;

// ---------- Helpers ----------
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function saveState() {
    if (isElectron) {
        await window.questlog.saveData(state);
        if (state.profile) {
            await window.questlog.saveProfile(state.profile);
        }
    } else {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
        catch (e) { console.warn('Failed to save state:', e); }
    }
}

async function loadState() {
    if (isElectron) {
        const data = await window.questlog.loadData();
        if (data) {
            state = { ...state, ...data };
        }

        // Propagate custom Discord Client ID if saved
        if (state.discordClientId) {
            await window.questlog.updateDiscordClientId(state.discordClientId);
        }

        // Load secure profile
        const profile = await window.questlog.loadProfile();
        if (profile && profile.username) {
            state.profile = profile;
        } else {
            // First launch: show profile creation modal
            setTimeout(() => {
                const overlay = $('#profile-creation-overlay');
                if (overlay) {
                    openModal(overlay);
                }
            }, 500);
        }

        // Clean up simulated achievements for games that have no steamAppId
        if (state.backlog) {
            state.backlog.forEach(game => {
                if (!game.steamAppId) game.achievements = [];
            });
        }
        if (state.completed) {
            state.completed.forEach(game => {
                if (!game.steamAppId) game.achievements = [];
            });
        }
    } else {
        try {
            const raw = localStorage.getItem(STATE_KEY);
            if (raw) state = { ...state, ...JSON.parse(raw) };
        } catch (e) { console.warn('Failed to load state:', e); }
    }
    applyTheme(state.theme || 'violet');
}

function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    $$('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------- DOM ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---------- Rendering ----------
function renderGameCard(game, isCompleted = false, isNew = false) {
    const card = document.createElement('div');
    card.className = `game-card${isCompleted ? ' completed-card' : ''}${game.id === state.currentGameId ? ' active-game' : ''}${game.isFavorite ? ' favorite-card' : ''}`;
    if (isNew) card.classList.add('new-item');
    card.dataset.id = game.id;
    card.setAttribute('role', 'listitem');

    // Magnetic Glow Effect
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });

    const icon = GENRE_ICONS[game.genre] || `<svg class="stat-svg" style="width:24px; height:24px;" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="3"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/></svg>`;

    let visualHtml = '';
    if (game.cover) {
        visualHtml = `<div class="game-card-cover" style="background-image:url('${game.cover}')"></div>`;
    } else {
        visualHtml = `<div class="game-card-icon genre-${game.genre}" style="display:flex; align-items:center; justify-content:center;">${icon}</div>`;
    }

    let actionsHtml = '';
    if (!isCompleted) {
        actionsHtml = `
            <div class="game-card-actions">
                <button class="game-action-btn btn-complete-game" aria-label="Marquer terminé" title="Terminé !">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="game-action-btn btn-delete-game" aria-label="Supprimer" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </div>`;
    } else {
        const stars = renderStars(game.rating || 0);
        const heartActiveSvg = `<svg class="stat-svg" style="color:var(--accent-red); fill:var(--accent-red); width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        const heartInactiveSvg = `<svg class="stat-svg" style="color:var(--text-secondary); width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        actionsHtml = `
            <div class="game-card-rating">${stars}</div>
            <div class="game-card-actions">
                <button class="game-action-btn btn-favorite-game" aria-label="Coup de coeur" title="Coup de coeur">
                    <span class="fav-icon">${game.isFavorite ? heartActiveSvg : heartInactiveSvg}</span>
                </button>
                <button class="game-action-btn btn-restore-game" aria-label="Remettre dans le backlog" title="Remettre dans le backlog">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h7M7 5l-3 3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
                <button class="game-action-btn btn-delete-game" aria-label="Supprimer" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </div>`;
    }

    const dateStr = game.completedAt ? formatDate(game.completedAt) : '';
    const hours = game.playtime ? Math.round(game.playtime / 60 * 10) / 10 : 0;
    const playtimeStr = hours ? `<span class="game-card-playtime" style="display:flex; align-items:center; gap:4px;"><svg class="stat-svg" style="width:12px; height:12px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h</span>` : '';

    let achProgressHtml = '';
    if (game.achievements && game.achievements.length > 0) {
        const total = game.achievements.length;
        const unlocked = game.achievements.filter(a => a.unlocked).length;
        const pct = Math.round((unlocked / total) * 100);
        achProgressHtml = `
            <div class="game-card-ach-progress" title="${unlocked}/${total} succès déverrouillés">
                <div class="ach-progress-bar-bg">
                    <div class="ach-progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="ach-progress-text" style="display:flex; align-items:center; gap:4px;">${unlocked}/${total} <svg class="stat-svg" style="width:11px; height:11px;" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z"/></svg></span>
            </div>
        `;
    }

    const heartActiveSvg = `<svg class="stat-svg" style="color:var(--accent-red); fill:var(--accent-red); width:13px; height:13px;" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    card.innerHTML = `
        ${visualHtml}
        <div class="game-card-info">
            <div class="game-card-name" title="${game.name}" style="display:flex; align-items:center; gap:4px;">${game.isFavorite ? `<span class="fav-icon">${heartActiveSvg}</span>` : ''}${game.name}</div>
            <div class="game-card-meta" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${playtimeStr}
                    <span class="game-card-platform">${game.platform}</span>
                    <span class="game-card-genre">${game.genre}</span>
                </div>
                ${achProgressHtml}
                ${dateStr ? `<span class="game-card-date">${dateStr}</span>` : ''}
            </div>
        </div>
        ${actionsHtml}
    `;

    return card;
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="rating-star${i > rating ? ' empty' : ''}">★</span>`;
    }
    return html;
}

function sortGames(list, sortType) {
    const sorted = [...list];
    switch (sortType) {
        case 'newest': sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)); break;
        case 'oldest': sorted.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)); break;
        case 'alpha': sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr')); break;
        case 'alpha-desc': sorted.sort((a, b) => b.name.localeCompare(a.name, 'fr')); break;
        case 'platform': sorted.sort((a, b) => a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name, 'fr')); break;
        case 'genre': sorted.sort((a, b) => a.genre.localeCompare(b.genre) || a.name.localeCompare(b.name, 'fr')); break;
        case 'rating': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    return sorted;
}

let isInitialRender = true;

function renderBacklog(filter = '') {
    const container = $('#backlog-list');
    container.innerHTML = '';

    let games = sortGames(state.backlog, state.backlogSort);
    if (filter) {
        const f = filter.toLowerCase();
        games = games.filter(g => g.name.toLowerCase().includes(f) || g.platform.toLowerCase().includes(f) || g.genre.toLowerCase().includes(f));
    }

    if (games.length === 0 && state.backlog.length === 0) {
        $('#backlog-empty').classList.remove('hidden');
        container.style.display = 'none';
    } else {
        $('#backlog-empty').classList.add('hidden');
        container.style.display = 'flex';
        games.forEach((game, i) => {
            const card = renderGameCard(game, false, isInitialRender);
            if (isInitialRender) card.style.animationDelay = `${i * 30}ms`;
            container.appendChild(card);
        });
    }
}

function renderCompleted(filter = '') {
    const container = $('#completed-list');
    container.innerHTML = '';

    let games = sortGames(state.completed, state.completedSort);
    if (filter) {
        const f = filter.toLowerCase();
        games = games.filter(g => g.name.toLowerCase().includes(f) || g.platform.toLowerCase().includes(f) || g.genre.toLowerCase().includes(f));
    }

    if (games.length === 0 && state.completed.length === 0) {
        $('#completed-empty').classList.remove('hidden');
        container.style.display = 'none';
    } else {
        $('#completed-empty').classList.add('hidden');
        container.style.display = 'flex';
        games.forEach((game, i) => {
            const card = renderGameCard(game, true, isInitialRender);
            if (isInitialRender) card.style.animationDelay = `${i * 30}ms`;
            container.appendChild(card);
        });
    }
}

function updateStats() {
    $('#backlog-count').textContent = state.backlog.length;
    $('#completed-count').textContent = state.completed.length;
    $('#backlog-badge').textContent = state.backlog.length;
    $('#completed-badge').textContent = state.completed.length;

    [$('#backlog-badge'), $('#completed-badge')].forEach(b => {
        b.style.transform = 'scale(1.2)';
        setTimeout(() => b.style.transform = 'scale(1)', 200);
    });

    const rated = state.completed.filter(g => g.rating > 0);
    $('#avg-rating').textContent = rated.length > 0
        ? (rated.reduce((s, g) => s + g.rating, 0) / rated.length).toFixed(1)
        : '—';

    const total = state.backlog.length + state.completed.length;
    const progress = total > 0 ? (state.completed.length / total) * 100 : 0;
    $('#global-progress-pct').textContent = `${Math.round(progress)}%`;
    $('#global-progress-fill').style.width = `${progress}%`;

    // Calculate total playtime
    const totalPlaytimeMinutes = [...state.backlog, ...state.completed].reduce((sum, g) => sum + (g.playtime || 0), 0);
    const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);
    const statPlaytime = $('#total-playtime-count');
    if (statPlaytime) {
        statPlaytime.textContent = `${totalPlaytimeHours}h`;
    }
}

function updateNowPlaying() {
    const game = state.backlog.find(g => g.id === state.currentGameId);
    const section = $('#now-playing-section');
    if (game) {
        $('#now-playing-title').textContent = game.name;
        $('#now-playing-platform').textContent = `${game.platform} • ${game.genre}`;
        if (game.cover) {
            $('#now-playing-cover').style.backgroundImage = `url('${game.cover}')`;
            $('#now-playing-cover').style.display = 'block';
        } else {
            $('#now-playing-cover').style.display = 'none';
        }

        // Render achievements & playtime inside Now Playing
        const progressBlock = $('#now-playing-progress-block');
        const hours = game.playtime ? Math.round(game.playtime / 60 * 10) / 10 : 0;
        
        if (game.steamAppId && game.achievements && game.achievements.length > 0) {
            const total = game.achievements.length;
            const unlocked = game.achievements.filter(a => a.unlocked).length;
            const pct = Math.round((unlocked / total) * 100);
            
            $('#now-playing-ach-ratio').textContent = `${unlocked}/${total}`;
            $('#now-playing-ach-fill').style.width = `${pct}%`;
            $('#now-playing-ach-fill').parentElement.style.display = 'block';
            $('#now-playing-ach-ratio').parentElement.style.display = 'flex';
            $('#now-playing-playtime-text').innerHTML = `<svg class="stat-svg" style="width:12px; height:12px; margin-right:4px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h jouées`;
            progressBlock.style.display = 'flex';
        } else {
            $('#now-playing-ach-fill').parentElement.style.display = 'none';
            $('#now-playing-ach-ratio').parentElement.style.display = 'none';
            $('#now-playing-playtime-text').innerHTML = `<svg class="stat-svg" style="width:12px; height:12px; margin-right:4px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h jouées`;
            progressBlock.style.display = 'flex';
        }

        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
        state.currentGameId = null;
    }
}

function renderAll() {
    renderBacklog($('#backlog-search').value);
    renderCompleted($('#completed-search').value);
    updateStats();
    updateNowPlaying();
    updateProfileUI();
    isInitialRender = false;
}

// ---------- IGDB API ----------
async function igdbQuery(queryBody) {
    if (isElectron) {
        const result = await window.questlog.igdbQuery(queryBody);
        if (result.success) return result.data;
        return null;
    } else {
        // Fallback for browser mode (needs server.js proxy)
        try {
            const res = await fetch('/api/igdb', { method: 'POST', body: queryBody });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }
}

async function fetchGameCoverSilent(gameName) {
    const cleanName = gameName.replace(/"/g, '').replace(/\\/g, '');
    const data = await igdbQuery(`search "${cleanName}"; fields cover.url; limit 1;`);
    if (data && data.length > 0 && data[0].cover && data[0].cover.url) {
        let url = data[0].cover.url.replace('t_thumb', 't_cover_big');
        return url.startsWith('//') ? 'https:' + url : url;
    }
    return null;
}

// ---------- Search UI ----------
let searchTimeout = null;

function showSkeletons() {
    const container = $('#search-results');
    container.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'search-card search-card-skeleton';
        skeleton.style.animationDelay = `${i * 60}ms`;
        skeleton.innerHTML = `
            <div class="skeleton-cover shimmer"></div>
            <div class="skeleton-info">
                <div class="skeleton-title shimmer"></div>
                <div class="skeleton-meta shimmer"></div>
            </div>
            <div class="skeleton-btn shimmer"></div>
        `;
        container.appendChild(skeleton);
    }
}

async function performSearch(query, append = false) {
    if (isSearching) return;

    const spinner = $('#search-spinner');
    const resultsContainer = $('#search-results');
    const emptyState = $('#search-empty');

    if (!append) {
        searchOffset = 0;
        hasMoreSearchResults = true;
        currentSearchQuery = query;
        emptyState.style.display = 'none';
        spinner.style.display = 'block';
        resultsContainer.innerHTML = '';
        showSkeletons();
    } else {
        if (!hasMoreSearchResults) return;
        spinner.style.display = 'block';
    }

    isSearching = true;
    const cleanQuery = currentSearchQuery.trim().replace(/"/g, '').replace(/\\/g, '');
    
    const sortFilterRadio = document.querySelector('input[name="sort"]:checked');
    const sortFilter = sortFilterRadio ? sortFilterRadio.value : 'popularity';
    
    const platformCheckboxes = Array.from(document.querySelectorAll('#dropdown-platform input:checked'));
    const platformFilter = platformCheckboxes.map(cb => cb.value).join(',');
    
    const genreCheckboxes = Array.from(document.querySelectorAll('#dropdown-genre input:checked'));
    const genreFilter = genreCheckboxes.map(cb => cb.value).join(',');

    let sortStr = 'sort total_rating_count desc;';
    if (sortFilter === 'newest') sortStr = 'sort first_release_date desc;';
    else if (sortFilter === 'rating') sortStr = 'sort total_rating desc;';

    let platformStr = platformFilter ? ` & platforms = (${platformFilter})` : '';
    let genreStr = genreFilter ? ` & genres = (${genreFilter})` : '';

    let body = '';
    if (!cleanQuery) {
        // Default top games when query is empty
        body = `fields name,cover.url,platforms.name,genres.name,first_release_date,summary,external_games.category,external_games.uid,external_games.url; where game_type = (0,8,9,10,11) & cover != null${platformStr}${genreStr}; ${sortStr} limit 20; offset ${searchOffset};`;
    } else {
        // Normal search filtering out DLCs/Seasons (game_type 0=main, 8=remake, 9=remaster, 10=expanded, 11=port)
        body = `search "${cleanQuery}"; fields name,cover.url,platforms.name,genres.name,first_release_date,summary,external_games.category,external_games.uid,external_games.url; where game_type = (0,8,9,10,11)${platformStr}${genreStr}; limit 20; offset ${searchOffset};`;
    }

    const data = await igdbQuery(body);

    spinner.style.display = 'none';
    if (!append) {
        resultsContainer.innerHTML = '';
    }
    isSearching = false;

    if (!data || data.length === 0) {
        if (!append) {
            resultsContainer.innerHTML = '<div class="search-no-results"><span class="search-no-icon">🔍</span><p>Aucun jeu trouvé pour cette recherche.</p></div>';
        }
        hasMoreSearchResults = false;
        return;
    }

    if (data.length < 20) {
        hasMoreSearchResults = false;
    }
    searchOffset += data.length;

    data.forEach((game, index) => {
        let coverUrl = game.cover && game.cover.url ? game.cover.url.replace('t_thumb', 't_cover_big') : '';
        if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
        const platform = game.platforms && game.platforms.length > 0 ? game.platforms[0].name : 'Inconnu';
        const genre = game.genres && game.genres.length > 0 ? game.genres[0].name : 'Autre';
        const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : '';

        const isAdded = state.backlog.some(g => g.name === game.name) || state.completed.some(g => g.name === game.name);

        const card = document.createElement('div');
        card.className = `search-card${isAdded ? ' added' : ''}`;
        card.style.animationDelay = `${index * 40}ms`;
        card.innerHTML = `
            <div class="search-card-cover ${coverUrl ? '' : 'no-cover'}" ${coverUrl ? `style="background-image:url('${coverUrl}')"` : ''}>
                ${!coverUrl ? `<span class="search-card-placeholder">${GENRE_ICONS[genre] || '🎮'}</span>` : ''}
            </div>
            <div class="search-card-info">
                <div class="search-card-title" title="${game.name}">${game.name}</div>
                <div class="search-card-meta">
                    <span class="search-meta-platform">${platform}</span>
                    <span class="search-meta-dot">•</span>
                    <span class="search-meta-genre">${genre}</span>
                    ${year ? `<span class="search-meta-year">(${year})</span>` : ''}
                </div>
            </div>
            <button class="search-card-add btn-add-result" ${isAdded ? 'disabled' : ''}>
                ${isAdded ? '<span class="add-check">✓</span> Ajouté' : '<span class="add-plus">+</span> Ajouter'}
            </button>
        `;

        card.querySelector('.btn-add-result').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<span class="add-check">✓</span> Ajouté';
            card.classList.add('added');
            
            let steamAppId = '';
            if (game.external_games && Array.isArray(game.external_games)) {
                const steamExt = game.external_games.find(ext => ext.category === 1 || (ext.url && ext.url.includes('steampowered.com')));
                if (steamExt) {
                    steamAppId = steamExt.uid.toString();
                }
            }

            addGame(game.name, platform, genre, '', coverUrl, false, steamAppId).then(() => {
                showToast(`${game.name} ajouté au backlog !`, '🎮');
            });
        });

        resultsContainer.appendChild(card);
    });
}

// ---------- UI Interaction ----------
function showToast(message, icon = '✅') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const TOAST_ICONS = {
        '✅': `<svg class="stat-svg" style="color:var(--accent-emerald); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        '❌': `<svg class="stat-svg" style="color:var(--accent-red); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        '🎮': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="3"/></svg>`,
        '🔌': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.5a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1.5a3 3 0 0 0 3-3h3a3 3 0 0 0 3 3H18a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/><path d="M2 14h2M20 14h2M12 2v5M12 17v5"/></svg>`,
        '🏆': `<svg class="stat-svg" style="color:var(--accent-amber); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z"/></svg>`,
        'ℹ️': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        '📦': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        '🗑️': `<svg class="stat-svg" style="color:var(--accent-red); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
        '⚠️': `<svg class="stat-svg" style="color:var(--accent-amber); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        '⭐': `<svg class="stat-svg" style="color:var(--accent-amber); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        '🖥️': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        '⚙️': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        '📥': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
        '↩️': `<svg class="stat-svg" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
    };
    const iconContent = TOAST_ICONS[icon] || icon;
    toast.innerHTML = `<span class="toast-icon">${iconContent}</span><span>${message}</span>`;
    $('#toast-container').appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

function openModal(overlayEl) {
    overlayEl.classList.add('active');
    overlayEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal(overlayEl) {
    overlayEl.classList.remove('active');
    overlayEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ---------- Actions ----------
async function addGame(name, platform, genre, notes = '', cover = '', silent = false, steamAppId = '') {
    const game = {
        id: generateId(),
        name: name.trim(),
        platform,
        genre,
        notes: notes.trim(),
        cover,
        addedAt: Date.now(),
        steamAppId: steamAppId ? steamAppId.toString() : '',
        achievements: []
    };
    state.backlog.unshift(game);
    if (!state.currentGameId) state.currentGameId = game.id;
    await saveState();

    isInitialRender = true;
    renderAll();

    if (!cover) {
        const fetchedCover = await fetchGameCoverSilent(game.name);
        if (fetchedCover) {
            game.cover = fetchedCover;
            await saveState();
            isInitialRender = false;
            renderAll();
        }
    }

    // Auto-find Steam AppID if not already provided
    if (game.steamAppId) {
        await fetchAchievementsFromSteam(game);
        renderAll();
    } else {
        const found = await tryAutoFindSteamAppId(game);
        if (!found && !silent) {
            const manualAppId = await showPromptModal(`Nous n'avons pas réussi à trouver l'ID Steam de "${game.name}" automatiquement.\n\nSaisis son Steam AppID pour lier les succès (ou clique sur Passer) :`);
            if (manualAppId && parseInt(manualAppId)) {
                game.steamAppId = manualAppId.trim();
                await saveState();
                await fetchAchievementsFromSteam(game);
                renderAll();
            }
        }
    }

    // Prompt to link EXE for process tracking
    if (isElectron && !silent) {
        setTimeout(async () => {
            const linkExe = await showConfirmModal(`Voulez-vous lier l'exécutable (.exe) de "${game.name}" maintenant ?\n(Recommandé pour activer la détection automatique de jeu et le suivi en arrière-plan)`);
            if (linkExe) {
                await selectExeFile(game);
            }
        }, 1000);
    }

    return game;
}

async function addBatchGames(names, platform, genre) {
    let addedCount = 0;
    const addedGames = [];

    names.forEach(name => {
        const trimmed = name.trim();
        if (trimmed && !state.backlog.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
            const game = {
                id: generateId(),
                name: trimmed,
                platform,
                genre,
                notes: '',
                cover: '',
                addedAt: Date.now() - addedCount,
                achievements: []
            };
            state.backlog.unshift(game);
            addedGames.push(game);
            addedCount++;
        }
    });

    if (!state.currentGameId && state.backlog.length > 0) {
        pickRandomGame(false);
    }

    await saveState();
    isInitialRender = true;
    renderAll();

    for (const game of addedGames) {
        fetchGameCoverSilent(game.name).then(async fetchedCover => {
            if (fetchedCover) {
                game.cover = fetchedCover;
                await saveState();
                isInitialRender = false;
                renderAll();
            }
        });
        tryAutoFindSteamAppId(game);
    }

    return addedCount;
}

// ---------- Steam & Local Achievement Tracking Helpers ----------
const SIMULATED_ACHIEVEMENTS = [
    { key: 'play_5m', name: 'Premiers Pas', description: 'Jouer 5 minutes', threshold: 5, xp: 100 },
    { key: 'play_1h', name: 'Joueur Régulier', description: 'Jouer 1 heure', threshold: 60, xp: 250 },
    { key: 'play_5h', name: 'Passionné', description: 'Jouer 5 heures', threshold: 300, xp: 500 },
    { key: 'play_15h', name: 'Acharné', description: 'Jouer 15 heures', threshold: 900, xp: 1000 },
    { key: 'play_40h', name: 'Légende', description: 'Jouer 40 heures', threshold: 2400, xp: 2000 }
];

async function tryAutoFindSteamAppId(game) {
    if (game.steamAppId) return true;
    if (!isElectron) return false;
    
    // 1. Try Steam storesearch
    try {
        const result = await window.questlog.searchSteamAppId(game.name);
        if (result && result.items && result.items.length > 0) {
            const queryName = game.name.toLowerCase().trim();
            const matched = result.items.find(item => item.name.toLowerCase().trim() === queryName)
                         || result.items.find(item => item.name.toLowerCase().includes(queryName) || queryName.includes(item.name.toLowerCase()))
                         || result.items[0];
            if (matched) {
                game.steamAppId = matched.id.toString();
                await saveState();
                await fetchAchievementsFromSteam(game);
                return true;
            }
        }
    } catch(e) { console.warn('Auto Steam lookup failed:', e); }

    // 2. Try IGDB catalog external games fallback (Highly accurate, matches e.g. "Red Dead 2" -> RDR2 Steam ID)
    try {
        const queryBody = `search "${game.name.replace(/"/g, '')}"; fields name, external_games.category, external_games.uid, external_games.url; where game_type = (0,8,9,10,11); limit 5;`;
        const igdbRes = await igdbQuery(queryBody);
        if (igdbRes && igdbRes.length > 0) {
            const queryName = game.name.toLowerCase().trim();
            const matched = igdbRes.find(item => item.name.toLowerCase().trim() === queryName)
                         || igdbRes.find(item => item.name.toLowerCase().includes(queryName) || queryName.includes(item.name.toLowerCase()))
                         || igdbRes[0];
            
            if (matched && matched.external_games) {
                const steamExt = matched.external_games.find(ext => ext.category === 1 || (ext.url && ext.url.includes('steampowered.com')));
                if (steamExt) {
                    game.steamAppId = steamExt.uid.toString();
                    await saveState();
                    await fetchAchievementsFromSteam(game);
                    return true;
                }
            }
        }
    } catch(e) { console.warn('Auto IGDB Steam ID lookup failed:', e); }

    return false;
}

async function fetchAchievementsFromSteam(game) {
    if (!game.steamAppId) return;
    try {
        let schemaList = [];
        
        // 1. Prioritize official Steam API Schema if API Key is available to get authentic apinames
        if (state.steamApiKey) {
            const schemaRes = await window.questlog.fetchSteamSchema(state.steamApiKey, game.steamAppId);
            if (schemaRes && schemaRes.game && schemaRes.game.availableGameStats && schemaRes.game.availableGameStats.achievements) {
                schemaList = schemaRes.game.availableGameStats.achievements.map(ach => ({
                    apiname: ach.name,
                    name: ach.displayName,
                    description: ach.description || '',
                    icon: ach.icon || ''
                }));
            }
        }
        
        // 2. Fall back to public stats page scraping if official schema failed or API Key is missing
        if (schemaList.length === 0 && isElectron) {
            const publicRes = await window.questlog.fetchPublicSteamSchema(game.steamAppId);
            if (publicRes.success && publicRes.achievements && publicRes.achievements.length > 0) {
                schemaList = publicRes.achievements.map(ach => ({
                    apiname: ach.apiname,
                    name: ach.name,
                    description: ach.description || '',
                    icon: ach.icon || ''
                }));
            }
        }
        
        if (schemaList.length > 0) {
            // 3. Fetch online player achievements if Steam ID and API Key are present
            let playerList = [];
            if (state.steamApiKey && state.steamId) {
                const playerRes = await window.questlog.fetchSteamAchievements(state.steamApiKey, state.steamId, game.steamAppId);
                playerList = playerRes?.playerstats?.achievements || [];
            }
            
            // 4. Check local achievements (Goldberg, RUNE, CODEX, etc.)
            let localUnlockedList = [];
            if (isElectron) {
                const localRes = await window.questlog.checkLocalAchievements(game.steamAppId);
                if (localRes.success && localRes.achievements) {
                    localUnlockedList = localRes.achievements;
                }
            }

            const mapped = schemaList.map(ach => {
                const onlineAch = playerList.find(p => p.apiname === ach.apiname);
                const isOnlineUnlocked = onlineAch ? onlineAch.achieved === 1 : false;
                
                // Flexible match for local achievements (RUNE, CODEX, Goldberg)
                const isLocalUnlocked = localUnlockedList.some(locKey => {
                    const cleanLoc = locKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanApi = ach.apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanName = ach.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanLoc === cleanApi || cleanLoc === cleanName || cleanLoc.includes(cleanApi) || cleanApi.includes(cleanLoc);
                });
                
                const oldAch = game.achievements ? game.achievements.find(o => o.apiname === ach.apiname) : null;
                const isCachedUnlocked = oldAch ? oldAch.unlocked : false;

                return {
                    apiname: ach.apiname,
                    name: ach.name,
                    description: ach.description || '',
                    icon: ach.icon || '',
                    unlocked: isCachedUnlocked || isOnlineUnlocked || isLocalUnlocked,
                    unlockTime: onlineAch ? onlineAch.unlocktime : (oldAch ? oldAch.unlockTime : 0)
                };
            });
            
            if (game.achievements && game.achievements.length > 0) {
                const wasSimulated = game.achievements.length === SIMULATED_ACHIEVEMENTS.length && game.achievements.every(a => a.apiname.startsWith('sim_'));
                
                if (!wasSimulated) {
                    mapped.forEach(newAch => {
                        const oldAch = game.achievements.find(o => o.apiname === newAch.apiname);
                        if (newAch.unlocked && (!oldAch || !oldAch.unlocked)) {
                            addXp(250);
                            addGold(50);
                            showAchievementToast(newAch.name, newAch.description, 250, newAch.icon);
                            if (isElectron) {
                                window.questlog.showOverlayAchievement({
                                    name: newAch.name,
                                    description: newAch.description,
                                    icon: newAch.icon
                                });
                            }
                            
                            // Auto detect game completion from achievement
                            if (isGameCompletionAchievement(newAch)) {
                                handleGameAutoCompleted(game, newAch);
                            }
                        }
                    });
                }
            }
            
            game.achievements = mapped;
            await saveState();
            
            if (currentDetailsId === game.id) {
                renderAchievementsInDetails(game);
            }
        }
    } catch(e) { console.warn('Failed to fetch Steam achievements:', e); }
}

async function checkSimulatedAchievements(game) {
    return; // Simulated achievements disabled as per user request
}

function renderAchievementsInDetails(game) {
    const block = $('#details-achievements-block');
    const list = $('#achievements-list');
    const ratio = $('#achievements-ratio');
    const fill = $('#achievements-progress-fill');
    
    block.style.display = 'block';
    
    if (!game.achievements || game.achievements.length === 0) {
        ratio.textContent = "0 / 0";
        fill.style.width = "0%";
        list.innerHTML = `
            <div class="achievements-empty-state" style="text-align: center; padding: 12px 0; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">Aucun succès disponible pour ce jeu.</p>
                <button id="btn-import-achievements-json" class="btn-secondary btn-sm" style="font-size: 0.75rem; padding: 6px 12px; border-radius: var(--radius-sm);">Importer des succès (.json)</button>
            </div>
        `;
        
        $('#btn-import-achievements-json')?.addEventListener('click', async () => {
            const achs = await window.questlog.selectAchievementsJson();
            if (achs) {
                if (achs.error) {
                    showToast(achs.error, "❌");
                } else {
                    game.achievements = achs.map(ach => ({
                        apiname: ach.apiname,
                        name: ach.name,
                        description: ach.description || '',
                        icon: ach.icon || '',
                        unlocked: false
                    }));
                    await saveState();
                    renderAchievementsInDetails(game);
                    showToast(`${achs.length} succès importés !`, "🏆");
                    isInitialRender = false;
                    renderBacklog($('#backlog-search').value);
                }
            }
        });
        return;
    }
    
    list.innerHTML = '';
    
    const total = game.achievements.length;
    const unlocked = game.achievements.filter(a => a.unlocked).length;
    const pct = total > 0 ? (unlocked / total) * 100 : 0;
    
    ratio.textContent = `${unlocked} / ${total}`;
    fill.style.width = `${pct}%`;
    
    // Sort unlocked first, then locked
    const sorted = [...game.achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
    
    sorted.forEach(ach => {
        const item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
        
        // Achievements are no longer manually unlockable to prevent cheating/bugs
        
        const iconHtml = ach.icon 
            ? `<img src="${ach.icon}" alt="Icon">` 
            : '🏆';
            
        item.innerHTML = `
            <div class="achievement-icon">${iconHtml}</div>
            <div class="achievement-text-info">
                <span class="achievement-name">${ach.name}</span>
                <span class="achievement-desc">${ach.description}</span>
            </div>
            ${ach.unlocked ? '<span class="achievement-rarity">Unlock</span>' : ''}
        `;
        list.appendChild(item);
    });
}

async function scanLocalGameConfig(game, path) {
    if (!isElectron) return;
    try {
        const localSettings = await window.questlog.scanLocalGameSettings(path);
        if (localSettings) {
            let changed = false;
            if (localSettings.appId && !game.steamAppId) {
                game.steamAppId = localSettings.appId;
                changed = true;
                showToast(`AppID Steam (${localSettings.appId}) détecté localement !`, "🔌");
            }
            if (localSettings.achievements && (!game.achievements || game.achievements.length === 0)) {
                game.achievements = localSettings.achievements;
                changed = true;
                showToast(`${localSettings.achievements.length} succès locaux détectés !`, "🏆");
            }
            if (changed) {
                await saveState();
                renderAll();
            }
        }
    } catch(e) { console.warn('Failed to scan local game config:', e); }
}

let activePlaySession = null;

async function selectExeFile(game, manual = false) {
    if (!isElectron) {
        showToast("Disponible uniquement sur Windows.", "🖥️");
        return;
    }
    
    if (!manual) {
        const autoPath = await window.questlog.autoFindExe(game.name);
        if (autoPath) {
            game.exePath = autoPath;
            await saveState();
            if (currentDetailsId === game.id) {
                $('#launcher-status').textContent = autoPath.split('\\').pop();
            }
            showToast(`Exécutable trouvé automatiquement : ${autoPath.split('\\').pop()} !`, "✅");
            await scanLocalGameConfig(game, autoPath);
            return;
        }
    }
    
    const path = await window.questlog.selectExe();
    if (path) {
        game.exePath = path;
        await saveState();
        if (currentDetailsId === game.id) {
            $('#launcher-status').textContent = path.split('\\').pop();
        }
        showToast("Exécutable associé avec succès !", "🎮");
        await scanLocalGameConfig(game, path);
    }
}

async function linkSteamAppId(game, appId) {
    if (!appId) {
        game.steamAppId = '';
        game.achievements = [];
        await saveState();
        showToast("Liaison Steam retirée.", "🔌");
        if (currentDetailsId === game.id) {
            $('#steam-appid-status').textContent = 'Non lié à Steam';
            $('#details-achievements-block').style.display = 'none';
        }
        return;
    }
    game.steamAppId = appId.toString();
    await saveState();
    showToast(`Jeu lié à l'AppID Steam : ${appId}`, "🔌");
    if (currentDetailsId === game.id) {
        $('#steam-appid-status').textContent = `Lié à Steam (AppID: ${appId})`;
    }
    fetchAchievementsFromSteam(game);
}

async function tryAutoFindSteamAppId(game) {
    if (!isElectron || game.steamAppId) return;
    try {
        const result = await window.questlog.searchSteamAppId(game.name);
        if (result && result.items && result.items.length > 0) {
            const queryName = game.name.toLowerCase().trim();
            const matched = result.items.find(item => item.name.toLowerCase().trim() === queryName) 
                         || result.items[0];
            
            if (matched) {
                game.steamAppId = matched.id.toString();
                await saveState();
                
                if (currentDetailsId === game.id) {
                    $('#input-steam-appid').value = game.steamAppId;
                    $('#steam-appid-status').textContent = `Lié à Steam (AppID: ${game.steamAppId})`;
                    fetchAchievementsFromSteam(game);
                }
            }
        }
    } catch (e) {
        console.warn('Failed to auto-find Steam AppID for:', game.name, e);
    }
}

async function startPlaySession(game, isAutoDetect = false) {
    if (activePlaySession) {
        if (!isAutoDetect) showToast("Un jeu est déjà en cours d'exécution.", "⚠️");
        return;
    }
    
    if (!isAutoDetect) {
        if (!game.exePath) {
            await selectExeFile(game);
            if (!game.exePath) return;
        }
        
        showToast(`Démarrage de ${game.name}...`, "🎮");
        
        const result = await window.questlog.launchGame(game.id, game.exePath);
        if (!result.success) {
            showToast(`Erreur : ${result.error}`, "❌");
            return;
        }
    }
    
    const startTime = Date.now();
    state.currentGameId = game.id;
    await saveState();
    renderAll();
    
    // Show game connected popup overlay in-app immediately
    showGameConnectedOverlay(game);
    if (isElectron) {
        // Wait 7 seconds before showing overlay so the game exe is fully loaded and active
        setTimeout(() => {
            if (activePlaySession && activePlaySession.gameId === game.id) {
                window.questlog.createOverlay();
                window.questlog.showOverlaySync(game.name);
            }
        }, 7000);
        window.questlog.setDiscordPresence(game.name, game.cover || '', game.steamAppId || '');
    }
    
    activePlaySession = {
        gameId: game.id,
        startTime: startTime,
        timerInterval: setInterval(() => {
            game.playtime = (game.playtime || 0) + 1;
            addGold(1); // 1 gold per minute
            checkSimulatedAchievements(game);
            saveState();
            
            if (currentDetailsId === game.id) {
                const hours = Math.round(game.playtime / 60 * 10) / 10;
                $('#details-date').innerHTML = `Ajouté le ${formatDate(game.addedAt)} • <svg class="stat-svg" style="width:12px; height:12px; margin-right:2px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h`;
            }
            
            // Real-time update Now Playing playtime and backlog card
            if (state.currentGameId === game.id) {
                const hours = Math.round(game.playtime / 60 * 10) / 10;
                $('#now-playing-playtime-text').innerHTML = `<svg class="stat-svg" style="width:12px; height:12px; margin-right:4px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h jouées`;
                
                // Update now playing achievements fill in case they synced
                if (game.achievements && game.achievements.length > 0) {
                    const total = game.achievements.length;
                    const unlocked = game.achievements.filter(a => a.unlocked).length;
                    const pct = Math.round((unlocked / total) * 100);
                    $('#now-playing-ach-ratio').textContent = `${unlocked}/${total}`;
                    $('#now-playing-ach-fill').style.width = `${pct}%`;
                }

                isInitialRender = false;
                renderBacklog($('#backlog-search').value);
            }
        }, 60000)
    };
    
    if (game.steamAppId) {
        fetchAchievementsFromSteam(game);
        if (isElectron) {
            window.questlog.watchLocalAchievements(game.steamAppId);
        }
    }
    
    if (currentDetailsId === game.id) {
        const playBtn = $('#btn-play-game');
        playBtn.innerHTML = '<span>⏹️ Arrêter le suivi</span>';
        playBtn.className = 'btn-danger btn-full';
        $('#launcher-status').textContent = 'En cours d\'exécution...';
    }
}

async function stopPlaySession() {
    if (!activePlaySession) return;
    
    clearInterval(activePlaySession.timerInterval);
    if (isElectron) {
        window.questlog.stopWatchingLocalAchievements();
        window.questlog.destroyOverlay();
        window.questlog.clearDiscordPresence();
    }
    
    const game = state.backlog.find(g => g.id === activePlaySession.gameId);
    if (game) {
        const elapsedMinutes = Math.round((Date.now() - activePlaySession.startTime) / 60000);
        const xpEarned = elapsedMinutes * 5; // 5 XP per minute played
        if (xpEarned > 0) {
            addXp(xpEarned);
            showToast(`Session terminée ! +${xpEarned} XP gagnés !`, "⭐");
        } else {
            showToast("Session terminée !", "🎮");
        }
    }
    
    activePlaySession = null;
    await saveState();
    renderAll();
    
    if (currentDetailsId && game && currentDetailsId === game.id) {
        const playBtn = $('#btn-play-game');
        playBtn.innerHTML = '<span>▶️ Lancer le jeu</span>';
        playBtn.className = 'btn-primary btn-full';
        $('#launcher-status').textContent = game.exePath ? game.exePath.split('\\').pop() : 'Aucun exécutable lié';
    }
}

function showGameConnectedOverlay(game) {
    const overlay = $('#game-connected-overlay');
    if (!overlay) return;

    $('#connected-game-name').textContent = game.name;
    if (game.cover) {
        $('#connected-game-cover').style.backgroundImage = `url('${game.cover}')`;
        $('#connected-game-cover').style.display = 'block';
    } else {
        $('#connected-game-cover').style.display = 'none';
    }

    overlay.classList.add('active');
    playSynthSound('connect');

    setTimeout(() => {
        overlay.classList.remove('active');
    }, 4000);
}

// ---------- Details Modal ----------
function openGameDetails(id, fromCompleted = false) {
    const list = fromCompleted ? state.completed : state.backlog;
    const game = list.find(g => g.id === id);
    if (!game) return;

    currentDetailsId = id;
    currentDetailsSource = fromCompleted ? 'completed' : 'backlog';

    $('#details-title').textContent = game.name;
    $('#details-platform').textContent = game.platform;
    $('#details-genre').textContent = game.genre;

    const badge = $('#details-status-badge');
    badge.className = `details-status-badge ${fromCompleted ? 'status-completed' : 'status-backlog'}`;
    badge.textContent = fromCompleted ? 'Terminé' : 'À Jouer';

    if (game.cover) {
        $('#details-cover-large').style.backgroundImage = `url('${game.cover}')`;
        $('#details-cover-large').style.display = 'block';
    } else {
        $('#details-cover-large').style.display = 'none';
    }

    if (fromCompleted) {
        $('#details-date').textContent = formatDate(game.completedAt);
        $('#details-rating-block').style.display = 'block';
        $('#details-stars').innerHTML = renderStars(game.rating || 0);
        $('#details-comment').textContent = game.comment ? `"${game.comment}"` : 'Pas de commentaire.';
        $('#btn-details-complete').style.display = 'none';
    } else {
        $('#details-date').textContent = `Ajouté le ${formatDate(game.addedAt)}`;
        $('#details-rating-block').style.display = 'none';
        $('#btn-details-complete').style.display = 'block';
    }

    if (game.notes) {
        $('#details-notes-block').style.display = 'block';
        $('#details-notes-text').textContent = game.notes;
    } else {
        $('#details-notes-block').style.display = 'none';
    }

    // Render launcher, exe & achievements blocks
    const launcherBlock = $('#details-launcher-block');
    const exeBlock = $('#details-exe-block');
    const achievementsBlock = $('#details-achievements-block');

    if (fromCompleted) {
        launcherBlock.style.display = 'none';
        if (exeBlock) exeBlock.style.display = 'none';
    } else {
        launcherBlock.style.display = 'flex';
        if (exeBlock) exeBlock.style.display = 'flex';
        
        const playBtn = $('#btn-play-game');
        const statusSpan = $('#launcher-status');
        
        if (activePlaySession && activePlaySession.gameId === game.id) {
            playBtn.innerHTML = '<span><svg class="panel-svg" style="width:16px; height:16px; margin-right:6px;" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg> Arrêter le suivi</span>';
            playBtn.className = 'btn-danger btn-full';
            statusSpan.textContent = 'En cours d\'exécution...';
        } else {
            playBtn.innerHTML = '<span><svg class="panel-svg" style="width:16px; height:16px; margin-right:6px;" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> Lancer le jeu</span>';
            playBtn.className = 'btn-primary btn-full';
            statusSpan.textContent = game.exePath ? game.exePath.split('\\').pop() : 'Aucun exécutable lié';
        }
    }

    // Render achievements
    renderAchievementsInDetails(game);

    // Display playtime in details
    const playtime = game.playtime || 0;
    const hours = Math.round(playtime / 60 * 10) / 10;
    const playtimeLabel = playtime > 0 ? ` • <svg class="stat-svg" style="width:12px; height:12px; margin-right:2px; display:inline-block; vertical-align:middle;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${hours}h` : '';

    if (fromCompleted) {
        $('#details-date').innerHTML = formatDate(game.completedAt) + playtimeLabel;
    } else {
        $('#details-date').innerHTML = `Ajouté le ${formatDate(game.addedAt)}${playtimeLabel}`;
    }

    // Sync achievements or attempt auto-fill Steam ID
    if (game.steamAppId) {
        fetchAchievementsFromSteam(game);
    } else if (!fromCompleted) {
        tryAutoFindSteamAppId(game);
    }

    openModal($('#details-overlay'));
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const overlay = $('#confirm-overlay');
        $('#confirm-message').textContent = message;
        openModal(overlay);

        const btnOk = $('#btn-confirm-ok');
        const btnCancel = $('#btn-confirm-cancel');

        const cleanup = () => {
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            closeModal(overlay);
        };

        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}

function showPromptModal(message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = $('#prompt-overlay');
        const input = $('#prompt-input');
        $('#prompt-message').textContent = message;
        input.value = defaultValue;
        openModal(overlay);
        
        setTimeout(() => input.focus(), 300);

        const btnOk = $('#btn-prompt-ok');
        const btnCancel = $('#btn-prompt-cancel');

        const cleanup = () => {
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            closeModal(overlay);
        };

        const onOk = () => {
            const val = input.value.trim();
            cleanup();
            resolve(val);
        };
        const onCancel = () => {
            cleanup();
            resolve(null);
        };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}

async function deleteGame(id, fromCompleted = false) {
    const list = fromCompleted ? 'completed' : 'backlog';
    const game = state[list].find(g => g.id === id);
    if (!game) return;

    const confirmed = await showConfirmModal(`Veux-tu vraiment supprimer "${game.name}" ?`);
    if (confirmed) {
        state[list] = state[list].filter(g => g.id !== id);
        if (id === state.currentGameId) pickRandomGame(false);
        await saveState();
        renderAll();
        showToast(`${game.name} supprimé`, '🗑️');
    }
}

// ---------- Rating & Completion ----------
let pendingCompleteGameId = null;
let selectedRating = 0;

function startCompleteGame(id) {
    const game = state.backlog.find(g => g.id === id);
    if (!game) return;
    pendingCompleteGameId = id;
    selectedRating = 0;
    $('#rating-game-name').textContent = game.name;
    $('#rating-comment').value = '';
    $('#rating-playtime').value = '';
    $$('.star').forEach(s => s.classList.remove('active', 'hover-preview'));
    $('#btn-submit-rating').disabled = true;
    openModal($('#rating-overlay'));
}

async function completeGameWithRating() {
    if (!pendingCompleteGameId || selectedRating === 0) return;
    
    // Stop play session if active for this game
    if (activePlaySession && activePlaySession.gameId === pendingCompleteGameId) {
        await stopPlaySession();
    }
    
    const game = state.backlog.find(g => g.id === pendingCompleteGameId);
    if (!game) return;

    state.backlog = state.backlog.filter(g => g.id !== pendingCompleteGameId);
    game.rating = selectedRating;
    game.completedAt = Date.now();
    game.comment = $('#rating-comment').value.trim();
    
    const playtimeInput = $('#rating-playtime').value.trim();
    if (playtimeInput) {
        // User entered hours, convert to minutes internally
        game.playtime = (parseInt(playtimeInput) || 0) * 60;
    }

    // Gamification reward calculation
    const hours = (game.playtime || 0) / 60;
    const baseCompletionXp = 1000;
    const playtimeBonus = Math.min(hours * 100, 5000); // capped at 50 hours of bonus
    
    let achievementsRatio = 0;
    if (game.achievements && game.achievements.length > 0) {
        const total = game.achievements.length;
        const unlocked = game.achievements.filter(a => a.unlocked).length;
        achievementsRatio = unlocked / total;
    }
    
    const multiplier = 1 + (achievementsRatio * 1.5); // Up to 2.5x multiplier
    const finalXpReward = Math.round((baseCompletionXp + playtimeBonus) * multiplier);
    
    // Gold Reward
    const baseGold = 500;
    const goldPlaytimeBonus = Math.min(hours * 20, 1000);
    const finalGoldReward = Math.round((baseGold + goldPlaytimeBonus) * multiplier);

    state.completed.unshift(game);

    closeModal($('#rating-overlay'));

    if (window.launchConfetti) window.launchConfetti();
    
    // Award XP and Gold
    addXp(finalXpReward);
    addGold(finalGoldReward);
    showToast(`${game.name} terminé ! +${finalXpReward} XP • +${finalGoldReward} 🪙 ! ${selectedRating}/5 ⭐`, '🏆');

    if (state.backlog.length > 0) {
        setTimeout(() => pickRandomGame(true), 800);
    } else {
        state.currentGameId = null;
        await saveState();
        renderAll();
    }
    pendingCompleteGameId = null;
    selectedRating = 0;
}

function isGameCompletionAchievement(ach) {
    const name = (ach.name || '').toLowerCase();
    const desc = (ach.description || '').toLowerCase();
    
    const keywords = [
        // English
        'completed the game', 'completed the campaign', 'completed the story', 
        'finish the game', 'finished the game', 'beat the game', 'beat the final', 
        'epilogue', 'the end', 'campaign completed', 'story completed', 
        'clear the game', 'game cleared', 'credits roll', 'rolled credits',
        'all achievements', 'platinum trophy', 'perfect game', 'final boss defeated',
        'defeated the final boss', 'complete all chapters', 'final chapter',
        
        // French
        'terminer le jeu', 'terminé le jeu', 'fini le jeu', 'finir le jeu',
        'campagne terminée', 'histoire terminée', 'chapitre final', 'épilogue',
        'battre le boss final', 'vaincu le boss final', 'les crédits', 'crédits de fin',
        'tous les succès', 'tous les trophées', 'la fin', 'jeu terminé'
    ];
    
    return keywords.some(kw => name.includes(kw) || desc.includes(kw));
}

async function handleGameAutoCompleted(game, ach) {
    // Only trigger if the game is still in backlog and not already pending completion
    if (!state.backlog.some(g => g.id === game.id)) return;
    if (pendingCompleteGameId === game.id) return;
    
    // Stop play session if active for this game
    if (activePlaySession && activePlaySession.gameId === game.id) {
        await stopPlaySession();
    }
    
    // Notify the overlay
    if (isElectron) {
        window.questlog.showOverlayGameCompleted(game.name, ach.name);
    }
    
    // In-app notification
    showToast(`🏆 Fin de jeu détectée pour ${game.name} ! (Succès : ${ach.name})`, '🏆');
    
    // Set pending complete ID
    pendingCompleteGameId = game.id;
    selectedRating = 0;
    
    // Pre-fill fields in the rating popup
    $('#rating-game-name').textContent = game.name;
    $('#rating-playtime').value = Math.round((game.playtime || 0) / 60);
    $('#rating-comment').value = `Fini automatiquement via le succès "${ach.name}" !`;
    $$('.star').forEach(s => s.classList.remove('active', 'hover-preview'));
    $('#btn-submit-rating').disabled = true;
    
    // Open rating modal
    openModal($('#rating-overlay'));
}

function pickRandomGame(showAnimation = true) {
    if (state.backlog.length === 0) {
        state.currentGameId = null;
        saveState();
        renderAll();
        return;
    }

    let available = state.backlog.filter(g => g.id !== state.currentGameId);
    if (available.length === 0) available = state.backlog;
    const picked = available[Math.floor(Math.random() * available.length)];

    if (showAnimation) {
        const overlay = $('#random-pick-overlay');
        openModal(overlay);
        $('#random-pick-wheel').style.display = 'flex';
        $('#random-pick-result').classList.remove('visible');

        setTimeout(() => {
            $('#random-pick-wheel').style.display = 'none';
            $('#random-pick-name').textContent = picked.name;
            $('#random-pick-platform').textContent = `${picked.platform} • ${picked.genre}`;
            if (picked.cover) {
                $('#random-pick-cover').style.backgroundImage = `url('${picked.cover}')`;
                $('#random-pick-cover').style.display = 'block';
            } else {
                $('#random-pick-cover').style.display = 'none';
            }
            $('#random-pick-result').classList.add('visible');
            state.currentGameId = picked.id;
            saveState();
            renderAll();
        }, 2000);
    } else {
        state.currentGameId = picked.id;
        saveState();
        renderAll();
    }
}

// ---------- Confetti ----------
window.launchConfetti = function() {
    const canvas = $('#confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#a78bfa', '#6366f1', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#ef4444'];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: -Math.random() * 18 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            gravity: 0.3 + Math.random() * 0.2,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
        });
    }
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.opacity <= 0) return;
            alive = true;
            p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.vx *= 0.98;
            p.rotation += p.rotationSpeed;
            if (frame > 60) p.opacity -= 0.02;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        });
        frame++;
        if (alive) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(animate);
};

// ---------- Import / Export ----------
async function exportData() {
    const data = {
        version: 4,
        exportDate: new Date().toISOString(),
        backlog: state.backlog,
        completed: state.completed,
        currentGameId: state.currentGameId,
    };

    if (isElectron) {
        const result = await window.questlog.exportData(data);
        if (result.success) showToast('Données exportées !', '📦');
    } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questlog_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Données exportées !', '📦');
    }
}

async function importData() {
    let importedData = null;

    if (isElectron) {
        const result = await window.questlog.importData();
        if (!result.success) return;
        importedData = result.data;
    } else {
        return; // handled by file input in browser mode
    }

    mergeImportedData(importedData);
}

function mergeImportedData(data) {
    if (!data || (!data.backlog && !data.completed)) {
        showToast('Fichier invalide. Format non reconnu.', '❌');
        return;
    }

    const existingBacklogIds = new Set(state.backlog.map(g => g.id));
    const existingCompletedIds = new Set(state.completed.map(g => g.id));
    let addedBacklog = 0, addedCompleted = 0;

    if (data.backlog) {
        data.backlog.forEach(g => {
            if (!existingBacklogIds.has(g.id) && !existingCompletedIds.has(g.id)) {
                state.backlog.push(g); addedBacklog++;
            }
        });
    }
    if (data.completed) {
        data.completed.forEach(g => {
            if (!existingBacklogIds.has(g.id) && !existingCompletedIds.has(g.id)) {
                state.completed.push(g); addedCompleted++;
            }
        });
    }

    if (!state.currentGameId && state.backlog.length > 0) pickRandomGame(false);
    saveState();
    isInitialRender = true;
    renderAll();
    showToast(`Import réussi : +${addedBacklog} backlog, +${addedCompleted} terminés`, '📥');
}

async function clearAllData() {
    const confirmed = await showConfirmModal('⚠️ Supprimer TOUTES les données ? Cette action est irréversible.');
    if (!confirmed) return;
    
    const finalConfirm = await showConfirmModal('Vraiment tout supprimer ? Dernière chance !');
    if (!finalConfirm) return;

    state.backlog = [];
    state.completed = [];
    state.currentGameId = null;
    state.profile = null;
    
    if (isElectron) {
        await window.questlog.deleteProfile();
    }
    
    await saveState();
    renderAll();
    closeModal($('#settings-overlay'));
    showToast('Toutes les données ont été supprimées.', '🗑️');
    
    // Auto-redirect to Profile Creation screen
    setTimeout(() => {
        const overlay = $('#profile-creation-overlay');
        if (overlay) {
            $('#profile-creation-username').value = '';
            openModal(overlay);
        }
    }, 500);
}

// ---------- Sort Dropdowns ----------
function setupSortDropdowns() {
    const menus = [
        { btn: '#btn-sort-backlog', menu: '#menu-sort-backlog', type: 'backlog' },
        { btn: '#btn-sort-completed', menu: '#menu-sort-completed', type: 'completed' }
    ];

    menus.forEach(({ btn, menu, type }) => {
        $(btn).addEventListener('click', (e) => {
            e.stopPropagation();
            $$('.sort-menu').forEach(m => {
                if (m.id !== menu.substring(1)) m.classList.remove('active');
            });
            $(menu).classList.toggle('active');

            const currentSort = type === 'backlog' ? state.backlogSort : state.completedSort;
            $(menu).querySelectorAll('.sort-option').forEach(opt => {
                opt.classList.toggle('active-sort', opt.dataset.sort === currentSort);
            });
        });

        $(menu).querySelectorAll('.sort-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (type === 'backlog') state.backlogSort = opt.dataset.sort;
                else state.completedSort = opt.dataset.sort;

                saveState();
                isInitialRender = false;
                renderAll();
                $(menu).classList.remove('active');
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sort-container')) {
            $$('.sort-menu').forEach(m => m.classList.remove('active'));
        }
    });
}

// ---------- Initialisation & Events ----------
function initEvents() {
    setupSortDropdowns();

    // Window Controls (Electron)
    if (isElectron) {
        $('#btn-win-minimize')?.addEventListener('click', () => window.questlog.minimizeWindow());
        $('#btn-win-maximize')?.addEventListener('click', () => window.questlog.maximizeWindow());
        $('#btn-win-close')?.addEventListener('click', () => {
            // Trigger native OS notification
            try {
                if (Notification.permission === "granted") {
                    new Notification("Quest Log", {
                        body: "L'application continue de tourner en arrière-plan (Tray) ! 🤖",
                        icon: "icon.png"
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("Quest Log", {
                                body: "L'application continue de tourner en arrière-plan (Tray) ! 🤖",
                                icon: "icon.png"
                            });
                        }
                    });
                }
            } catch (e) {}

            // Hide window instantly to avoid any rendering bugs
            window.questlog.closeWindow();
        });
    } else {
        const tb = $('#app-titlebar');
        if (tb) tb.style.display = 'none';
    }

    // Settings
    $('#btn-settings').addEventListener('click', () => {
        $('#steam-api-key').value = state.steamApiKey || '';
        $('#steam-profile-input').value = state.steamProfileInput || state.steamId || '';
        if (state.steamId) {
            $('#steam-status-label').textContent = '✅ Connecté';
            $('#steam-status-label').style.color = 'var(--accent-emerald)';
        } else {
            $('#steam-status-label').textContent = 'Non connecté';
            $('#steam-status-label').style.color = '';
        }
        
        const discordInput = $('#discord-client-id-input');
        if (discordInput) {
            discordInput.value = state.discordClientId || '';
        }
        
        if (isElectron) {
            window.questlog.getAutoLaunch().then(enabled => {
                $('#chk-auto-launch').checked = enabled;
            });
        } else {
            $('#chk-auto-launch').disabled = true;
        }

        openModal($('#settings-overlay'));
    });

    // Discord RPC settings
    const btnSaveDiscordRpc = $('#btn-save-discord-rpc');
    if (btnSaveDiscordRpc) {
        btnSaveDiscordRpc.addEventListener('click', async () => {
            const val = $('#discord-client-id-input').value.trim();
            state.discordClientId = val;
            await saveState();
            if (isElectron) {
                await window.questlog.updateDiscordClientId(val);
                showToast("Identifiant Discord RPC mis à jour !", "👾");
            } else {
                showToast("Identifiant Discord RPC enregistré !", "👾");
            }
        });
    }

    if (isElectron) {
        window.questlog.onDiscordRpcStatus((status, errorMsg) => {
            const label = $('#discord-status-label');
            if (!label) return;
            if (status === 'connected') {
                label.textContent = '✅ Connecté';
                label.style.color = 'var(--accent-emerald)';
            } else if (status === 'disconnected') {
                label.textContent = 'Déconnécté';
                label.style.color = 'var(--text-tertiary)';
            } else if (status === 'error') {
                if (errorMsg && errorMsg.includes('Invalid Client ID')) {
                    label.textContent = '❌ ID Invalide';
                    label.style.color = 'var(--accent-red)';
                } else {
                    label.textContent = 'Non connecté';
                    label.style.color = 'var(--text-tertiary)';
                }
            }
        });
    }

    $('#chk-auto-launch').addEventListener('change', async (e) => {
        if (isElectron) {
            const enabled = e.target.checked;
            const res = await window.questlog.setAutoLaunch(enabled);
            if (res.success) {
                showToast(enabled ? "Lancement au démarrage activé !" : "Lancement au démarrage désactivé.", "⚙️");
            } else {
                showToast("Erreur lors de la configuration.", "❌");
            }
        }
    });

    $('#btn-save-steam-config').addEventListener('click', async () => {
        const profileInput = $('#steam-profile-input').value.trim();
        const apiKey = $('#steam-api-key').value.trim();
        const btn = $('#btn-save-steam-config');

        if (!profileInput) {
            state.steamId = '';
            state.steamProfileInput = '';
            state.steamApiKey = '';
            await saveState();
            $('#steam-status-label').textContent = 'Non connecté';
            $('#steam-status-label').style.color = '';
            showToast('Liaison Steam retirée.', 'ℹ️');
            return;
        }

        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Liaison...';

        try {
            const res = await window.questlog.resolveSteamId(profileInput);
            if (res.success) {
                state.steamId = res.steamId;
                state.steamProfileInput = profileInput;
                state.steamApiKey = apiKey;
                await saveState();

                $('#steam-status-label').textContent = '✅ Connecté';
                $('#steam-status-label').style.color = 'var(--accent-emerald)';
                showToast('Liaison Steam réussie !', '🔌');
            } else {
                showToast(res.error || 'Impossible de lier le compte.', '❌');
            }
        } catch (err) {
            showToast('Erreur de connexion avec Steam.', '❌');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    
    // Themes
    $$('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.theme = btn.dataset.theme;
            applyTheme(state.theme);
            saveState();
        });
    });

    $('#btn-export-data').addEventListener('click', exportData);
    $('#btn-import-data').addEventListener('click', () => {
        if (isElectron) {
            importData();
        } else {
            $('#import-file-input').click();
        }
    });

    $('#form-profile-creation').addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = $('#profile-creation-username').value.trim();
        if (usernameInput.length < 2) {
            showToast('Le pseudo doit contenir au moins 2 caractères.', '⚠️');
            return;
        }

        state.profile = {
            username: usernameInput,
            xp: 0,
            level: 1,
            gold: 0
        };

        await saveState();
        updateProfileUI();
        closeModal($('#profile-creation-overlay'));
        playSynthSound('levelup');
        if (window.launchConfetti) window.launchConfetti();
        showToast(`Bienvenue dans ton Quest Log, ${usernameInput} ! ⚔️`, '✨');
    });
    const importInput = $('#import-file-input');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        mergeImportedData(data);
                    } catch (err) {
                        showToast("Erreur lors de l'import. Fichier corrompu ?", '❌');
                    }
                };
                reader.readAsText(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    $('#btn-clear-all-data').addEventListener('click', clearAllData);

    // Modals
    $$('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const overlayId = btn.dataset.close;
            if (overlayId) closeModal($(`#${overlayId}`));
        });
    });

    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
    });

    // Add Game Flow
    $('#btn-add-game').addEventListener('click', () => {
        openModal($('#modal-overlay'));
        $('#search-interface').style.display = 'block';
        const apiKeySetup = $('#api-key-setup');
        if (apiKeySetup) apiKeySetup.style.display = 'none';
        $('#tab-search').click();
        
        // Load default games immediately if no query
        const query = $('#rawg-search-input').value;
        performSearch(query);

        // Focus search input
        setTimeout(() => $('#rawg-search-input').focus(), 300);
    });

    // Search input
    $('#rawg-search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value, false);
        }, 400);
    });

    // Search infinite scroll
    $('#search-results').addEventListener('scroll', (e) => {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
            performSearch(currentSearchQuery, true);
        }
    });

    // Custom Dropdowns Logic
    $$('.custom-dropdown-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = btn.parentElement;
            const wasActive = parent.classList.contains('active');
            $$('.custom-dropdown').forEach(d => d.classList.remove('active'));
            if (!wasActive) parent.classList.add('active');
        });
    });

    document.addEventListener('click', () => {
        $$('.custom-dropdown').forEach(d => d.classList.remove('active'));
    });

    $$('.custom-dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing when clicking inside
        });
    });

    // Update Dropdown text and trigger search
    $$('.custom-dropdown-item input').forEach(input => {
        input.addEventListener('change', (e) => {
            const dropdown = e.target.closest('.custom-dropdown');
            const btn = dropdown.querySelector('.custom-dropdown-btn');
            
            if (input.type === 'radio') {
                btn.innerHTML = input.nextElementSibling.innerHTML;
                dropdown.classList.remove('active');
            } else if (input.type === 'checkbox') {
                const checked = Array.from(dropdown.querySelectorAll('input:checked'));
                if (checked.length === 0) {
                    btn.innerHTML = dropdown.id === 'dropdown-platform' ? 'Toutes plateformes' : 'Tous genres';
                } else if (checked.length === 1) {
                    btn.innerHTML = checked[0].nextElementSibling.innerHTML;
                } else {
                    btn.innerHTML = `${checked.length} sélectionnés`;
                }
            }
            
            // Reset offset and fetch
            performSearch($('#rawg-search-input').value, false);
        });
    });

    // PC Scanner
    let scannedGames = [];
    $('#btn-open-scanner').addEventListener('click', async () => {
        openModal($('#scanner-overlay'));
        $('#scanner-loading').style.display = 'block';
        $('#scanner-results').style.display = 'none';
        $('#scanner-actions').style.display = 'none';
        $('#scanner-results').innerHTML = '';

        const games = await window.questlog.scanLocalGames();
        
        $('#scanner-loading').style.display = 'none';
        
        if (games.length === 0) {
            $('#scanner-results').innerHTML = '<p style="text-align:center; color: var(--text-tertiary); padding: 20px;">Aucun jeu trouvé sur le PC.</p>';
            $('#scanner-results').style.display = 'block';
            return;
        }

        scannedGames = games.map(g => ({ ...g, selected: false }));
        renderScannedGames();
        $('#scanner-results').style.display = 'flex';
        $('#scanner-actions').style.display = 'flex';
    });

    function renderScannedGames() {
        const container = $('#scanner-results');
        container.innerHTML = '';
        scannedGames.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = `scanner-item ${game.selected ? 'selected' : ''}`;
            item.style.animationDelay = `${index * 0.05}s`;
            item.innerHTML = `
                <div class="scanner-checkbox"></div>
                <div class="scanner-info">
                    <span class="scanner-name">${game.name}</span>
                    <span class="scanner-platform">${game.platform}</span>
                </div>
            `;
            item.addEventListener('click', () => {
                game.selected = !game.selected;
                item.classList.toggle('selected', game.selected);
                updateScannerAddButton();
            });
            container.appendChild(item);
        });
        updateScannerAddButton();
    }

    function updateScannerAddButton() {
        const count = scannedGames.filter(g => g.selected).length;
        const btnAdd = $('#btn-scanner-add');
        btnAdd.disabled = count === 0;
        btnAdd.innerText = count > 0 ? `Ajouter la sélection (${count})` : 'Ajouter la sélection';
    }

    $('#btn-scanner-select-all').addEventListener('click', () => {
        const allSelected = scannedGames.every(g => g.selected);
        scannedGames.forEach(g => g.selected = !allSelected);
        // We only re-render the whole list for "select all" because it's a global action.
        // We can temporarily disable animation to avoid the bounce effect here.
        const container = $('#scanner-results');
        const oldAnim = container.style.animation;
        renderScannedGames();
    });

    $('#btn-scanner-add').addEventListener('click', async () => {
        const selected = scannedGames.filter(g => g.selected);
        if (selected.length === 0) return;
        
        $('#scanner-overlay').classList.remove('active');
        closeModal($('#modal-overlay'));
        
        let addedCount = 0;
        for (const g of selected) {
            const exists = state.backlog.some(x => x.name.toLowerCase() === g.name.toLowerCase()) || 
                           state.completed.some(x => x.name.toLowerCase() === g.name.toLowerCase());
            if (!exists) {
                // Determine platform correctly
                let platformVal = 'PC';
                if (g.platform === 'PC (Xbox)') platformVal = 'Xbox Series';
                
                await addGame(g.name, platformVal, 'Autre', '', '', true);
                addedCount++;
            }
        }
        
        if (addedCount > 0) {
            showToast(`${addedCount} jeu(x) ajouté(s) au backlog !`, '🖥️');
        } else {
            showToast(`Tous les jeux sélectionnés étaient déjà présents.`, 'ℹ️');
        }
    });

    // Tabs
    $$('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.modal-tab').forEach(t => t.classList.remove('active'));
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            $(`#tab-content-${tab.dataset.tab}`).classList.add('active');
        });
    });



    // Game List Interactions
    $('#backlog-list').addEventListener('click', (e) => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        const id = card.dataset.id;

        if (e.target.closest('.btn-complete-game')) {
            startCompleteGame(id);
        } else if (e.target.closest('.btn-delete-game')) {
            deleteGame(id, false);
        } else {
            openGameDetails(id, false);
        }
    });

    $('#completed-list').addEventListener('click', (e) => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        const id = card.dataset.id;

        if (e.target.closest('.btn-restore-game')) {
            const game = state.completed.find(g => g.id === id);
            if (game) {
                state.completed = state.completed.filter(g => g.id !== id);
                delete game.rating; delete game.completedAt; delete game.comment; delete game.playtime; delete game.isFavorite;
                state.backlog.unshift(game);
                saveState(); renderAll();
                showToast(`${game.name} restauré`, '↩️');
            }
        } else if (e.target.closest('.btn-delete-game')) {
            deleteGame(id, true);
        } else if (e.target.closest('.btn-favorite-game')) {
            const game = state.completed.find(g => g.id === id);
            if (game) {
                game.isFavorite = !game.isFavorite;
                saveState(); renderAll();
            }
        } else {
            openGameDetails(id, true);
        }
    });

    // Filtering
    $('#backlog-search').addEventListener('input', (e) => {
        isInitialRender = false;
        renderBacklog(e.target.value);
    });
    $('#completed-search').addEventListener('input', (e) => {
        isInitialRender = false;
        renderCompleted(e.target.value);
    });

    // Details Modal Actions
    $('#btn-details-complete').addEventListener('click', () => {
        closeModal($('#details-overlay'));
        if (currentDetailsId) startCompleteGame(currentDetailsId);
    });

    $('#btn-details-delete').addEventListener('click', () => {
        closeModal($('#details-overlay'));
        if (currentDetailsId) deleteGame(currentDetailsId, currentDetailsSource === 'completed');
    });

    // Launcher & Steam bindings
    $('#btn-play-game').addEventListener('click', () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId);
        if (!game) return;
        
        if (activePlaySession && activePlaySession.gameId === game.id) {
            stopPlaySession();
        } else {
            startPlaySession(game);
        }
    });

    $('#btn-select-exe').addEventListener('click', () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId);
        if (game) selectExeFile(game, true);
    });

    // Rating
    const stars = $$('.star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.toggle('hover-preview', parseInt(s.dataset.value) <= val));
        });
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
                s.classList.remove('hover-preview');
            });
            $('#btn-submit-rating').disabled = false;
        });
    });
    $('#star-rating').addEventListener('mouseleave', () => stars.forEach(s => s.classList.remove('hover-preview')));
    $('#btn-submit-rating').addEventListener('click', completeGameWithRating);

    // Random Pick Accept
    $('#btn-accept-pick').addEventListener('click', () => closeModal($('#random-pick-overlay')));

    // Now Playing Skip/Complete
    $('#btn-complete-current').addEventListener('click', () => {
        if (state.currentGameId) startCompleteGame(state.currentGameId);
    });
    $('#btn-skip-current').addEventListener('click', () => pickRandomGame(true));

    // Auto-update UI logic
    if (isElectron) {
        const btnCheckUpdates = $('#btn-check-updates');
        const updateStatusLabel = $('#update-status-label');
        
        if (btnCheckUpdates) {
            btnCheckUpdates.addEventListener('click', async () => {
                isManualUpdateCheck = true;
                if (updateStatusLabel) {
                    updateStatusLabel.textContent = 'Recherche...';
                    updateStatusLabel.style.color = '';
                }
                await window.questlog.checkForUpdates();
            });
        }

        const btnUpdateCancel = $('#btn-update-cancel');
        const btnUpdateConfirm = $('#btn-update-confirm');
        const updateOverlayEl = $('#update-overlay');

        if (btnUpdateCancel) {
            btnUpdateCancel.addEventListener('click', () => {
                closeModal(updateOverlayEl);
            });
        }

        if (btnUpdateConfirm) {
            btnUpdateConfirm.addEventListener('click', async () => {
                const actionText = btnUpdateConfirm.textContent;
                if (actionText === 'Télécharger') {
                    btnUpdateConfirm.disabled = true;
                    btnUpdateConfirm.textContent = 'Téléchargement...';
                    $('#update-progress-container').style.display = 'block';
                    await window.questlog.startUpdateDownload();
                } else if (actionText === 'Installer et Redémarrer') {
                    await window.questlog.installUpdateNow();
                }
            });
        }

        window.questlog.onUpdateStatus((status, info) => {
            if (updateStatusLabel) {
                if (status === 'checking') {
                    updateStatusLabel.textContent = 'Recherche...';
                } else if (status === 'available') {
                    updateStatusLabel.textContent = 'Update disponible !';
                    updateStatusLabel.style.color = 'var(--accent-pink)';
                    
                    $('#update-modal-version').textContent = `Version ${info.version || 'Nouvelle'}`;
                    $('#update-modal-message').innerHTML = `Une nouvelle version de Quest Log est disponible : <strong>v${info.version}</strong>.<br><br>Souhaitez-vous la télécharger et l'installer maintenant ?`;
                    $('#update-progress-container').style.display = 'none';
                    btnUpdateConfirm.disabled = false;
                    btnUpdateConfirm.textContent = 'Télécharger';
                    btnUpdateCancel.textContent = 'Plus tard';
                    openModal(updateOverlayEl);
                } else if (status === 'not-available') {
                    updateStatusLabel.textContent = 'À jour';
                    updateStatusLabel.style.color = 'var(--accent-emerald)';
                    if (isManualUpdateCheck) {
                        showToast('Quest Log est déjà à jour !', '✅');
                    }
                    isManualUpdateCheck = false;
                } else if (status === 'ready') {
                    updateStatusLabel.textContent = 'Mise à jour prête !';
                    updateStatusLabel.style.color = 'var(--accent-pink)';
                    
                    $('#update-progress-container').style.display = 'none';
                    btnUpdateConfirm.disabled = false;
                    btnUpdateConfirm.textContent = 'Installer et Redémarrer';
                    btnUpdateCancel.textContent = 'Annuler';
                    $('#update-modal-message').textContent = "La mise à jour a été téléchargée. Veuillez redémarrer l'application pour l'appliquer.";
                    openModal(updateOverlayEl);
                    isManualUpdateCheck = false;
                } else if (status === 'error') {
                    updateStatusLabel.textContent = 'Erreur';
                    updateStatusLabel.style.color = 'var(--accent-red)';
                    
                    // Only show alert to user if it was a manual click, and format it cleanly
                    if (isManualUpdateCheck) {
                        const errMsg = info ? (info.message || info) : 'Inaccessible';
                        showToast(`Erreur de connexion : ${errMsg}`, "❌");
                    }
                    isManualUpdateCheck = false;
                }
            }
        });

        window.questlog.onUpdateProgress((percent) => {
            const rounded = Math.round(percent);
            const progressBar = $('#update-progress-bar');
            const progressPercent = $('#update-progress-percent');
            if (progressBar) progressBar.style.width = `${rounded}%`;
            if (progressPercent) progressPercent.textContent = `${rounded}%`;
        });
    } else {
        const checkBtn = $('#btn-check-updates');
        if (checkBtn) checkBtn.disabled = true;
    }

    // Changelog close button
    $('#btn-close-changelog')?.addEventListener('click', () => {
        closeModal($('#changelog-overlay'));
    });
}

// ---------- Particles ----------
function createParticles() {
    const container = $('#particles-bg');
    if (!container) return;
    const colors = ['#a78bfa', '#6366f1', '#f472b6', '#60a5fa', '#34d399'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 12) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        const size = (2 + Math.random() * 3) + 'px';
        p.style.width = size; p.style.height = size;
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(p);
    }
}

async function init() {
    await loadState();
    createParticles();
    initEvents();
    renderAll();

    if (isElectron) {
        window.questlog.onGameClosed((gameId) => {
            if (activePlaySession && activePlaySession.gameId === gameId) {
                stopPlaySession();
            }
        });

        window.questlog.onAutoGameDetected((gameId) => {
            if (activePlaySession && activePlaySession.gameId === gameId) return;
            if (activePlaySession) return; // already tracking something else
            
            const game = state.backlog.find(g => g.id === gameId);
            if (game) {
                startPlaySession(game, true);
                showToast(`🎮 Lancement de ${game.name} détecté !`, '🔌');
            }
        });

        window.questlog.onAutoGameClosed((gameId) => {
            if (activePlaySession && activePlaySession.gameId === gameId) {
                stopPlaySession();
            }
        });

        window.questlog.onLocalAchievementsUpdated(async (newlyUnlockedApinames) => {
            if (!activePlaySession) return;
            const game = state.backlog.find(g => g.id === activePlaySession.gameId);
            if (!game) return;

            let updatedAny = false;
            for (const apiname of newlyUnlockedApinames) {
                const ach = game.achievements.find(a => {
                    const cleanLoc = apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanApi = a.apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanName = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanLoc === cleanApi || cleanLoc === cleanName || cleanLoc.includes(cleanApi) || cleanApi.includes(cleanLoc);
                });
                if (ach && !ach.unlocked) {
                    ach.unlocked = true;
                    ach.unlockTime = Math.floor(Date.now() / 1000);
                    updatedAny = true;
                    
                    // Award XP and Gold
                    addXp(250);
                    addGold(50);
                    
                    // Show in-app toast
                    showAchievementToast(ach.name, ach.description, 250, ach.icon);
                    
                    // Show overlay toast
                    window.questlog.showOverlayAchievement({
                        name: ach.name,
                        description: ach.description,
                        icon: ach.icon
                    });

                    // Auto detect game completion from achievement
                    if (isGameCompletionAchievement(ach)) {
                        handleGameAutoCompleted(game, ach);
                    }
                }
            }

            if (updatedAny) {
                await saveState();
                updateNowPlaying();
                if (currentDetailsId === game.id) {
                    renderAchievementsInDetails(game);
                }
                isInitialRender = false;
                renderBacklog($('#backlog-search').value);
            }
        });
    }

    if (!state.currentGameId && state.backlog.length > 0) {
        pickRandomGame(false);
    }

    // Check if app version has updated to show release notes
    await checkAndShowChangelog();
}

async function checkAndShowChangelog() {
    if (!isElectron) return;
    try {
        const currentVersion = await window.questlog.getAppVersion();
        const lastSeen = state.lastVersionSeen || '';
        
        // Only show if the version has changed
        if (currentVersion && lastSeen !== currentVersion) {
            // If it's a completely clean installation with no games and no username,
            // just silently record version to avoid cluttering startup screen for new users.
            if (state.backlog.length === 0 && state.completed.length === 0 && (!state.profile || !state.profile.username)) {
                state.lastVersionSeen = currentVersion;
                await saveState();
                return;
            }
            
            const logData = CHANGELOGS[currentVersion];
            if (logData) {
                const badgeEl = $('#changelog-badge');
                const titleEl = $('#changelog-modal-title');
                const dateEl = $('#changelog-date');
                const listEl = $('#changelog-items-list');

                if (badgeEl) badgeEl.textContent = logData.badge;
                if (titleEl) titleEl.textContent = logData.title;
                if (dateEl) dateEl.textContent = `Date de déploiement : ${logData.date}`;
                
                if (listEl) {
                    listEl.innerHTML = '';
                    logData.items.forEach(item => {
                        const itemEl = document.createElement('div');
                        itemEl.style.display = 'flex';
                        itemEl.style.gap = '14px';
                        itemEl.style.alignItems = 'flex-start';
                        itemEl.style.background = 'rgba(255, 255, 255, 0.02)';
                        itemEl.style.border = '1px solid var(--bg-glass-border)';
                        itemEl.style.borderRadius = 'var(--radius-md)';
                        itemEl.style.padding = '12px';
                        
                        itemEl.innerHTML = `
                            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; background: rgba(244, 114, 182, 0.1); border: 1px solid rgba(244, 114, 182, 0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-pink);">
                                ${item.icon}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${item.title}</h4>
                                <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${item.desc}</p>
                            </div>
                        `;
                        listEl.appendChild(itemEl);
                    });
                }
                
                // Save version seen
                state.lastVersionSeen = currentVersion;
                await saveState();
                
                // Show modal
                openModal($('#changelog-overlay'));
            }
        }
    } catch (e) {
        console.error('Failed to check changelog:', e);
    }
}

document.addEventListener('DOMContentLoaded', init);
