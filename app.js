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
    activityHistory: {},
    lastVersionSeen: '',
    dailyBoost: null
};

// ---------- Changelogs ----------
const CHANGELOGS = {
    '0.0.8': {
        title: "Quest Log v0.0.8 — Paramètres Avancés & Raccourcis",
        date: "10 Juillet 2026",
        badge: "Minor Update",
        items: [
            {
                title: "Paramètres Avancés Épurés",
                desc: "Les options techniques (Liaison Steam AppID, SteamID Perso, Fichier .exe) sont maintenant regroupées dans un panneau accordéon compact et discret. Le bouton de bascule s'intègre sans bordure visible directement dans l'onglet Lancement pour garder une interface claire.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>`
            },
            {
                title: "Raccourcis Utiles",
                desc: "Ajout de boutons de redirection directe. Vous pouvez maintenant cliquer sur « Voir sur Steam » pour ouvrir instantanément la page magasin du jeu, ou sur « Dossier » pour explorer les fichiers locaux de l'exécutable lié en un clic.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>`
            },
            {
                title: "Stabilisation & Boosts Intelligents",
                desc: "Les jeux non sortis (comme Light No Fire) sont désormais exclus du calcul des Boosts Quotidiens d'XP. Les étiquettes affichent « Soon » de manière universelle, et la persistance des suppressions de SteamID Custom a été fiabilisée.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>`
            }
        ]
    },
    '0.0.7': {
        title: "Quest Log v0.0.7 — Horizon",
        date: "9 Juillet 2026",
        badge: "Major Update",
        items: [
            {
                title: "Compte à Rebours de Sortie",
                desc: "Les jeux pas encore sortis affichent un badge en temps réel sur leur jaquette (7h, J-3, Bientôt...) avec l'heure exacte de déblocage récupérée depuis Steam. La fiche affiche la date de sortie et le bouton de lancement passe en mode « Bientôt disponible ».",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`
            },
            {
                title: "Mega Boost Diamant",
                desc: "Chaque jour, vos jeux en Boost ont désormais 5% de chance d'obtenir un Mega Boost violet (x2 XP). Reconnaissable à son diamant exclusif, il est ultra rare et précieux !",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <polygon points="12 2 20 9 12 22 4 9"/>
                    <line x1="4" y1="9" x2="20" y2="9"/>
                    <line x1="8" y1="2" x2="6" y2="9"/>
                    <line x1="16" y1="2" x2="18" y2="9"/>
                    <line x1="12" y1="9" x2="12" y2="22"/>
                </svg>`
            },
            {
                title: "Fiche de Détails Premium",
                desc: "Les fiches de jeux utilisent désormais les wallpapers Steam en haute définition comme bannière, avec un fallback intelligent sur IGDB HD pour les jeux non sortis ou non Steam.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>`
            },
            {
                title: "Sécurisation XP Succès",
                desc: "Protection anti-doublon d'XP lors de la re-synchronisation de succès déjà débloqués (partage familial Steam, ré-ajout de jeu). Le Daily Boost est plafonné à 2 jeux maximum par jour.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>`
            },
            {
                title: "Améliorations UI/UX",
                desc: "Badges toujours alignés à droite sur une seule ligne. Icônes SVG pures partout (zéro emoji couleur). Dates traduites en temps réel (FR/EN). Jeux sans date de sortie affichent « Bientôt » / « À déterminer ».",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>`
            }
        ]
    },
    '0.0.6': {
        title: "Quest Log v0.0.6 — Tableau de Bord & Intégration RPG",
        date: "8 Juillet 2026",
        badge: "Giga Update",
        items: [
            {
                title: "Enrichissement du Tableau de Bord",
                desc: "Profitez d'un layout premium double-colonne sans défilement. Intègre désormais votre Niveau, votre Temps de Jeu global, votre Complétion et vos Succès dans une grille 2x2 harmonieuse, avec un outil de classification de Classe d'Aventurier (Mage, Guerrier, Assassin...) basé sur vos genres favoris.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                </svg>`
            },
            {
                title: "Suivi Interactif & Tooltips GitHub",
                desc: "Survolez la grille d'activité sur 12 semaines pour voir instantanément vos statistiques quotidiennes via un tooltip personnalisé en verre dépoli (sans latence).",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>`
            },
            {
                title: "Top 3 des Jeux les Plus Joués",
                desc: "Affiche vos 3 jeux favoris avec des barres de progression proportionnelles, des jaquettes miniatures et des indicateurs de rang épurés.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>`
            },
            {
                title: "Liaison Steam AppID & Sécurisation XP",
                desc: "Modifiez l'AppID de vos jeux directement depuis leur fiche de détails. Sécurisation anti-doublon d'XP (flag xpAwarded) empêchant de regagner de l'XP en consultant un jeu synchronisé.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>`
            },
            {
                title: "PC Scanner intelligent & automatique",
                desc: "Le scanner de jeux installés extrait désormais à 100% l'AppID Steam des fichiers locaux (.acf) et trouve le meilleur exécutable (.exe) de façon autonome. Tout est lié d'office sans action manuelle requise !",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="2" y="2" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>`
            }
        ]
    },
    '0.0.5': {
        title: "Quest Log v0.0.5 — Stats & Persistence",
        date: "8 Juillet 2026",
        badge: "New Features",
        items: [
            {
                title: "Tableau de Bord de Statistiques",
                desc: "Cliquez sur vos jetons de profil pour ouvrir une modale interactive. Elle regroupe votre XP cumulé, votre taux de complétion, vos derniers succès débloqués ainsi qu'une grille d'activité sur 12 semaines s'adaptant à vos thèmes.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>`
            },
            {
                title: "Persistance du jeu en cours",
                desc: "Le dernier jeu lancé reste désormais ancré dans votre section active, évitant de charger un jeu aléatoire au redémarrage de l'ordinateur.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>`
            },
            {
                title: "Expérience audio immersive",
                desc: "Refonte du synthétiseur de sons avec une cloche cristalline pour les succès (style Steam) et un drop de basse métallique profond pour les montées de niveau (style Fire Force).",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>`
            }
        ]
    },
    '0.0.4': {
        title: "Quest Log v0.0.4 — Polish & Themes",
        date: "7 Juillet 2026",
        badge: "Minor Update",
        items: [
            {
                title: "Thèmes immersifs",
                desc: "Les thèmes Émeraude, Bleu et Rose profitent d'arrière-plans et de conteneurs finement teintés pour une expérience encore plus colorée et soignée.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                    <path d="M7.5 10.5C8.32843 10.5 9 9.82843 9 9C9 8.17157 8.32843 7.5 7.5 7.5C6.67157 7.5 6 8.17157 6 9C6 9.82843 6.67157 10.5 7.5 10.5Z"/>
                    <path d="M11.5 7.5C12.3284 7.5 13 6.82843 13 6C13 5.17157 12.3284 4.5 11.5 4.5C10.6716 4.5 10 5.17157 10 6C10 6.82843 10.6716 7.5 11.5 7.5Z"/>
                    <path d="M16.5 9.5C17.3284 9.5 18 8.82843 18 8C18 7.17157 17.3284 6.5 16.5 6.5C15.6716 6.5 15 7.17157 15 8C15 8.82843 15.6716 9.5 16.5 9.5Z"/>
                </svg>`
            },
            {
                title: "Nouveaux filtres de tri",
                desc: "Tri intelligent par 'Succès débloqués' et 'Temps de jeu' sur vos listes 'À jouer' et 'Terminés' pour organiser votre backlog à votre rythme.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>`
            },
            {
                title: "Tri de rareté & correctifs",
                desc: "Classement automatique de vos succès débloqués par rareté RPG décroissante. Résolution des anomalies de traduction et uniformisation des toasts.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>`
            }
        ]
    },
    '0.0.3': {
        title: "Quest Log v0.0.3 — Global Update",
        date: "7 Juillet 2026",
        badge: "Major Improvements",
        items: [
            {
                title: "🌍 Système Multilingue / Multilingual",
                desc: "Quest Log est entièrement traduit en Français et Anglais. Les succès Steam s'adaptent et se traduisent désormais à la volée selon votre langue !",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>`
            },
            {
                title: "🎲 Sélection du Destin / Destiny Pick",
                desc: "Une toute nouvelle animation de sélection d'un jeu aléatoire plus immersive, fluide et premium, dans le thème néon de l'application.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <circle cx="15.5" cy="15.5" r="1.5"/>
                    <circle cx="15.5" cy="8.5" r="1.5"/>
                    <circle cx="8.5" cy="15.5" r="1.5"/>
                </svg>`
            },
            {
                title: "🖼️ Qualité Graphique Optimisée",
                desc: "Les jaquettes des jeux bénéficient d'une résolution améliorée et les fonds de modale sont calés vers le haut pour un affichage optimal.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>`
            },
            {
                title: "🛡️ Correctifs & Stabilité",
                desc: "Résolution du bug de duplication des récompenses XP/Or, fiabilisation du démarrage avec Windows et polissage général.",
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>`
            }
        ]
    },
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
let sessionStartSnapshot = null;

// ---------- Sound Synthesizer (Web Audio API) ----------
function playSynthSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        if (type === 'achievement') {
            // 1. Soft atmospheric background whoosh (filtered white noise)
            const bufferSize = ctx.sampleRate * 0.4;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(300, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
            noiseFilter.Q.setValueAtTime(3, now);
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.08);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(now);
            
            // 2. High-end crystalline bell chime (E5, B5, E6, G#6 chords)
            const freqs = [659.25, 987.77, 1318.51, 1661.22];
            freqs.forEach((f, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = idx === 0 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(f, now);
                osc.detune.setValueAtTime(idx * 3, now); // Slight chorus detune
                
                gain.gain.setValueAtTime(0, now);
                const maxGain = idx === 0 ? 0.08 : 0.04;
                gain.gain.linearRampToValueAtTime(maxGain, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + idx * 0.1);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 1.2);
            });

        } else if (type === 'levelup') {
            // 1. Bass Impact Drop (Fire Force style deep pitch dive)
            const oscBass = ctx.createOscillator();
            const gainBass = ctx.createGain();
            oscBass.type = 'triangle';
            oscBass.frequency.setValueAtTime(240, now);
            oscBass.frequency.exponentialRampToValueAtTime(45, now + 0.28);
            
            gainBass.gain.setValueAtTime(0.25, now);
            gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            
            oscBass.connect(gainBass);
            gainBass.connect(ctx.destination);
            oscBass.start(now);
            oscBass.stop(now + 0.6);

            // 2. Air compression/implosion whoosh (lowpass resonant noise sweep)
            const bufferSize = ctx.sampleRate * 0.6;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(800, now);
            lowpass.frequency.exponentialRampToValueAtTime(120, now + 0.35);
            lowpass.Q.setValueAtTime(6, now);
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.18, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            
            noise.connect(lowpass);
            lowpass.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(now);
            
            // 3. Ascending bright metallic major scale chords (A Major)
            const chord = [329.63, 440.00, 554.37, 659.25, 880.00];
            chord.forEach((f, idx) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, ctx.currentTime);
                    
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.9);
                }, idx * 60);
            });

        } else if (type === 'connect') {
            // Elegant tech chime sweep
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.18);
            
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.1, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.5);

            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(554.37, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
                
                gain2.gain.setValueAtTime(0, ctx.currentTime);
                gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.5);
            }, 100);

        } else if (type === 'tick') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) { console.warn('AudioContext failed:', e); }
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
        if (!state.activityHistory) state.activityHistory = {};

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
            if (!state.activityHistory) state.activityHistory = {};
        } catch (e) { console.warn('Failed to load state:', e); }
    }
    applyTheme(state.theme || 'violet');

    // Detect system locale if not set, and apply language
    if (!state.language) {
        const sysLocale = navigator.language || 'en';
        state.language = sysLocale.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    }
    applyLanguage(state.language);
}

async function computeDailyBoost() {
    const releasedBacklog = (state.backlog || []).filter(game => {
        const isGameReleased = !game.comingSoon && (!game.releaseDate || game.releaseDate * 1000 <= Date.now());
        return isGameReleased;
    });

    if (releasedBacklog.length === 0) {
        state.dailyBoost = null;
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if daily boost is already computed for today and is valid
    if (state.dailyBoost && state.dailyBoost.date === today && Array.isArray(state.dailyBoost.gameIds) && state.dailyBoost.gameIds.length > 0) {
        // Verify all gameIds still exist in the backlog
        const allExist = state.dailyBoost.gameIds.every(id => state.backlog.some(g => g.id === id));
        if (allExist) return;
    }

    const now = Date.now();
    const previousGameIds = (state.dailyBoost && Array.isArray(state.dailyBoost.gameIds)) ? state.dailyBoost.gameIds : [];
    
    // We only exclude previous games if there are enough games in the backlog to choose from
    const canExcludePrevious = releasedBacklog.length > previousGameIds.length;
    const isExcluded = (gameId) => canExcludePrevious && previousGameIds.includes(gameId);

    const candidateHigh = [];
    const candidateMedium = [];
    const candidateRandom = [];

    releasedBacklog.forEach(game => {
        if (isExcluded(game.id)) return;

        const playtimeMin = game.playtime || 0;
        const totalAchs = game.achievements ? game.achievements.length : 0;
        const unlockedAchs = game.achievements ? game.achievements.filter(a => a.unlocked).length : 0;
        const achRatio = totalAchs > 0 ? unlockedAchs / totalAchs : 0;
        const lastPlayedTime = game.lastPlayed || 0;

        // 1. Haute Priorité (70% de chance) : Joué plus de 30 minutes, a des succès, non joué depuis plus de 3 jours
        const notPlayedRecently = lastPlayedTime === 0 || (now - lastPlayedTime > 3 * 24 * 3600 * 1000);
        if (playtimeMin > 30 && totalAchs > 0 && notPlayedRecently) {
            candidateHigh.push(game);
        }

        // 2. Moyenne Priorité (20% de chance) : Plus de 1h de jeu, mais moins de 50% de succès
        if (playtimeMin > 60 && totalAchs > 0 && achRatio < 0.5) {
            candidateMedium.push(game);
        }

        candidateRandom.push(game);
    });

    // Fallback if everything got excluded
    if (candidateRandom.length === 0) {
        candidateRandom.push(...releasedBacklog);
    }

    let selectedCategory = [];
    const rand = Math.random();

    if (rand < 0.7 && candidateHigh.length > 0) {
        selectedCategory = candidateHigh;
    } else if (rand < 0.9 && candidateMedium.length > 0) {
        selectedCategory = candidateMedium;
    } else {
        selectedCategory = candidateRandom;
    }

    if (selectedCategory.length === 0) {
        selectedCategory = candidateRandom;
    }

    const shuffled = [...selectedCategory].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffled.length, Math.random() < 0.8 ? 1 : 2);
    const selectedGames = shuffled.slice(0, count);

    // 5% chance of Mega Boost for each selected game
    const megaGames = selectedGames.filter(() => Math.random() < 0.05);

    state.dailyBoost = {
        date: today,
        gameIds: selectedGames.map(g => g.id),
        megaIds: megaGames.map(g => g.id),
        previousGameIds: previousGameIds // Keep history for stability
    };

    await saveState();
}

const LOCALES = {
    fr: {
        btn_add: "Ajouter",
        toast_level_up: "🎉 NIVEAU {level} ATTEINT !",
        toast_game_added: "🎮 {name} ajouté au backlog !",
        toast_success_imported: "🏆 {count} succès importés !",
        toast_appid_detected: "🔌 AppID Steam ({appId}) détecté localement !",
        toast_local_ach_detected: "🏆 {count} succès locaux détectés !",
        toast_windows_only: "🖥️ Disponible uniquement sur Windows.",
        toast_exe_auto_found: "✅ Exécutable trouvé automatiquement : {name} !",
        toast_exe_linked: "🎮 Exécutable associé avec succès !",
        toast_steam_unlinked: "🔌 Liaison Steam retirée.",
        toast_steam_linked: "🔌 Jeu lié à l'AppID Steam : {appId}",
        toast_game_running: "⚠️ Un jeu est déjà en cours d'exécution.",
        toast_game_starting: "🎮 Démarrage de {name}...",
        toast_launch_error: "❌ Erreur : {error}",
        toast_game_deleted: "🗑️ {name} supprimé",
        toast_game_completed: "🏆 {name} terminé ! +{xp} XP • +{gold} 🪙 ! {rating}/5 ⭐",
        toast_completion_detected: "🏆 Fin de jeu détectée pour {name} ! (Succès : {ach})",
        toast_export_success: "📦 Données exportées !",
        toast_invalid_file: "❌ Fichier invalide. Format non reconnu.",
        toast_import_success: "📥 Import réussi : +{backlog} backlog, +{completed} terminés",
        toast_reset_success: "🗑️ Toutes les données ont été supprimées.",
        toast_discord_rpc_updated: "👾 Identifiant Discord RPC mis à jour !",
        toast_discord_rpc_saved: "👾 Identifiant Discord RPC enregistré !",
        toast_autolaunch_enabled: "⚙️ Lancement au démarrage activé !",
        toast_autolaunch_disabled: "⚙️ Lancement au démarrage désactivé.",
        toast_autolaunch_error: "❌ Erreur lors de la configuration.",
        toast_welcome: "✨ Bienvenue dans ton Quest Log, {username} ! ⚔️",
        toast_username_error: "⚠️ Le pseudo doit contenir au moins 2 caractères.",
        toast_import_error: "❌ Erreur lors de l'import. Fichier corrompu ?",
        toast_scanned_games_added: "🖥️ {count} jeu(x) ajouté(s) au backlog !",
        toast_scanned_games_already_exist: "ℹ️ Tous les jeux sélectionnés étaient déjà présents.",
        toast_game_restored: "↩️ {name} restauré",
        toast_app_up_to_date: "✅ Quest Log est déjà à jour !",
        toast_connection_error: "❌ Erreur de connexion : {error}",
        toast_auto_launch_detected: "🔌 🎮 Lancement de {name} détecté !",
        quest_report: "Rapport de Quête",
        time_played: "Temps joué",
        xp_gained: "XP gagné",
        gold_gained: "Or obtenu",
        lvl_up: "LEVEL UP !",
        ach_unlocked: "Succès débloqués",
        minutes: "minutes",
        hours: "heures",
        hours_short: "h",
        day: "jour",
        days: "jours",
        level: "Niveau",
        btn_continue: "Continuer",
        no_achievements: "Aucun succès débloqué.",
        game_finished: "fini automatiquement !",
        rewards_already_claimed: "Récompenses déjà récupérées.",
        in_progress: "EN COURS",
        to_play: "À Jouer",
        completed: "Terminés",
        stats: "Statistiques",
        settings: "Paramètres",
        add_game: "Ajouter",
        app_title: "Quest Log - Beta v0.0.8",
        global_progress: "Progression Globale",
        filter_placeholder: "Filtrer...",
        title_backlog: "Jeux dans le backlog",
        title_completed: "Jeux terminés",
        title_gold: "Pièces d'or accumulées",
        title_playtime: "Temps de jeu total",
        title_rating: "Note moyenne",
        title_sort: "Trier",
        stats_title: "Tableau de Bord",
        stats_subtitle: "Vue d'ensemble de vos accomplissements RPG",
        stats_total_xp: "XP Cumulé",
        stats_completion_rate: "Taux de Complétion",
        stats_activity_title: "Activité des 12 dernières semaines",
        stats_recent_achievements: "Succès Récents",
        stats_close_btn: "Fermer",
        sort_newest: "Plus récent",
        sort_oldest: "Plus ancien",
        sort_az: "A → Z",
        sort_za: "Z → A",
        sort_platform: "Par plateforme",
        sort_genre: "Par genre",
        sort_rating: "Par note",
        sort_achievements: "Succès débloqués",
        sort_playtime: "Temps de jeu",
        backlog_empty_title: "Ton backlog est vide !",
        backlog_empty_subtitle: "Ajoute des jeux pour commencer ton aventure",
        completed_empty_title: "Aucun jeu terminé",
        completed_empty_subtitle: "Termine ton premier jeu pour débloquer cette section",
        modal_tab_search: "Rechercher un jeu",
        modal_tab_scanner: "Scanner PC",
        search_input_placeholder: "Rechercher un jeu... (ex: Zelda, Hollow Knight)",
        filter_popular: "Populaire",
        filter_newest: "Nouveautés",
        filter_best_rating: "Mieux notés",
        filter_all_platforms: "Toutes plateformes",
        filter_all_genres: "Tous genres",
        search_start_desc: "Tape le nom d'un jeu pour lancer la recherche",
        scanner_title: "Scanner tes jeux installés",
        scanner_desc: "Trouve automatiquement les jeux installés sur tes disques via Steam, Epic Games, Xbox, EA ou Ubisoft et ajoute-les en un clic à ton Quest Log.",
        scanner_btn_scan: "Lancer l'analyse du PC",
        settings_title_text: "Paramètres",
        settings_theme_title: "Thème de l'application",
        settings_theme_desc: "Personnalise la couleur principale.",
        settings_lang_title: "Langue de l'application",
        settings_lang_desc: "Choisis la langue d'affichage.",
        settings_general_title: "Options Générales",
        settings_general_desc: "Démarrage et comportement de la fenêtre.",
        settings_autolaunch: "Démarrer avec Windows",
        settings_tray: "Fermer dans la zone de notification (Tray)",
        settings_enabled: "Activé",
        settings_steam_title: "Intégration Steam",
        settings_steam_desc: "Lie ton compte Steam en saisissant simplement ton pseudo ou ton adresse de profil.",
        settings_steam_profile: "Profil Steam",
        settings_steam_placeholder: "Pseudo Steam, ID64, ou URL de ton profil...",
        settings_steam_advanced: "Options avancées (Clé API)",
        settings_steam_apikey: "Clé API Steam (Optionnelle)",
        settings_steam_apikey_placeholder: "Laisser vide pour utiliser la clé par défaut de Quest Log...",
        settings_steam_btn: "Lier le compte",
        settings_steam_status_unlinked: "Non connecté",
        settings_save_title: "Sauvegarde Locale",
        settings_save_desc: "Les données sont automatiquement enregistrées. Tu peux exporter ou importer des sauvegardes manuelles.",
        settings_save_export: "Exporter .json",
        settings_save_import: "Importer .json",
        settings_update_title: "Mises à Jour",
        settings_update_desc: "Recherche les dernières mises à jour du tracker Quest Log.",
        settings_update_btn: "Vérifier les mises à jour",
        settings_update_status_ready: "Prêt",
        settings_danger_title: "Zone de Danger",
        settings_danger_desc: "Efface définitivement toutes les données de ton Quest Log (Jeux, Niveaux, Progression).",
        settings_danger_btn: "Réinitialiser l'application",
        details_steam_appid_subtitle: "Liaison Steam AppID",
        details_advanced_settings: "Paramètres avancés",
        details_steam_customid_subtitle: "SteamID Perso",
        details_steam_customid_placeholder: "Ex : 76561198000000000",
        details_steam_customid_btn: "Enregistrer",
        toast_steam_customid_updated: "SteamID perso mis à jour !",
        toast_steam_customid_removed: "SteamID perso retiré.",
        details_notes_subtitle: "Notes",
        details_launch_subtitle: "Lancement",
        details_exe_subtitle: "Fichier Exécutable (.exe)",
        details_exe_unlinked: "Aucun exécutable lié",
        details_exe_btn: "Lier un .exe",
        details_btn_view_steam: "Voir sur Steam",
        details_btn_open_folder: "Dossier",
        details_achievements_title: "Succès",
        local_trophies_toggle: "Mode Local",
        local_trophies_activate_title: "Activer les Trophées Locaux ?",
        local_trophies_activate_desc: "Les succès déjà débloqués seront masqués et ta progression repartira de zéro pour ce jeu. Tu pourras désactiver ce mode à tout moment.",
        local_trophies_activate_btn: "Activer",
        local_trophies_cancel_btn: "Annuler",
        local_trophies_activated_toast: "Trophées Locaux activés ! Progression remise à zéro.",
        local_trophies_deactivated_toast: "Trophées Locaux désactivés. Succès Steam restaurés.",
        local_trophies_badge: "Local",
        rating_celebration_title: "Bravo !",
        rating_celebration_subtitle: "Comment tu as trouvé ce jeu ?",
        rating_label_bad: "Bof",
        rating_label_good: "Chef-d'œuvre",
        rating_comment_label: "Commentaire",
        rating_playtime_label: "Temps de jeu",
        rating_submit_btn: "Valider la note",
        destiny_title: "SÉLECTION DE QUÊTE",
        destiny_chosen: "Le Destin a Choisi...",
        destiny_btn: "C'est parti !",
        first_launch_title: "Démarrer ton Aventure",
        first_launch_desc: "Crée ton profil d'aventurier Quest Log pour commencer à accumuler de l'XP et des pièces d'or !",
        first_launch_username: "Nom de l'aventurier",
        first_launch_placeholder: "Saisis ton pseudo...",
        first_launch_btn: "Commencer la Quête",
        scanner_modal_title: "Scanner de jeux locaux",
        scanner_modal_subtitle: "Sélectionne les jeux trouvés sur ton PC à ajouter au backlog.",
        scanner_loading_text: "Recherche en cours dans les dossiers Steam, Epic, Xbox, EA...",
        scanner_btn_select_all: "Tout sélectionner",
        scanner_btn_add: "Ajouter la sélection",
        overlay_connection_title: "Quest Log Link Active",
        overlay_connection_desc: "Suivi en arrière-plan actif • 🪙 +1/min",
        changelog_badge: "Mise à Jour",
        changelog_title: "Nouveautés de la Version",
        changelog_btn: "C'est parti !",
        update_available_title: "Mise à Jour Disponible",
        update_downloading_text: "Téléchargement en cours...",
        update_btn_later: "Plus tard",
        update_btn_download: "Télécharger",
        confirm_title: "Confirmation",
        confirm_btn_cancel: "Annuler",
        confirm_btn_ok: "Confirmer",
        prompt_title: "Liaison Steam",
        prompt_btn_skip: "Passer",
        prompt_btn_ok: "Lier",
        title_xp_bar: "Progression du niveau",
        win_minimize: "Minimiser",
        win_maximize: "Agrandir",
        win_close: "Fermer",
        btn_add_game: "Ajouter un jeu",
        btn_settings: "Paramètres",
        now_playing_badge: "EN COURS",
        now_playing_ach_title: "Progression des succès",
        now_playing_complete: "Terminé !",
        now_playing_skip: "Passer"
    },
    en: {
        btn_add: "Add Game",
        toast_level_up: "🎉 LEVEL {level} REACHED!",
        toast_game_added: "🎮 {name} added to backlog!",
        toast_success_imported: "🏆 {count} achievements imported!",
        toast_appid_detected: "🔌 Steam AppID ({appId}) detected locally!",
        toast_local_ach_detected: "🏆 {count} local achievements detected!",
        toast_windows_only: "🖥️ Only available on Windows.",
        toast_exe_auto_found: "✅ Executable found automatically: {name}!",
        toast_exe_linked: "🎮 Executable linked successfully!",
        toast_steam_unlinked: "🔌 Steam link removed.",
        toast_steam_linked: "🔌 Game linked to Steam AppID: {appId}",
        toast_game_running: "⚠️ A game is already running.",
        toast_game_starting: "🎮 Launching {name}...",
        toast_launch_error: "❌ Error: {error}",
        toast_game_deleted: "🗑️ {name} deleted",
        toast_game_completed: "🏆 {name} completed! +{xp} XP • +{gold} 🪙! {rating}/5 ⭐",
        toast_completion_detected: "🏆 Game completion detected for {name}! (Achievement: {ach})",
        toast_export_success: "📦 Data exported!",
        toast_invalid_file: "❌ Invalid file. Format not recognized.",
        toast_import_success: "📥 Import success: +{backlog} backlog, +{completed} completed",
        toast_reset_success: "🗑️ All data has been deleted.",
        toast_discord_rpc_updated: "👾 Discord RPC Client ID updated!",
        toast_discord_rpc_saved: "👾 Discord RPC Client ID saved!",
        toast_autolaunch_enabled: "⚙️ Launch at startup enabled!",
        toast_autolaunch_disabled: "⚙️ Launch at startup disabled.",
        toast_autolaunch_error: "❌ Error during configuration.",
        toast_welcome: "✨ Welcome to your Quest Log, {username}! ⚔️",
        toast_username_error: "⚠️ Username must be at least 2 characters.",
        toast_import_error: "❌ Import error. Corrupted file?",
        toast_scanned_games_added: "🖥️ {count} game(s) added to backlog!",
        toast_scanned_games_already_exist: "ℹ️ All selected games were already present.",
        toast_game_restored: "↩️ {name} restored",
        toast_app_up_to_date: "✅ Quest Log is already up to date!",
        toast_connection_error: "❌ Connection error: {error}",
        toast_auto_launch_detected: "🔌 🎮 Launch of {name} detected!",
        quest_report: "Quest Report",
        time_played: "Time played",
        xp_gained: "XP gained",
        gold_gained: "Gold obtained",
        lvl_up: "LEVEL UP!",
        ach_unlocked: "Achievements unlocked",
        minutes: "minutes",
        hours: "hours",
        hours_short: "h",
        day: "day",
        days: "days",
        level: "Level",
        btn_continue: "Continue",
        no_achievements: "No achievements unlocked.",
        game_finished: "completed automatically!",
        rewards_already_claimed: "Rewards already claimed.",
        in_progress: "IN PROGRESS",
        to_play: "To Play",
        completed: "Completed",
        stats: "Statistics",
        settings: "Settings",
        add_game: "Add Game",
        app_title: "Quest Log - Beta 0.0.7",
        global_progress: "Global Progress",
        filter_placeholder: "Filter list...",
        title_backlog: "Games in backlog",
        title_completed: "Completed games",
        title_gold: "Gold coins collected",
        title_playtime: "Total playtime",
        title_rating: "Average rating",
        title_sort: "Sort",
        stats_title: "Dashboard",
        stats_subtitle: "Overview of your RPG accomplishments",
        stats_total_xp: "Total XP",
        stats_completion_rate: "Completion Rate",
        stats_activity_title: "Activity in the last 12 weeks",
        stats_recent_achievements: "Recent Achievements",
        stats_close_btn: "Close",
        sort_newest: "Newest",
        sort_oldest: "Oldest",
        sort_az: "A → Z",
        sort_za: "Z → A",
        sort_platform: "By platform",
        sort_genre: "By genre",
        sort_rating: "By rating",
        sort_achievements: "Unlocked achievements",
        sort_playtime: "Playtime",
        backlog_empty_title: "Your backlog is empty!",
        backlog_empty_subtitle: "Add games to begin your adventure",
        completed_empty_title: "No completed games",
        completed_empty_subtitle: "Complete your first game to unlock this section",
        modal_tab_search: "Search Game",
        modal_tab_scanner: "PC Scanner",
        search_input_placeholder: "Search for a game... (e.g. Zelda, Hollow Knight)",
        filter_popular: "Popular",
        filter_newest: "New releases",
        filter_best_rating: "Best rated",
        filter_all_platforms: "All platforms",
        filter_all_genres: "All genres",
        search_start_desc: "Type a game's name to launch the search",
        scanner_title: "Scan your installed games",
        scanner_desc: "Automatically search for games installed on your drives via Steam, Epic Games, Xbox, EA or Ubisoft and add them to your Quest Log in a single click.",
        scanner_btn_scan: "Start PC Scan",
        settings_title_text: "Settings",
        settings_theme_title: "App Theme",
        settings_theme_desc: "Customize primary neon accent color.",
        settings_lang_title: "App Language",
        settings_lang_desc: "Choose display language.",
        settings_general_title: "General Options",
        settings_general_desc: "Startup and window behavior settings.",
        settings_autolaunch: "Start with Windows",
        settings_tray: "Close to Notification Area (Tray)",
        settings_enabled: "Enabled",
        settings_steam_title: "Steam Integration",
        settings_steam_desc: "Link your Steam account by entering your profile URL or ID.",
        settings_steam_profile: "Steam Profile",
        settings_steam_placeholder: "Steam Username, ID64, or profile URL...",
        settings_steam_advanced: "Advanced options (API Key)",
        settings_steam_apikey: "Steam API Key (Optional)",
        settings_steam_apikey_placeholder: "Leave empty to use Quest Log's default key...",
        settings_steam_btn: "Link Account",
        settings_steam_status_unlinked: "Not connected",
        settings_save_title: "Local Save",
        settings_save_desc: "Your progress is automatically saved. You can export or import manual backups.",
        settings_save_export: "Export .json",
        settings_save_import: "Import .json",
        settings_update_title: "Software Updates",
        settings_update_desc: "Search for the latest versions of Quest Log tracker.",
        settings_update_btn: "Check for updates",
        settings_update_status_ready: "Ready",
        settings_danger_title: "Danger Zone",
        settings_danger_desc: "Permanently erase all your Quest Log data (Games, Levels, Progress).",
        settings_danger_btn: "Reset application",
        details_steam_appid_subtitle: "Steam AppID Link",
        details_advanced_settings: "Advanced Settings",
        details_steam_customid_subtitle: "Custom SteamID",
        details_steam_customid_placeholder: "Ex: 76561198000000000",
        details_steam_customid_btn: "Save",
        toast_steam_customid_updated: "Custom SteamID updated!",
        toast_steam_customid_removed: "Custom SteamID removed.",
        details_notes_subtitle: "Notes",
        details_launch_subtitle: "Launcher",
        details_exe_subtitle: "Executable File (.exe)",
        details_exe_unlinked: "No executable linked",
        details_exe_btn: "Link an .exe",
        details_btn_view_steam: "View on Steam",
        details_btn_open_folder: "Folder",
        details_achievements_title: "Achievements",
        local_trophies_toggle: "Local Mode",
        local_trophies_activate_title: "Enable Local Trophies?",
        local_trophies_activate_desc: "Already unlocked achievements will be hidden and your progress will reset to zero for this game. You can disable this mode at any time.",
        local_trophies_activate_btn: "Enable",
        local_trophies_cancel_btn: "Cancel",
        local_trophies_activated_toast: "Local Trophies enabled! Progress reset to zero.",
        local_trophies_deactivated_toast: "Local Trophies disabled. Steam achievements restored.",
        local_trophies_badge: "Local",
        rating_celebration_title: "Congratulations!",
        rating_celebration_subtitle: "How did you find this game?",
        rating_label_bad: "Meh",
        rating_label_good: "Masterpiece",
        rating_comment_label: "Comment",
        rating_playtime_label: "Playtime",
        rating_submit_btn: "Submit Rating",
        destiny_title: "QUEST SELECTION",
        destiny_chosen: "Destiny Has Chosen...",
        destiny_btn: "Let's Go!",
        first_launch_title: "Start Your Adventure",
        first_launch_desc: "Create your adventurer profile to start earning XP and gold!",
        first_launch_username: "Adventurer Name",
        first_launch_placeholder: "Enter username...",
        first_launch_btn: "Begin Quest",
        scanner_modal_title: "Local PC Game Scanner",
        scanner_modal_subtitle: "Select the games detected on your PC to add to the backlog.",
        scanner_loading_text: "Searching folders of Steam, Epic, Xbox, EA...",
        scanner_btn_select_all: "Select All",
        scanner_btn_add: "Add Selection",
        overlay_connection_title: "Quest Log Link Active",
        overlay_connection_desc: "Background tracking active • 🪙 +1/min",
        changelog_badge: "Update",
        changelog_title: "Version Highlights",
        changelog_btn: "Let's Go!",
        update_available_title: "Update Available",
        update_downloading_text: "Downloading update...",
        update_btn_later: "Later",
        update_btn_download: "Download",
        confirm_title: "Confirmation",
        confirm_btn_cancel: "Cancel",
        confirm_btn_ok: "Confirm",
        prompt_title: "Steam Linking",
        prompt_btn_skip: "Skip",
        prompt_btn_ok: "Link",
        title_xp_bar: "Level progression",
        win_minimize: "Minimize",
        win_maximize: "Maximize",
        win_close: "Close",
        btn_add_game: "Add Game",
        btn_settings: "Settings",
        now_playing_badge: "PLAYING",
        now_playing_ach_title: "Achievement progress",
        now_playing_complete: "Done !",
        now_playing_skip: "Skip"
    }
};

const GAMER_QUOTES = [
    {
        fr: { quote: "Le bonhomme est dans un autre château.", author: "Toad (Super Mario Bros.)" },
        en: { quote: "Thank you Mario! But our princess is in another castle!", author: "Toad (Super Mario Bros.)" }
    },
    {
        fr: { quote: "Reste un instant, et écoute.", author: "Deckard Cain (Diablo II)" },
        en: { quote: "Stay awhile and listen.", author: "Deckard Cain (Diablo II)" }
    },
    {
        fr: { quote: "C'est dangereux d'y aller seul ! Prends ceci.", author: "Vieil homme (Zelda)" },
        en: { quote: "It's dangerous to go alone! Take this.", author: "Old Man (Zelda)" }
    },
    {
        fr: { quote: "La guerre. La guerre ne meurt jamais.", author: "Narrateur (Fallout)" },
        en: { quote: "War. War never changes.", author: "Narrator (Fallout)" }
    },
    {
        fr: { quote: "Qu'est-ce qu'un homme ? Un misérable petit tas de secrets.", author: "Dracula (Castlevania)" },
        en: { quote: "What is a man? A miserable little pile of secrets.", author: "Dracula (Castlevania)" }
    },
    {
        fr: { quote: "Tu as failli devenir un sandwich au Jill !", author: "Barry Burton (Resident Evil)" },
        en: { quote: "You almost became a Jill sandwich!", author: "Barry Burton (Resident Evil)" }
    },
    {
        fr: { quote: "Ne fais confiance à personne sur le champ de bataille.", author: "Solid Snake (Metal Gear Solid)" },
        en: { quote: "Do not trust anyone on the battlefield.", author: "Do not trust anyone on the battlefield." }
    },
    {
        fr: { quote: "Est-ce que je t'ai déjà défini la folie ?", author: "Vaas Montenegro (Far Cry 3)" },
        en: { quote: "Did I ever tell you the definition of insanity?", author: "Vaas Montenegro (Far Cry 3)" }
    },
    {
        fr: { quote: "Pas de dieux ou de rois. Seulement l'homme.", author: "Andrew Ryan (BioShock)" },
        en: { quote: "No gods or kings. Only man.", author: "Andrew Ryan (BioShock)" }
    },
    {
        fr: { quote: "Le temps passe, les gens changent.", author: "Sheik (Zelda Ocarina of Time)" },
        en: { quote: "Time passes, people change.", author: "Time passes, people change." }
    }
];
let currentQuoteIndex = Math.floor(Math.random() * GAMER_QUOTES.length);

function updateGamerQuote(newRandom = false) {
    const el = $('#gamer-quote');
    if (!el) return;
    if (newRandom) {
        currentQuoteIndex = Math.floor(Math.random() * GAMER_QUOTES.length);
    }
    const lang = state.language || 'fr';
    const qObj = GAMER_QUOTES[currentQuoteIndex];
    if (qObj) {
        const item = qObj[lang] || qObj['fr'];
        el.textContent = `"${item.quote}" — ${item.author}`;
        el.title = state.language === 'en' ? "Click for another quote" : "Clique pour une autre citation";
    }
}

function applyLanguage(lang) {
    state.language = lang;
    const isEn = lang === 'en';
    const t = (key) => LOCALES[lang][key] || LOCALES['fr'][key] || '';

    document.documentElement.setAttribute('lang', lang);

    const btnFr = $('#btn-lang-fr');
    const btnEn = $('#btn-lang-en');
    if (btnFr && btnEn) {
        if (isEn) {
            btnFr.className = 'btn-secondary btn-sm lang-btn';
            btnEn.className = 'btn-primary btn-sm lang-btn';
        } else {
            btnFr.className = 'btn-primary btn-sm lang-btn';
            btnEn.className = 'btn-secondary btn-sm lang-btn';
        }
    }

    // 1. Generic DOM text nodes translation
    $$('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
            el.textContent = translated;
        }
    });

    // 2. Generic Placeholders translation
    $$('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated) el.placeholder = translated;
    });

    // 3. Generic Tooltips (title) translation
    $$('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated) el.title = translated;
    });

    // 4. Generic Aria labels translation
    $$('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const translated = t(key);
        if (translated) el.setAttribute('aria-label', translated);
    });

    // Update gamer quote display
    updateGamerQuote();

    // Re-render UI list elements, profile levels, headers, etc.
    renderAll();
    updateProfileUI();
    updateNowPlaying();

    // If game details modal is open, re-render it to apply updated languages instantly
    const detailsOverlay = $('#details-overlay');
    if (detailsOverlay && currentDetailsId && detailsOverlay.classList.contains('active')) {
        openGameDetails(currentDetailsId, currentDetailsSource === 'completed');
    }
}

function getTranslation(key, params = {}) {
    const lang = state.language || 'fr';
    let text = LOCALES[lang][key] || LOCALES['fr'][key] || key;
    for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replaceAll(`{${pKey}}`, pVal);
    }
    return text;
}

function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    $$('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const locale = state.language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function translateCountdownText(text) {
    if (!text) return '';
    if (!text.toLowerCase().includes('unlock')) return '';
    if (state.language === 'en') return text;
    
    // Traduction de l'anglais Steam vers le français
    // Ex: "This game plans to unlock in approximately 7 hours" -> "Disponible dans environ 7 heures"
    const hrMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+hour/i);
    const jrMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+day/i);
    const mnMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+minute/i);
    const wkMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+week/i);
    const moMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+month/i);
    const yrMatch = text.match(/in\s+(?:approximately\s+)?(\d+)\s+year/i);

    if (hrMatch) {
        const count = hrMatch[1];
        return `Disponible dans environ ${count} heure${count > 1 ? 's' : ''}`;
    }
    if (jrMatch) {
        const count = jrMatch[1];
        return `Disponible dans environ ${count} jour${count > 1 ? 's' : ''}`;
    }
    if (mnMatch) {
        const count = mnMatch[1];
        return `Disponible dans environ ${count} minute${count > 1 ? 's' : ''}`;
    }
    if (wkMatch) {
        const count = wkMatch[1];
        return `Disponible dans environ ${count} semaine${count > 1 ? 's' : ''}`;
    }
    if (moMatch) {
        const count = moMatch[1];
        return `Disponible dans environ ${count} mois`;
    }
    if (yrMatch) {
        const count = yrMatch[1];
        return `Disponible dans environ ${count} an${count > 1 ? 's' : ''}`;
    }
    return text;
}

// ---------- DOM ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---------- Rendering ----------
function renderGameCard(game, isCompleted = false, isNew = false) {
    const card = document.createElement('div');
    const isBoosted = !isCompleted && state.dailyBoost && state.dailyBoost.gameIds && state.dailyBoost.gameIds.includes(game.id);
    const isMegaBoost = !isCompleted && state.dailyBoost && state.dailyBoost.megaIds && state.dailyBoost.megaIds.includes(game.id);
    card.className = `game-card${isCompleted ? ' completed-card' : ''}${game.id === state.currentGameId ? ' active-game' : ''}${game.isFavorite ? ' favorite-card' : ''}${isMegaBoost ? ' mega-boosted-card boosted-card' : (isBoosted ? ' boosted-card' : '')}`;
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

    let boostBadgeHtml = '';
    if (isMegaBoost) {
        boostBadgeHtml = `
            <div class="daily-boost-badge mega" title="Mega Boost Actif : XP ×2 • Or ×3 !">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="boost-icon" style="width: 10.5px; height: 10.5px;">
                    <path d="M6 3h12l4 6-10 12L2 9z"/>
                </svg>
                <span>BOOST</span>
            </div>`;
    } else if (isBoosted) {
        boostBadgeHtml = `
            <div class="daily-boost-badge" title="Boost Actif : XP ×1.5 • Or ×2 !">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="boost-icon" style="width: 10px; height: 10px;">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>BOOST</span>
            </div>`;
    }

    const isReleased = !game.comingSoon && (!game.releaseDate || game.releaseDate * 1000 <= Date.now());
    let countdownBadgeHtml = '';
    if (!isReleased) {
        const timeDiff = game.releaseDate * 1000 - Date.now();
        const daysLeft = Math.ceil(timeDiff / (24 * 3600 * 1000));
        const hoursLeft = Math.ceil(timeDiff / (3600 * 1000));
        let text = '';
        const hasValidCountdown = game.steamCountdownText && game.steamCountdownText.toLowerCase().includes('unlock');
        if (hasValidCountdown) {
            const hrMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+hour/i);
            const jrMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+day/i);
            const mnMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+minute/i);
            const wkMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+week/i);
            const moMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+month/i);
            const yrMatch = game.steamCountdownText.match(/in\s+(?:approximately\s+)?(\d+)\s+year/i);
            if (hrMatch) {
                text = `${hrMatch[1]}h`;
            } else if (jrMatch) {
                text = `J-${jrMatch[1]}`;
            } else if (mnMatch) {
                text = `${mnMatch[1]}m`;
            } else if (wkMatch) {
                text = state.language === 'en' ? `${wkMatch[1]}w` : `${wkMatch[1]} sem.`;
            } else if (moMatch) {
                text = state.language === 'en' ? `${moMatch[1]}mo` : `${moMatch[1]} mois`;
            } else if (yrMatch) {
                text = state.language === 'en' ? `${yrMatch[1]}y` : `${yrMatch[1]} an${yrMatch[1] > 1 ? 's' : ''}`;
            } else {
                text = game.steamCountdownText.replace("This game plans to unlock", "Dispo").substring(0, 12);
            }
        } else {
            if (!game.releaseDate) {
                text = 'Soon';
            } else if (timeDiff <= 0) {
                text = state.language === 'en' ? 'Today' : 'Jour J';
            } else if (daysLeft > 1) {
                text = `J-${daysLeft}`;
            } else {
                text = `${hoursLeft}h`;
            }
        }
        
        const locale = state.language === 'en' ? 'en-US' : 'fr-FR';
        const formattedDate = game.releaseDate ? new Date(game.releaseDate * 1000).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const tooltipTitle = game.releaseDate 
            ? (state.language === 'en' ? `Release Date: ${formattedDate}` : `Date de sortie : ${formattedDate}`)
            : (state.language === 'en' ? 'Release Date: TBD' : 'Date de sortie : À déterminer');

        countdownBadgeHtml = `
            <div class="release-countdown-badge" title="${tooltipTitle}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 10px; height: 10px; margin-right: 3px; display: inline-block; vertical-align: middle;">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>${text}</span>
            </div>
        `;
    }

    let visualHtml = '';
    if (game.cover) {
        visualHtml = `<div class="game-card-cover" style="background-image:url('${game.cover}')">${boostBadgeHtml}${countdownBadgeHtml}</div>`;
    } else {
        visualHtml = `<div class="game-card-icon genre-${game.genre}" style="display:flex; align-items:center; justify-content:center; position:relative;">${icon}${boostBadgeHtml}${countdownBadgeHtml}</div>`;
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
        const isLocalMode = game.localTrophies === true;
        const cardBaselineSet = isLocalMode ? new Set(game.localTrophiesBaseline || []) : null;
        const unlocked = game.achievements.filter(a => {
            if (!isLocalMode) return a.unlocked;
            return a.unlocked && !cardBaselineSet.has(a.apiname);
        }).length;
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
        case 'achievements-desc': sorted.sort((a, b) => {
            const countA = a.achievements ? a.achievements.filter(x => x.unlocked).length : 0;
            const countB = b.achievements ? b.achievements.filter(x => x.unlocked).length : 0;
            return countB - countA || a.name.localeCompare(b.name, 'fr');
        }); break;
        case 'playtime-desc': sorted.sort((a, b) => (b.playtime || 0) - (a.playtime || 0) || a.name.localeCompare(b.name, 'fr')); break;
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

function renderDetailedStats() {
    const allGames = [...state.backlog, ...state.completed];

    // 1. Calculate XP, Level and RPG Class
    let totalXp = state.profile?.xp || 0;
    const currentLevel = state.profile?.level || 1;
    for (let i = 1; i < currentLevel; i++) {
        totalXp += getXpForLevel(i);
    }
    
    const levelVal = $('#stats-level-val');
    if (levelVal) levelVal.textContent = `Niveau ${currentLevel}`;
    const xpSub = $('#stats-xp-subtext');
    if (xpSub) xpSub.textContent = `${totalXp.toLocaleString()} XP au total`;

    // Calculate dynamic RPG Class based on genre playtime
    const genrePlaytimes = {};
    allGames.forEach(g => {
        if (g.genre && g.playtime) {
            const cleanGenre = g.genre.toLowerCase().trim();
            genrePlaytimes[cleanGenre] = (genrePlaytimes[cleanGenre] || 0) + g.playtime;
        }
    });

    let dominantGenre = '';
    let maxGenrePlaytime = 0;
    for (const genre in genrePlaytimes) {
        if (genrePlaytimes[genre] > maxGenrePlaytime) {
            maxGenrePlaytime = genrePlaytimes[genre];
            dominantGenre = genre;
        }
    }

    let rpgClass = state.language === 'en' ? 'Novice' : 'Novice';
    if (maxGenrePlaytime > 0) {
        if (dominantGenre.includes('rpg') || dominantGenre.includes('rôle') || dominantGenre.includes('role')) {
            rpgClass = state.language === 'en' ? 'Mage' : 'Mage';
        } else if (dominantGenre.includes('action') || dominantGenre.includes('adventure') || dominantGenre.includes('aventure')) {
            rpgClass = state.language === 'en' ? 'Warrior' : 'Guerrier';
        } else if (dominantGenre.includes('rogue') || dominantGenre.includes('survival') || dominantGenre.includes('survie')) {
            rpgClass = state.language === 'en' ? 'Rogue' : 'Assassin';
        } else if (dominantGenre.includes('strategy') || dominantGenre.includes('stratégie') || dominantGenre.includes('tactical')) {
            rpgClass = state.language === 'en' ? 'Tactician' : 'Stratège';
        } else if (dominantGenre.includes('sim') || dominantGenre.includes('build') || dominantGenre.includes('craft') || dominantGenre.includes('gestion')) {
            rpgClass = state.language === 'en' ? 'Builder' : 'Artisan';
        } else if (dominantGenre.includes('platform') || dominantGenre.includes('plateforme') || dominantGenre.includes('arcade')) {
            rpgClass = state.language === 'en' ? 'Acrobat' : 'Voltigeur';
        } else if (dominantGenre.includes('fight') || dominantGenre.includes('combat') || dominantGenre.includes('versus')) {
            rpgClass = state.language === 'en' ? 'Gladiator' : 'Gladiateur';
        } else {
            rpgClass = state.language === 'en' ? 'Adventurer' : 'Aventurier';
        }
    }

    const classVal = $('#stats-class-val');
    if (classVal) {
        classVal.textContent = rpgClass;
    }

    // 2. Calculate Total Playtime
    let totalPlaytimeMin = 0;
    allGames.forEach(g => {
        totalPlaytimeMin += g.playtime || 0;
    });
    const totalPlaytimeHours = Math.round((totalPlaytimeMin / 60) * 10) / 10;
    
    const playtimeVal = $('#stats-playtime-val');
    if (playtimeVal) playtimeVal.textContent = `${totalPlaytimeHours.toLocaleString()}h`;
    const playtimeSub = $('#stats-playtime-subtext');
    if (playtimeSub) {
        const gameCountText = state.language === 'en' 
            ? `Across ${allGames.length} games` 
            : `Sur tes ${allGames.length} jeux`;
        playtimeSub.textContent = gameCountText;
    }

    // 3. Calculate Completion Rate
    const totalGames = allGames.length;
    const completionRate = totalGames > 0 ? Math.round((state.completed.length / totalGames) * 100) : 0;
    const rateEl = $('#stats-completion-rate');
    if (rateEl) rateEl.textContent = `${completionRate}%`;
    const completionSub = $('#stats-completion-subtext');
    if (completionSub) {
        const complText = state.language === 'en'
            ? `${state.completed.length} / ${totalGames} games completed`
            : `${state.completed.length} / ${totalGames} jeux terminés`;
        completionSub.textContent = complText;
    }

    // 4. Calculate Achievements
    let totalAchsCount = 0;
    let unlockedCount = 0;
    allGames.forEach(game => {
        if (game.achievements && game.achievements.length > 0) {
            const isSim = game.achievements.length === SIMULATED_ACHIEVEMENTS.length && game.achievements.every(a => a.apiname.startsWith('sim_'));
            if (!isSim) {
                totalAchsCount += game.achievements.length;
                unlockedCount += game.achievements.filter(a => a.unlocked).map(a => a.apiname).length;
            }
        }
    });
    
    const achVal = $('#stats-achievements-val');
    if (achVal) achVal.textContent = `${unlockedCount} / ${totalAchsCount}`;
    const achSub = $('#stats-achievements-subtext');
    if (achSub) {
        const achRate = totalAchsCount > 0 ? Math.round((unlockedCount / totalAchsCount) * 100) : 0;
        achSub.textContent = `${achRate}% complétés`;
    }

    // 5. Generate 12-week Activity Heatmap Grid (84 cells)
    const container = $('#stats-heatmap-container');
    const tooltip = $('#heatmap-tooltip');
    if (container) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'stats-heatmap-grid';

        const now = new Date();
        const dates = [];
        // Generate 84 days (12 weeks)
        for (let i = 83; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            dates.push(d);
        }

        dates.forEach(d => {
            const key = d.toISOString().split('T')[0];
            const minutes = (state.activityHistory && state.activityHistory[key]) || 0;

            let level = "0";
            if (minutes > 0 && minutes <= 15) level = "1";
            else if (minutes > 15 && minutes <= 30) level = "2";
            else if (minutes > 30 && minutes <= 60) level = "3";
            else if (minutes > 60) level = "4";

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.setAttribute('data-level', level);

            // Localization for tooltip content
            const dateStr = d.toLocaleDateString(state.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            
            let minutesText = '';
            if (minutes > 0) {
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                if (h > 0) {
                    minutesText = state.language === 'en' ? `${h}h ${m}m played` : `${h}h ${m}m de jeu`;
                } else {
                    minutesText = state.language === 'en' ? `${m}m played` : `${m}m de jeu`;
                }
            } else {
                minutesText = state.language === 'en' ? 'No playtime' : 'Aucun temps de jeu';
            }
            
            const tooltipContent = `${dateStr} : ${minutesText}`;

            // Attach dynamic custom tooltip events
            cell.addEventListener('mouseenter', () => {
                if (tooltip) {
                    tooltip.textContent = tooltipContent;
                    tooltip.style.opacity = '1';
                }
            });

            cell.addEventListener('mousemove', (e) => {
                if (tooltip) {
                    tooltip.style.top = `${e.pageY}px`;
                    tooltip.style.left = `${e.pageX}px`;
                }
            });

            cell.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.style.opacity = '0';
                }
            });

            grid.appendChild(cell);
        });
        container.appendChild(grid);
    }

    // 6. Render Top 3 Played Games
    const topPlayedListEl = $('#stats-top-played-list');
    if (topPlayedListEl) {
        topPlayedListEl.innerHTML = '';
        
        // Sort games by playtime descending
        const sortedGames = [...allGames]
            .filter(g => (g.playtime || 0) > 0)
            .sort((a, b) => (b.playtime || 0) - (a.playtime || 0));
        
        const top3 = sortedGames.slice(0, 3);
        const maxPlaytime = top3.length > 0 ? (top3[0].playtime || 1) : 1;

        if (top3.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.fontSize = '0.82rem';
            emptyMsg.style.color = 'var(--text-tertiary)';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '14px 0';
            emptyMsg.textContent = state.language === 'en' ? "No games played yet" : "Aucun temps de jeu enregistré";
            topPlayedListEl.appendChild(emptyMsg);
        } else {
            top3.forEach((game, idx) => {
                const item = document.createElement('div');
                item.className = 'top-played-item';

                const hours = Math.round((game.playtime || 0) / 60 * 10) / 10;
                const ratioPercent = Math.min(100, Math.round(((game.playtime || 0) / maxPlaytime) * 100));

                const coverStyle = game.cover
                    ? `background-image: url('${game.cover}')`
                    : `background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center;`;
                
                const coverHtml = game.cover
                    ? `<div style="width: 32px; height: 42px; border-radius: 4px; background-size: cover; background-position: center; ${coverStyle}"></div>`
                    : `<div style="width: 32px; height: 42px; border-radius: 4px; ${coverStyle}"><svg style="width: 14px; height: 14px; color: var(--text-tertiary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg></div>`;

                item.innerHTML = `
                    <div class="top-played-rank rank-${idx + 1}">${idx + 1}</div>
                    ${coverHtml}
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <div style="font-size: 0.85rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${game.name}</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-violet);">${hours}h</div>
                        </div>
                        <div class="progress-bar-bg" style="height: 4px; background: rgba(255,255,255,0.03);">
                            <div class="progress-bar-fill" style="width: ${ratioPercent}%; height: 100%; background: var(--accent-violet);"></div>
                        </div>
                    </div>
                `;
                topPlayedListEl.appendChild(item);
            });
        }
    }

    // 7. Render 3 Recent Achievements
    const listEl = $('#stats-recent-ach-list');
    if (listEl) {
        listEl.innerHTML = '';
        const recentAchs = [];
        allGames.forEach(game => {
            if (game.achievements) {
                game.achievements.forEach(ach => {
                    if (ach.unlocked) {
                        recentAchs.push({
                            ...ach,
                            gameName: game.name
                        });
                    }
                });
            }
        });

        recentAchs.sort((a, b) => (b.unlockTime || 0) - (a.unlockTime || 0));
        const slice = recentAchs.slice(0, 3);

        if (slice.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.fontSize = '0.82rem';
            emptyMsg.style.color = 'var(--text-tertiary)';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '14px 0';
            emptyMsg.textContent = state.language === 'en' ? "No achievements unlocked yet" : "Aucun succès débloqué pour le moment";
            listEl.appendChild(emptyMsg);
        } else {
            slice.forEach(ach => {
                const item = document.createElement('div');
                item.className = 'recap-ach-item';

                const iconHtml = ach.icon
                    ? `<img src="${ach.icon}" style="width: 32px; height: 32px; border-radius: 4px;" alt="Icon">`
                    : `<div style="width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);"><svg style="width: 16px; height: 16px; color: var(--text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`;

                const dateStr = ach.unlockTime ? new Date(ach.unlockTime * 1000).toLocaleDateString(state.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

                item.innerHTML = `
                    ${iconHtml}
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ach.name}</div>
                        <div style="font-size: 0.72rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ach.gameName}</div>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--accent-pink); font-weight: 600;">
                        ${dateStr}
                    </div>
                `;
                listEl.appendChild(item);
            });
        }
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

let dailyBoostTimerInterval = null;

function initDailyBoostTimer() {
    if (!state.dailyBoost || !state.dailyBoost.gameIds || state.dailyBoost.gameIds.length === 0 || state.backlog.length === 0) {
        if (dailyBoostTimerInterval) {
            clearInterval(dailyBoostTimerInterval);
            dailyBoostTimerInterval = null;
        }
        return;
    }

    if (!dailyBoostTimerInterval) {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // Next midnight

            const diff = midnight.getTime() - now.getTime();
            if (diff <= 0) {
                // Day changed, recalculate boost
                clearInterval(dailyBoostTimerInterval);
                dailyBoostTimerInterval = null;
                computeDailyBoost().then(() => {
                    renderAll();
                });
                return;
            }
        };
        updateTimer();
        dailyBoostTimerInterval = setInterval(updateTimer, 60000); // Check every minute
    }
}

function renderAll() {
    initDailyBoostTimer();
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

            addGame(game.name, platform, genre, '', coverUrl, false, steamAppId, '', game.first_release_date).then(() => {
                showToast(`${game.name} ajouté au backlog !`, '🎮');
            });
        });

        resultsContainer.appendChild(card);
    });
}

// ---------- UI Interaction ----------
function t(key) {
    const lang = state?.language || 'fr';
    return LOCALES[lang]?.[key] || LOCALES['fr']?.[key] || '';
}

function showToast(message, icon = '✅') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const TOAST_ICONS = {
        '✅': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        '❌': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        '🎮': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="3"/></svg>`,
        '🔌': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.5a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1.5a3 3 0 0 0 3-3h3a3 3 0 0 0 3 3H18a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/><path d="M2 14h2M20 14h2M12 2v5M12 17v5"/></svg>`,
        '🏆': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z"/></svg>`,
        'ℹ️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        '📦': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        '🗑️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
        '⚠️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        '⭐': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        '🖥️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        '⚙️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        '📥': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
        '↩️': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
        '🌐': `<svg class="stat-svg" style="color:var(--text-primary); width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    };

    // Auto-translate toast content to adapt dynamically to language
    let translatedMessage = message;
    const isEn = state.language === 'en';
    
    if (message.startsWith('🎉 NIVEAU ') || message.startsWith('🎉 LEVEL ')) {
        const lvl = (message.match(/\d+/) || [1])[0];
        translatedMessage = isEn ? `🎉 LEVEL ${lvl} REACHED!` : `🎉 NIVEAU ${lvl} ATTEINT !`;
    } else if (message.includes(' ajouté au backlog !') || message.includes(' added to backlog!')) {
        const name = message.replace(' ajouté au backlog !', '').replace(' added to backlog!', '');
        translatedMessage = isEn ? `${name} added to backlog!` : `${name} ajouté au backlog !`;
    } else if (message.includes(' succès importés !') || message.includes(' achievements imported!')) {
        const count = (message.match(/\d+/) || [0])[0];
        translatedMessage = isEn ? `${count} achievements imported!` : `${count} succès importés !`;
    } else if (message.startsWith('AppID Steam') || message.startsWith('Steam AppID')) {
        const appId = (message.match(/\d+/) || [''])[0];
        translatedMessage = isEn ? `Steam AppID (${appId}) detected locally!` : `AppID Steam (${appId}) détecté localement !`;
    } else if (message.includes(' succès locaux détectés !') || message.includes(' local achievements detected!')) {
        const count = (message.match(/\d+/) || [0])[0];
        translatedMessage = isEn ? `${count} local achievements detected!` : `${count} succès locaux détectés !`;
    } else if (message === 'Disponible uniquement sur Windows.' || message === 'Only available on Windows.') {
        translatedMessage = isEn ? 'Only available on Windows.' : 'Disponible uniquement sur Windows.';
    } else if (message.startsWith('Exécutable trouvé automatiquement') || message.startsWith('Executable found automatically')) {
        const name = message.split(' : ').pop().replace(' !', '').replace('!', '');
        translatedMessage = isEn ? `Executable found automatically: ${name}!` : `Exécutable trouvé automatiquement : ${name} !`;
    } else if (message === 'Exécutable associé avec succès !' || message === 'Executable linked successfully!') {
        translatedMessage = isEn ? 'Executable linked successfully!' : 'Exécutable associé avec succès !';
    } else if (message === 'Liaison Steam retirée.' || message === 'Steam link removed.') {
        translatedMessage = isEn ? 'Steam link removed.' : 'Liaison Steam retirée.';
    } else if (message.startsWith("Jeu lié à l'AppID Steam") || message.startsWith("Game linked to Steam AppID")) {
        const appId = (message.match(/\d+/) || [''])[0];
        translatedMessage = isEn ? `Game linked to Steam AppID: ${appId}` : `Jeu lié à l'AppID Steam : ${appId}`;
    } else if (message === "Un jeu est déjà en cours d'exécution." || message === "A game is already running.") {
        translatedMessage = isEn ? 'A game is already running.' : "Un jeu est déjà en cours d'exécution.";
    } else if (message.startsWith('Démarrage de ') || message.startsWith('Launching ')) {
        const name = message.replace('Démarrage de ', '').replace('Launching ', '').replace('...', '');
        translatedMessage = isEn ? `Launching ${name}...` : `Démarrage de ${name}...`;
    } else if (message.startsWith('Erreur : ') || message.startsWith('Error: ')) {
        const err = message.replace('Erreur : ', '').replace('Error: ', '');
        translatedMessage = isEn ? `Error: ${err}` : `Erreur : ${err}`;
    } else if (message.endsWith(' supprimé') || message.endsWith(' deleted')) {
        const name = message.replace(' supprimé', '').replace(' deleted', '');
        translatedMessage = isEn ? `${name} deleted` : `${name} supprimé`;
    } else if (message.includes(' terminé !') || message.includes(' completed!')) {
        const name = message.split(' terminé !')[0].split(' completed!')[0].replace('🏆 ', '');
        const xp = (message.match(/\+(\d+)\s*XP/) || [0,0])[1];
        const gold = (message.match(/\+(\d+)\s*🪙/) || [0,0])[1];
        const rating = (message.match(/(\d+)\/5/) || [0,0])[1];
        translatedMessage = isEn 
            ? `🏆 ${name} completed! +${xp} XP • +${gold} 🪙! ${rating}/5 ⭐` 
            : `🏆 ${name} terminé ! +${xp} XP • +${gold} 🪙 ! ${rating}/5 ⭐`;
    } else if (message.startsWith('🏆 Fin de jeu détectée') || message.startsWith('🏆 Game completion detected')) {
        const namePart = message.match(/pour (.+?) !/);
        const name = namePart ? namePart[1] : '';
        const achPart = message.match(/Succès : (.+?)\)/);
        const ach = achPart ? achPart[1] : '';
        translatedMessage = isEn ? `🏆 Game completion detected for ${name}! (Achievement: ${ach})` : `🏆 Fin de jeu détectée pour ${name} ! (Succès : ${ach})`;
    } else if (message === 'Données exportées !' || message === 'Data exported!') {
        translatedMessage = isEn ? 'Data exported!' : 'Données exportées !';
    } else if (message === 'Fichier invalide. Format non reconnu.' || message === 'Invalid file. Format not recognized.') {
        translatedMessage = isEn ? 'Invalid file. Format not recognized.' : 'Fichier invalide. Format non reconnu.';
    } else if (message.startsWith('Import réussi') || message.startsWith('Import success')) {
        const bCount = (message.match(/\+(\d+)\s*backlog/) || [0,0])[1];
        const cCount = (message.match(/\+(\d+)\s*terminés/) || [0,0])[1] || (message.match(/\+(\d+)\s*completed/) || [0,0])[1];
        translatedMessage = isEn ? `Import success: +${bCount} backlog, +${cCount} completed` : `Import réussi : +${bCount} backlog, +${cCount} terminés`;
    } else if (message === 'Toutes les données ont été supprimées.' || message === 'All data has been deleted.') {
        translatedMessage = isEn ? 'All data has been deleted.' : 'Toutes les données ont été supprimées.';
    } else if (message === 'Identifiant Discord RPC mis à jour !' || message === 'Discord RPC Client ID updated!') {
        translatedMessage = isEn ? 'Discord RPC Client ID updated!' : 'Identifiant Discord RPC mis à jour !';
    } else if (message === 'Identifiant Discord RPC enregistré !' || message === 'Discord RPC Client ID saved!') {
        translatedMessage = isEn ? 'Discord RPC Client ID saved!' : 'Identifiant Discord RPC enregistré !';
    } else if (message === 'Lancement au démarrage activé !' || message === 'Launch at startup enabled!') {
        translatedMessage = isEn ? 'Launch at startup enabled!' : 'Lancement au démarrage activé !';
    } else if (message === 'Lancement au démarrage désactivé.' || message === 'Launch at startup disabled.') {
        translatedMessage = isEn ? 'Launch at startup disabled.' : 'Lancement au démarrage désactivé.';
    } else if (message === 'Erreur lors de la configuration.' || message === 'Error during configuration.') {
        translatedMessage = isEn ? 'Error during configuration.' : 'Erreur lors de la configuration.';
    } else if (message.startsWith('Bienvenue dans ton Quest Log') || message.startsWith('Welcome to your Quest Log')) {
        const user = message.replace('Bienvenue dans ton Quest Log, ', '').replace('Welcome to your Quest Log, ', '').replace(' ! ⚔️', '').replace('! ⚔️', '');
        translatedMessage = isEn ? `✨ Welcome to your Quest Log, ${user}! ⚔️` : `✨ Bienvenue dans ton Quest Log, ${user} ! ⚔️`;
    } else if (message === 'Le pseudo doit contenir au moins 2 caractères.' || message === 'Username must be at least 2 characters.') {
        translatedMessage = isEn ? 'Username must be at least 2 characters.' : 'Le pseudo doit contenir au moins 2 caractères.';
    } else if (message === "Erreur lors de l'import. Fichier corrompu ?" || message === 'Import error. Corrupted file?') {
        translatedMessage = isEn ? 'Import error. Corrupted file?' : "Erreur lors de l'import. Fichier corrompu ?";
    } else if (message.includes('jeu(x) ajouté(s) au backlog') || message.includes('game(s) added to backlog')) {
        const count = (message.match(/\d+/) || [0])[0];
        translatedMessage = isEn ? `${count} game(s) added to backlog!` : `${count} jeu(x) ajouté(s) au backlog !`;
    } else if (message === 'Tous les jeux sélectionnés étaient déjà présents.' || message === 'All selected games were already present.') {
        translatedMessage = isEn ? 'All selected games were already present.' : 'Tous les jeux sélectionnés étaient déjà présents.';
    } else if (message.endsWith(' restauré') || message.endsWith(' restored')) {
        const name = message.split(' restauré')[0].split(' restored')[0];
        translatedMessage = isEn ? `${name} restored` : `${name} restauré`;
    } else if (message === 'Quest Log est déjà à jour !' || message === 'Quest Log is already up to date!') {
        translatedMessage = isEn ? 'Quest Log is already up to date!' : 'Quest Log est déjà à jour !';
    } else if (message.startsWith('Erreur de connexion :') || message.startsWith('Connection error:')) {
        const err = message.replace('Erreur de connexion : ', '').replace('Connection error: ', '');
        translatedMessage = isEn ? `Connection error: ${err}` : `Erreur de connexion : ${err}`;
    } else if (message.startsWith('🎮 Lancement de ') || message.startsWith('🎮 Launch of ')) {
        const name = message.replace('🎮 Lancement de ', '').replace('🎮 Launch of ', '').replace(' détecté !', '').replace(' detected!', '');
        translatedMessage = isEn ? `🎮 Launch of ${name} detected!` : `🎮 Lancement de ${name} détecté !`;
    } else if (message === 'Session terminée !' || message === 'Session ended!') {
        translatedMessage = isEn ? 'Session ended!' : 'Session terminée !';
    } else if (message.startsWith('Session terminée ! +') || message.startsWith('Session ended! +')) {
        const xp = message.match(/\+(\d+)\s*XP/)[1];
        translatedMessage = isEn ? `Session ended! +${xp} XP gained!` : `Session terminée ! +${xp} XP gagnés !`;
    }

    const iconContent = TOAST_ICONS[icon] || icon;
    toast.innerHTML = `<span class="toast-icon">${iconContent}</span><span>${translatedMessage}</span>`;
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
async function addGame(name, platform, genre, notes = '', cover = '', silent = false, steamAppId = '', exePath = '', releaseDate = null, comingSoon = null) {
    const game = {
        id: generateId(),
        name: name.trim(),
        platform,
        genre,
        notes: notes.trim(),
        cover,
        addedAt: Date.now(),
        steamAppId: steamAppId ? steamAppId.toString() : '',
        achievements: [],
        localTrophies: false,
        localTrophiesBaseline: [],
        localTrophiesUnlockTimes: {},
        autoDetectExe: true,
        exePath: exePath || '',
        releaseDate: releaseDate ? parseInt(releaseDate) : null,
        comingSoon: comingSoon
    };

    if (game.steamAppId) {
        try {
            const res = await window.questlog.fetchSteamReleaseDate(game.steamAppId, state.language);
            if (res && res.success) {
                if (res.releaseDate) game.releaseDate = res.releaseDate;
                if (res.comingSoon !== undefined) game.comingSoon = res.comingSoon;
                if (res.countdownText) game.steamCountdownText = res.countdownText;
            }
        } catch (e) {
            console.warn('Failed to fetch Steam release date during addGame:', e);
        }
    }

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
        await fetchAchievementsFromSteam(game, true);
        renderAll();
    } else {
        const found = await tryAutoFindSteamAppId(game);
        if (!found && !silent) {
            const manualAppId = await showPromptModal(`Nous n'avons pas réussi à trouver l'ID Steam de "${game.name}" automatiquement.\n\nSaisis son Steam AppID pour lier les succès (ou clique sur Passer) :`);
            if (manualAppId && parseInt(manualAppId)) {
                game.steamAppId = manualAppId.trim();
                await saveState();
                await fetchAchievementsFromSteam(game, true);
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
                await fetchAchievementsFromSteam(game, true);
                return true;
            }
        }
    } catch (e) { console.warn('Auto Steam lookup failed:', e); }

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
                    await fetchAchievementsFromSteam(game, true);
                    return true;
                }
            }
        }
    } catch (e) { console.warn('Auto IGDB Steam ID lookup failed:', e); }

    return false;
}

async function fetchAchievementsFromSteam(game, silent = false) {
    if (!game.steamAppId) return { success: false, error: 'No Steam AppID linked' };
    try {
        let schemaList = [];
        const langParam = state.language === 'en' ? 'english' : 'french';

        // 1. Prioritize official Steam API Schema (uses user key or defaults to the app's internal key)
        const schemaRes = await window.questlog.fetchSteamSchema(state.steamApiKey || '', game.steamAppId, langParam);
        if (schemaRes && schemaRes.game && schemaRes.game.availableGameStats && schemaRes.game.availableGameStats.achievements) {
            schemaList = schemaRes.game.availableGameStats.achievements.map(ach => ({
                apiname: ach.name,
                name: ach.displayName,
                description: ach.description || '',
                icon: ach.icon || ''
            }));
        }

        // 2. Fall back to public stats page scraping if official schema failed
        if (schemaList.length === 0 && isElectron) {
            const publicRes = await window.questlog.fetchPublicSteamSchema(game.steamAppId, langParam);
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
            // 3. Fetch online player achievements if Steam ID is present
            let playerList = [];
            let fetchFailed = false;
            let fetchError = '';
            
            const targetSteamId = game.steamCustomId || state.steamId;
            if (targetSteamId) {
                const playerRes = await window.questlog.fetchSteamAchievements(state.steamApiKey || '', targetSteamId, game.steamAppId);
                if (playerRes && playerRes.error) {
                    fetchFailed = true;
                    fetchError = playerRes.error;
                } else if (playerRes && playerRes.playerstats && playerRes.playerstats.success === false) {
                    fetchFailed = true;
                    fetchError = playerRes.playerstats.error || 'Private profile or invalid SteamID';
                } else {
                    playerList = playerRes?.playerstats?.achievements || [];
                }
            }

            // 4. Check local achievements (Goldberg, RUNE, CODEX, etc.)
            let localUnlockedList = [];
            if (isElectron) {
                const localRes = await window.questlog.checkLocalAchievements(game.steamAppId, game.exePath);
                if (localRes.success && localRes.achievements) {
                    localUnlockedList = localRes.achievements;
                }
            }

            const mapped = schemaList.map((ach, idx) => {
                const onlineAch = playerList.find(p => p.apiname === ach.apiname);
                const isOnlineUnlocked = onlineAch ? onlineAch.achieved === 1 : false;

                // Flexible match for local achievements (RUNE, CODEX, Goldberg)
                const isLocalUnlocked = localUnlockedList.some(locKey => {
                    const cleanLoc = locKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanApi = ach.apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanName = ach.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanLoc === cleanApi || cleanLoc === cleanName || cleanLoc.includes(cleanApi) || cleanApi.includes(locKey);
                });

                // Match with old cached achievement
                // Try 1: by apiname
                let oldAch = game.achievements ? game.achievements.find(o => o.apiname.toLowerCase() === ach.apiname.toLowerCase()) : null;
                // Try 2: by name (french or english)
                if (!oldAch && game.achievements) {
                    oldAch = game.achievements.find(o => {
                        const cleanOld = o.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const cleanNew = ach.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cleanOld === cleanNew;
                    });
                }
                // Try 3: by index if the lists have the same length
                if (!oldAch && game.achievements && game.achievements.length === schemaList.length) {
                    oldAch = game.achievements[idx];
                }

                const isCachedUnlocked = oldAch ? oldAch.unlocked : false;
                const isUnlockedNow = isCachedUnlocked || isOnlineUnlocked || isLocalUnlocked;
                const wasXpAwarded = oldAch ? (oldAch.xpAwarded === true || oldAch.xpAwarded === 1) : false;

                return {
                    apiname: ach.apiname,
                    name: ach.name,
                    description: ach.description || '',
                    icon: ach.icon || '',
                    unlocked: isUnlockedNow,
                    unlockTime: onlineAch ? onlineAch.unlocktime : (oldAch ? oldAch.unlockTime : 0),
                    xpAwarded: wasXpAwarded
                };
            });

            // If game has no achievements cached yet, or if they were the initial Quest Log simulated achievements,
            // we consider it as the initial/first sync and must perform it silently.
            const isFirstSync = !game.achievements || game.achievements.length === 0 || 
                (game.achievements.length === SIMULATED_ACHIEVEMENTS.length && game.achievements.every(a => a.apiname.startsWith('sim_')));
            const reallySilent = silent || isFirstSync;

            // If it is a silent or initial sync, mark all currently unlocked achievements as xpAwarded
            if (reallySilent) {
                mapped.forEach(ach => {
                    if (ach.unlocked) {
                        ach.xpAwarded = true;
                    }
                });
            }

            if (game.achievements && game.achievements.length > 0) {
                const wasSimulated = game.achievements.length === SIMULATED_ACHIEVEMENTS.length && game.achievements.every(a => a.apiname.startsWith('sim_'));

                if (!wasSimulated && !reallySilent) {
                    const isGameCurrentlyActive = activePlaySession && activePlaySession.gameId === game.id;
                    mapped.forEach(newAch => {
                        const oldAch = game.achievements.find(o => o.apiname.toLowerCase() === newAch.apiname.toLowerCase());
                        const isOldUnlocked = oldAch ? oldAch.unlocked : false;
                        const isOldXpAwarded = oldAch ? (oldAch.xpAwarded === true || oldAch.xpAwarded === 1) : false;

                        if (newAch.unlocked && !isOldUnlocked && !isOldXpAwarded) {
                            if (isGameCurrentlyActive) {
                                addXp(250);
                                addGold(50);
                                newAch.xpAwarded = true; // Mark as rewarded!
                                
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
                            } else {
                                // Silent sync for historical/off-session achievements
                                newAch.xpAwarded = true;
                            }
                        }
                    });
                }
            }

            game.achievements = mapped;
            if (game.localTrophies && game.localTrophiesBaseline && game.localTrophiesBaseline.length > 0) {
                const lBaselineSet = new Set(game.localTrophiesBaseline);
                game.achievements.forEach(ach => {
                    if (lBaselineSet.has(ach.apiname) && ach.unlocked) {
                        ach.xpAwarded = true;
                    }
                });
            }
            await saveState();

            if (currentDetailsId === game.id) {
                renderAchievementsInDetails(game);
            }

            if (fetchFailed) {
                return { success: false, error: fetchError };
            }
            return { success: true };
        } else {
            return { success: false, error: 'No achievements schema found' };
        }
    } catch (e) {
        console.warn('Failed to fetch Steam achievements:', e);
        return { success: false, error: e.message || 'Unknown error' };
    }
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
    const isLocalMode = game.localTrophies === true;
    const baselineSet = isLocalMode ? new Set(game.localTrophiesBaseline || []) : null;
    
    const getLocalUnlocked = (ach) => {
        if (!isLocalMode) return ach.unlocked;
        return ach.unlocked && !baselineSet.has(ach.apiname);
    };
    
    const unlocked = game.achievements.filter(a => getLocalUnlocked(a)).length;
    const pct = total > 0 ? (unlocked / total) * 100 : 0;

    ratio.textContent = `${unlocked} / ${total}`;
    fill.style.width = `${pct}%`;
    
    // Update toggle button state
    const toggleBtn = $('#btn-toggle-local-trophies');
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isLocalMode);
    }

    // Helper to calculate rarity weight (Legendary = 4, Epic = 3, Rare = 2, Common = 1)
    const getRarityWeight = (apiname) => {
        if (!apiname) return 1;
        let hash = 0;
        for (let i = 0; i < apiname.length; i++) {
            hash = apiname.charCodeAt(i) + ((hash << 5) - hash);
        }
        const pct = Math.abs(hash % 100);
        if (pct < 5) return 4;
        if (pct < 20) return 3;
        if (pct < 50) return 2;
        return 1;
    };

    // Sort: unlocked achievements first (sorted by rarity weight), then locked achievements below
    const sorted = [...game.achievements].sort((a, b) => {
        const aUnlocked = getLocalUnlocked(a);
        const bUnlocked = getLocalUnlocked(b);
        if (aUnlocked !== bUnlocked) {
            return bUnlocked ? 1 : -1;
        }
        if (aUnlocked) {
            const wA = getRarityWeight(a.apiname);
            const wB = getRarityWeight(b.apiname);
            return wB - wA;
        }
        return 0; // Keep original order for locked achievements
    });

    sorted.forEach(ach => {
        const item = document.createElement('div');
        
        // Determine rarity
        let rarity = 'common';
        const weight = getRarityWeight(ach.apiname);
        if (weight === 4) rarity = 'legendary';
        else if (weight === 3) rarity = 'epic';
        else if (weight === 2) rarity = 'rare';

        const rarityText = {
            legendary: state.language === 'en' ? 'Legendary' : 'Légendaire',
            epic: state.language === 'en' ? 'Epic' : 'Épique',
            rare: state.language === 'en' ? 'Rare' : 'Rare',
            common: state.language === 'en' ? 'Common' : 'Commun'
        };

        const isUnlockedLocally = getLocalUnlocked(ach);
        item.className = `achievement-item ${isUnlockedLocally ? 'unlocked' : ''} rarity-${rarity}`;



        const iconHtml = ach.icon
            ? `<img src="${ach.icon}" alt="Icon">`
            : '🏆';

        item.innerHTML = `
            <div class="achievement-icon">${iconHtml}</div>
            <div class="achievement-text-info">
                <span class="achievement-name">${ach.name}</span>
                <span class="achievement-desc">${ach.description}</span>
            </div>
            ${isUnlockedLocally ? `<span class="achievement-rarity">${rarityText[rarity]}</span>` : ''}
        `;
        list.appendChild(item);
    });

    // Local Trophies toggle handler
    const localToggleBtn = $('#btn-toggle-local-trophies');
    if (localToggleBtn) {
        const newBtn = localToggleBtn.cloneNode(true);
        localToggleBtn.parentNode.replaceChild(newBtn, localToggleBtn);
        
        newBtn.addEventListener('click', () => {
            if (game.localTrophies) {
                game.localTrophies = false;
                game.localTrophiesBaseline = [];
                game.localTrophiesUnlockTimes = {};
                saveState();
                renderAchievementsInDetails(game);
                isInitialRender = false;
                renderBacklog($('#backlog-search').value);
                const t = translations[state.language] || translations.fr;
                showToast(t.local_trophies_deactivated_toast, '');
            } else {
                const overlay = $('#local-trophies-confirm-overlay');
                const t = translations[state.language] || translations.fr;
                
                $('#local-trophies-confirm-title').textContent = t.local_trophies_activate_title;
                $('#local-trophies-confirm-desc').textContent = t.local_trophies_activate_desc;
                $('#btn-local-trophies-cancel').textContent = t.local_trophies_cancel_btn;
                $('#btn-local-trophies-confirm').textContent = t.local_trophies_activate_btn;
                
                openModal(overlay);
                
                const confirmBtn = $('#btn-local-trophies-confirm');
                const cancelBtn = $('#btn-local-trophies-cancel');
                
                const cleanup = () => {
                    confirmBtn.removeEventListener('click', onConfirm);
                    cancelBtn.removeEventListener('click', onCancel);
                    closeModal(overlay);
                };
                
                const onConfirm = async () => {
                    game.localTrophies = true;
                    game.localTrophiesBaseline = game.achievements
                        .filter(a => a.unlocked)
                        .map(a => a.apiname);
                    game.localTrophiesUnlockTimes = {};
                    await saveState();
                    cleanup();
                    renderAchievementsInDetails(game);
                    isInitialRender = false;
                    renderBacklog($('#backlog-search').value);
                    showToast(t.local_trophies_activated_toast, '');
                };
                
                const onCancel = () => {
                    cleanup();
                };
                
                confirmBtn.addEventListener('click', onConfirm);
                cancelBtn.addEventListener('click', onCancel);
            }
        });
    }
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
    } catch (e) { console.warn('Failed to scan local game config:', e); }
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
    fetchAchievementsFromSteam(game, true);
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
                    fetchAchievementsFromSteam(game, true);
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

    // Capture initial state for session recap
    sessionStartSnapshot = {
        xp: state.profile ? state.profile.xp : 0,
        level: state.profile ? state.profile.level : 1,
        gold: state.profile ? state.profile.gold : 0,
        unlockedApinames: game.achievements ? game.achievements.filter(a => a.unlocked).map(a => a.apiname) : []
    };

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
    game.launchCount = (game.launchCount || 0) + 1;
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
            
            // Record contribution/activity history
            const today = new Date().toISOString().split('T')[0];
            if (!state.activityHistory) state.activityHistory = {};
            state.activityHistory[today] = (state.activityHistory[today] || 0) + 1;

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
        }, 60000),
        achievementsPollInterval: game.steamAppId ? setInterval(async () => {
            if (activePlaySession && activePlaySession.gameId === game.id) {
                await fetchAchievementsFromSteam(game, false);
            }
        }, 15000) : null
    };

    if (game.steamAppId) {
        fetchAchievementsFromSteam(game, true);
        if (isElectron) {
            window.questlog.watchLocalAchievements(game.steamAppId, game.exePath);
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
    if (activePlaySession.achievementsPollInterval) {
        clearInterval(activePlaySession.achievementsPollInterval);
    }
    if (isElectron) {
        window.questlog.stopWatchingLocalAchievements();
        window.questlog.destroyOverlay();
        window.questlog.clearDiscordPresence();
    }

    const game = state.backlog.find(g => g.id === activePlaySession.gameId);
    if (game) {
        const elapsedMinutes = Math.round((Date.now() - activePlaySession.startTime) / 60000);
        
        // Check daily boost and mega boost
        const isBoosted = state.dailyBoost && state.dailyBoost.gameIds && state.dailyBoost.gameIds.includes(game.id);
        const isMegaBoost = state.dailyBoost && state.dailyBoost.megaIds && state.dailyBoost.megaIds.includes(game.id);
        
        const xpMultiplier = isMegaBoost ? 2.0 : (isBoosted ? 1.5 : 1);
        const goldMultiplier = isMegaBoost ? 3.0 : (isBoosted ? 2 : 1);

        const xpEarned = Math.round(elapsedMinutes * 5 * xpMultiplier); // 5 XP per minute played (x1.5 if boosted, x2 if mega boosted)
        const goldEarned = Math.round(elapsedMinutes * 1 * goldMultiplier); // 1 gold per minute played (x2 if boosted, x3 if mega boosted)

        game.lastPlayed = Date.now();

        // Award rewards
        if (xpEarned > 0) {
            await addXp(xpEarned);
        }
        if (goldEarned > 0) {
            await addGold(goldEarned);
        }

        // Trigger visual recap overlay
        showSessionRecap(game, elapsedMinutes, xpEarned, goldEarned);
    }

    activePlaySession = null;
    // Retain the last played game in the Now Playing area instead of clearing it
    await saveState();
    renderAll();

    if (currentDetailsId && game && currentDetailsId === game.id) {
        const playBtn = $('#btn-play-game');
        playBtn.innerHTML = '<span style="display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Lancer le jeu</span>';
        playBtn.className = 'btn-primary btn-full';
        $('#launcher-status').textContent = game.exePath ? game.exePath.split('\\').pop() : 'Aucun exécutable lié';
    }
}

function showSessionRecap(game, elapsedMinutes, xpEarned, goldEarned) {
    const overlay = $('#session-recap-overlay');
    if (!overlay) return;

    if (isElectron) {
        window.questlog.showAndCenterWindow().catch(err => {
            console.warn('Failed to restore and center window for session recap:', err);
        });
    }

    // Game Metadata
    $('#recap-game-name').textContent = game.name;
    $('#recap-game-meta').textContent = `${game.platform} • ${game.genre}`;
    if (game.cover) {
        $('#recap-game-cover').style.backgroundImage = `url('${game.cover}')`;
        $('#recap-game-cover').style.display = 'block';
    } else {
        $('#recap-game-cover').style.display = 'none';
    }

    // Set initial stats values to 0 for anim
    const timeValEl = $('#recap-stat-time');
    const xpValEl = $('#recap-stat-xp');
    const goldValEl = $('#recap-stat-gold');

    timeValEl.textContent = '0 min';
    xpValEl.textContent = '+0 XP';
    goldValEl.textContent = '+0';

    // Level Up Check
    const startLevel = sessionStartSnapshot ? sessionStartSnapshot.level : 1;
    const currentLevel = state.profile ? state.profile.level : 1;
    const banner = $('#recap-level-up-banner');
    const hasLeveledUp = currentLevel > startLevel;
    if (hasLeveledUp) {
        banner.style.display = 'block';
        $('#recap-new-level').textContent = state.language === 'en'
            ? `New level reached: ${currentLevel}`
            : `Nouveau niveau atteint : ${currentLevel}`;
    } else {
        banner.style.display = 'none';
    }

    // Achievements list delta check
    const snapshotApinames = sessionStartSnapshot ? sessionStartSnapshot.unlockedApinames : [];
    const sessionUnlockedAchs = game.achievements ? game.achievements.filter(a => a.unlocked && !snapshotApinames.includes(a.apiname)) : [];
    const achSection = $('#recap-achievements-section');
    const achList = $('#recap-achievements-list');
    achList.innerHTML = '';

    const hasAchievements = sessionUnlockedAchs.length > 0;
    if (hasAchievements) {
        achSection.style.display = 'flex';
        sessionUnlockedAchs.forEach(ach => {
            const achItem = document.createElement('div');
            achItem.className = 'recap-ach-item';
            
            const iconHtml = ach.icon
                ? `<div class="recap-ach-icon" style="background-image: url('${ach.icon}')"></div>`
                : `<div class="recap-ach-icon" style="display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); color: var(--accent-violet);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                        <path d="M4 22h16"/>
                        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
                        <path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z"/>
                    </svg>
                   </div>`;
                
            achItem.innerHTML = `
                ${iconHtml}
                <div style="overflow: hidden; flex-grow: 1;">
                    <div class="recap-ach-name">${ach.name}</div>
                    <div class="recap-ach-desc">${ach.description}</div>
                </div>
            `;
            achList.appendChild(achItem);
        });
    } else {
        achSection.style.display = 'none';
    }

    // Reset visibility classes on elements before opening modal
    const items = overlay.querySelectorAll('.recap-item');
    items.forEach(el => el.classList.remove('revealed'));

    // Open modal
    openModal(overlay);

    // Helpers function for numbers counting animation
    function animateCount(el, start, end, duration, prefix = '', suffix = '') {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = progress * (2 - progress); // Ease out Quad
            const current = Math.round(start + easeProgress * (end - start));
            el.textContent = `${prefix}${current}${suffix}`;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = `${prefix}${end}${suffix}`;
            }
        }
        requestAnimationFrame(update);
    }

    // Cascade animations and sound triggers
    let delay = 200;

    // 1. Reveal Game Header Info
    setTimeout(() => {
        const headerItem = overlay.querySelector('.recap-item');
        if (headerItem) {
            headerItem.classList.add('revealed');
            playSynthSound('tick');
        }
    }, delay);

    // 2. Reveal Stats Cards and animate count ups
    delay += 500;
    setTimeout(() => {
        const statCards = overlay.querySelectorAll('div[style*="grid-template-columns"] .recap-item');
        statCards.forEach((card, idx) => {
            setTimeout(() => {
                card.classList.add('revealed');
                playSynthSound('tick');
                
                if (idx === 0) animateCount(timeValEl, 0, elapsedMinutes, 1000, '', ' min');
                if (idx === 1) animateCount(xpValEl, 0, xpEarned, 1000, '+', ' XP');
                if (idx === 2) animateCount(goldValEl, 0, goldEarned, 1000, '+', '');
            }, idx * 150);
        });
    }, delay);

    // 3. Level Up Banner (if active)
    if (hasLeveledUp) {
        delay += 900;
        setTimeout(() => {
            banner.classList.add('revealed');
            playSynthSound('levelup');
        }, delay);
    }

    // 4. Achievements List (if active)
    if (hasAchievements) {
        delay += 400;
        setTimeout(() => {
            achSection.classList.add('revealed');
            playSynthSound('connect');
        }, delay);
    }

    // 5. Continuer button
    delay += 400;
    setTimeout(() => {
        const confirmBtn = $('#btn-session-recap-confirm');
        if (confirmBtn) {
            confirmBtn.classList.add('revealed');
            playSynthSound('tick');
        }
    }, delay);

    // Close button registration
    const confirmBtn = $('#btn-session-recap-confirm');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        closeModal(overlay);
    });
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

    const isNewGame = currentDetailsId !== id;

    const isReleased = !game.comingSoon && (!game.releaseDate || game.releaseDate * 1000 <= Date.now());
    const locale = state.language === 'en' ? 'en-US' : 'fr-FR';
    const formattedReleaseDate = game.releaseDate ? new Date(game.releaseDate * 1000).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    currentDetailsId = id;
    currentDetailsSource = fromCompleted ? 'completed' : 'backlog';

    $('#details-title').textContent = game.name;
    $('#details-platform').textContent = game.platform;
    $('#details-genre').textContent = game.genre;

    const badge = $('#details-status-badge');
    badge.className = `details-status-badge ${fromCompleted ? 'status-completed' : 'status-backlog'}`;
    badge.textContent = fromCompleted ? 'Terminé' : 'À Jouer';

    if (game.cover) {
        const coverEl = $('#details-cover-large');
        const igdbHdUrl = game.cover.replace('t_thumb', 't_720p').replace('t_cover_big', 't_720p');
        
        // Define default IGDB HD cover first to prevent empty banner during load
        coverEl.style.setProperty('--cover-url', `url('${igdbHdUrl}')`);
        coverEl.style.display = 'block';
        
        if (game.steamAppId) {
            const steamUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/library_hero.jpg`;
            const imgTest = new Image();
            imgTest.src = steamUrl;
            imgTest.onload = () => {
                // If Steam library hero exists, swap it in
                if (currentDetailsId === game.id) {
                    coverEl.style.setProperty('--cover-url', `url('${steamUrl}')`);
                }
            };
        }
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

        if (!isReleased) {
            playBtn.innerHTML = `<span><svg class="panel-svg" style="width:16px; height:16px; margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Bientôt disponible</span>`;
            playBtn.className = 'btn-primary btn-full';
            playBtn.style.opacity = '0.5';
            playBtn.style.pointerEvents = 'none'; // Disable click
            statusSpan.textContent = game.steamCountdownText 
                ? translateCountdownText(game.steamCountdownText)
                : (formattedReleaseDate 
                    ? (state.language === 'en' ? `Releasing on ${formattedReleaseDate}` : `Sortie le ${formattedReleaseDate}`)
                    : (state.language === 'en' ? 'Release date to be determined' : 'Date de sortie à déterminer'));
        } else {
            playBtn.style.opacity = '1';
            playBtn.style.pointerEvents = 'auto'; // Enable click
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
        let releaseLabel = '';
        if (!isReleased) {
            const releaseDisplay = formattedReleaseDate || (state.language === 'en' ? 'TBD' : 'À déterminer');
            releaseLabel = ` • <span style="color: var(--accent-violet); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;"><svg class="stat-svg" style="width:12px; height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${state.language === 'en' ? 'Releasing' : 'Sortie'} : ${releaseDisplay}</span>`;
        }
        $('#details-date').innerHTML = `Ajouté le ${formatDate(game.addedAt)}${playtimeLabel}${releaseLabel}`;
    }

    // Populate Steam AppID input
    const steamAppIdInput = $('#input-details-steam-appid');
    if (steamAppIdInput) {
        steamAppIdInput.value = game.steamAppId || '';
    }

    // Show/hide Open Steam Store button
    const openSteamStoreBtn = $('#btn-open-steam-store');
    if (openSteamStoreBtn) {
        openSteamStoreBtn.style.display = game.steamAppId ? 'inline-flex' : 'none';
    }

    // Populate Custom SteamID input & show/hide block
    const customIdBlock = $('#details-steam-customid-block');
    if (customIdBlock) {
        customIdBlock.style.display = game.steamAppId ? 'flex' : 'none';
    }
    const steamCustomIdInput = $('#input-details-steam-customid');
    if (steamCustomIdInput) {
        steamCustomIdInput.value = game.steamCustomId || '';
    }

    // Show/hide Open Game Folder button
    const openGameFolderBtn = $('#btn-open-game-folder');
    if (openGameFolderBtn) {
        openGameFolderBtn.style.display = game.exePath ? 'inline-flex' : 'none';
    }

    // Sync achievements or attempt auto-fill Steam ID
    if (game.steamAppId) {
        fetchAchievementsFromSteam(game);
        
        // Dynamically fetch or update release date and comingSoon status
        if (!game.releaseDate || game.comingSoon) {
            window.questlog.fetchSteamReleaseDate(game.steamAppId, state.language).then(res => {
                if (res && res.success) {
                    let changed = false;
                    if (res.releaseDate !== game.releaseDate) {
                        game.releaseDate = res.releaseDate;
                        changed = true;
                    }
                    if (res.comingSoon !== game.comingSoon) {
                        game.comingSoon = res.comingSoon;
                        changed = true;
                    }
                    if (res.countdownText !== game.steamCountdownText) {
                        game.steamCountdownText = res.countdownText;
                        changed = true;
                    }
                    if (changed) {
                        saveState();
                        if (currentDetailsId === game.id) {
                            openGameDetails(game.id, fromCompleted);
                        }
                        isInitialRender = false;
                        renderBacklog($('#backlog-search')?.value || '');
                    }
                }
            }).catch(err => console.warn('Failed to fetch release date for', game.name, err));
        }
    } else if (!fromCompleted) {
        tryAutoFindSteamAppId(game);
    }

    // Reset collapsible settings section to collapsed only if we are opening a different game
    const advContent = $('#advanced-params-content');
    const advArrow = $('#arrow-toggle-advanced');
    if (advContent && advArrow) {
        if (isNewGame) {
            advContent.classList.add('collapsed');
            advContent.classList.remove('expanded');
            advContent.style.maxHeight = '0';
            advArrow.style.transform = 'rotate(0deg)';
        } else {
            if (!advContent.classList.contains('collapsed')) {
                advContent.classList.add('expanded');
                advContent.style.maxHeight = advContent.scrollHeight + 'px';
                advArrow.style.transform = 'rotate(180deg)';
            }
        }
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

        $('#random-pick-result').style.display = 'none';
        $('#random-pick-result').classList.remove('visible');

        const track = $('#roulette-track');
        track.innerHTML = '';

        // Mix and repeat backlog items to build a scrolling ribbon
        const list = [];
        const backlogCopy = [...state.backlog];
        
        // Shuffle backlog copy
        for (let i = backlogCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [backlogCopy[i], backlogCopy[j]] = [backlogCopy[j], backlogCopy[i]];
        }

        // Fill up to 60 items
        while (list.length < 60) {
            list.push(...backlogCopy);
        }

        const rouletteItems = list.slice(0, 60);
        const targetIndex = 55;
        rouletteItems[targetIndex] = picked;

        // Populate track cards (80px height each)
        rouletteItems.forEach(game => {
            const item = document.createElement('div');
            item.style.height = '80px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '12px';
            item.style.padding = '0 16px';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
            item.style.width = '100%';
            item.style.boxSizing = 'border-box';

            const coverUrl = game.cover || '';
            const coverHtml = coverUrl
                ? `<div style="width: 40px; height: 55px; border-radius: 4px; background-image: url('${coverUrl}'); background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;"></div>`
                : `<div style="width: 40px; height: 55px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">🎮</div>`;

            item.innerHTML = `
                ${coverHtml}
                <div style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                    <div style="font-size: 0.9rem; font-weight: 700; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${game.name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${game.platform}</div>
                </div>
            `;
            track.appendChild(item);
        });

        // Spin physics trigger
        track.style.transition = 'none';
        track.style.transform = 'translateY(10px)';
        track.offsetHeight; // force reflow

        const targetOffset = targetIndex * 80 - 10;
        track.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        track.style.transform = `translateY(-${targetOffset}px)`;

        // Synthesize rolling audio clicks
        const startAudioTime = performance.now();
        const duration = 4000;
        let lastTickIndex = 0;

        function tickStep(now) {
            const elapsed = now - startAudioTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                const currentY = ease * targetOffset;
                const currentIndex = Math.floor(currentY / 80);
                if (currentIndex > lastTickIndex) {
                    playSynthSound('tick');
                    lastTickIndex = currentIndex;
                }
                requestAnimationFrame(tickStep);
            }
        }
        requestAnimationFrame(tickStep);

        // Display results at scroll end
        setTimeout(() => {
            $('#random-pick-name').textContent = picked.name;
            $('#random-pick-platform').textContent = `${picked.platform} • ${picked.genre}`;
            if (picked.cover) {
                $('#random-pick-cover').style.backgroundImage = `url('${picked.cover}')`;
                $('#random-pick-cover').style.display = 'block';
            } else {
                $('#random-pick-cover').style.display = 'none';
            }

            $('#random-pick-result').style.display = 'flex';
            $('#random-pick-result').classList.add('visible');

            playSynthSound('connect');
            if (window.launchConfetti) window.launchConfetti();

            state.currentGameId = picked.id;
            saveState();
            renderAll();

            $('#btn-accept-pick').onclick = () => {
                closeModal(overlay);
            };
        }, 4000);
    } else {
        state.currentGameId = picked.id;
        saveState();
        renderAll();
    }
}

// ---------- Confetti ----------
window.launchConfetti = function () {
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

    // Window focus real-time online achievements sync
    window.addEventListener('focus', async () => {
        if (activePlaySession) {
            const game = state.backlog.find(g => g.id === activePlaySession.gameId) || state.completed.find(g => g.id === activePlaySession.gameId);
            if (game && game.steamAppId) {
                await fetchAchievementsFromSteam(game, false);
            }
        }
    });

    // Window Controls (Electron)
    if (isElectron) {
        $('#btn-win-minimize')?.addEventListener('click', () => window.questlog.minimizeWindow());
        $('#btn-win-maximize')?.addEventListener('click', () => window.questlog.maximizeWindow());
        $('#btn-win-close')?.addEventListener('click', () => {
            // Trigger native OS notification
            try {
                if (Notification.permission === "granted") {
                    new Notification("Quest Log", {
                        body: "L'application continue de tourner en arrière-plan !",
                        icon: "icon.png"
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("Quest Log", {
                                body: "L'application continue de tourner en arrière-plan !",
                                icon: "icon.png"
                            });
                        }
                    });
                }
            } catch (e) { }

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
            
            // Try to auto detect local Steam ID in background if not connected
            if (isElectron) {
                window.questlog.detectLocalSteamId().then(async (res) => {
                    if (res.success && res.steamId) {
                        const input = $('#steam-profile-input');
                        if (input && !input.value.trim()) {
                            input.value = res.steamId;
                            
                            // Link automatically!
                            state.steamId = res.steamId;
                            state.steamProfileInput = res.steamId;
                            await saveState();
                            
                            $('#steam-status-label').textContent = '✅ Connecté';
                            $('#steam-status-label').style.color = 'var(--accent-emerald)';
                            
                            showToast(state.language === 'en' ? "Steam profile linked automatically!" : "Profil Steam lié automatiquement !", "🔌");
                            
                            // Trigger background staggered refresh of all games achievements
                            state.backlog.forEach((game, idx) => {
                                if (game.steamAppId) {
                                    setTimeout(async () => {
                                        await fetchAchievementsFromSteam(game);
                                        renderAll();
                                    }, idx * 150);
                                }
                            });
                        }
                    }
                }).catch(() => {});
            }
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
            
            // Refresh in background to clean remote stats and keep local/cache achievements
            state.backlog.forEach((game, idx) => {
                if (game.steamAppId) {
                    setTimeout(async () => {
                        await fetchAchievementsFromSteam(game);
                        renderAll();
                    }, idx * 150);
                }
            });
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
                
                // Refresh in background to sync all games online achievements
                state.backlog.forEach((game, idx) => {
                    if (game.steamAppId) {
                        setTimeout(async () => {
                            await fetchAchievementsFromSteam(game);
                            renderAll();
                        }, idx * 150);
                    }
                });
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

    // Languages
    $('#btn-lang-fr').addEventListener('click', () => {
        applyLanguage('fr');
        saveState();
        showToast(state.language === 'en' ? 'Language switched to French!' : 'Langue changée en Français !', '🌐');
    });
    $('#btn-lang-en').addEventListener('click', () => {
        applyLanguage('en');
        saveState();
        showToast(state.language === 'en' ? 'Language switched to English!' : 'Langue changée en Anglais !', '🌐');
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

                // Pass the auto-detected steamAppId and exePath from the scanner results!
                await addGame(g.name, platformVal, 'Autre', '', '', true, g.steamAppId || '', g.exePath || '');
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

    $('#btn-toggle-advanced-params').addEventListener('click', () => {
        const content = $('#advanced-params-content');
        const arrow = $('#arrow-toggle-advanced');
        if (content && arrow) {
            const isCollapsed = content.classList.contains('collapsed');
            if (isCollapsed) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                content.style.maxHeight = content.scrollHeight + 'px';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('collapsed');
                content.classList.remove('expanded');
                content.style.maxHeight = '0';
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    $('#btn-open-steam-store').addEventListener('click', () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId) || state.completed.find(g => g.id === currentDetailsId);
        if (game && game.steamAppId) {
            window.questlog.openExternalUrl(`https://store.steampowered.com/app/${game.steamAppId}`);
        }
    });

    $('#btn-open-game-folder').addEventListener('click', () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId) || state.completed.find(g => g.id === currentDetailsId);
        if (game && game.exePath) {
            window.questlog.openGameFolder(game.exePath);
        }
    });

    $('#btn-select-exe').addEventListener('click', () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId);
        if (game) selectExeFile(game, true);
    });

    $('#btn-save-details-steam-appid').addEventListener('click', async () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId) || state.completed.find(g => g.id === currentDetailsId);
        if (game) {
            const newAppId = $('#input-details-steam-appid').value.trim();
            
            // Clear old achievements cache if AppID changed
            if (game.steamAppId !== newAppId) {
                game.achievements = [];
            }
            
            game.steamAppId = newAppId;
            
            if (newAppId) {
                showToast("Steam AppID mis à jour !", "🔌");
                try {
                    const res = await window.questlog.fetchSteamReleaseDate(newAppId, state.language);
                    if (res && res.success) {
                        if (res.releaseDate) game.releaseDate = res.releaseDate;
                        if (res.comingSoon !== undefined) game.comingSoon = res.comingSoon;
                        if (res.countdownText) game.steamCountdownText = res.countdownText;
                    }
                } catch (e) {
                    console.warn('Failed to fetch Steam release date on manual bind:', e);
                }
                await fetchAchievementsFromSteam(game, true);
            } else {
                showToast(t('toast_steam_unlinked') || "Liaison Steam retirée.", "ℹ️");
                game.releaseDate = null;
                game.comingSoon = null;
                game.steamCountdownText = null;
                game.steamCustomId = '';
            }
            
            await saveState();
            renderAchievementsInDetails(game);
            
            // Re-render current details if open to refresh countdown UI in details panel
            if (currentDetailsId === game.id) {
                openGameDetails(game.id, currentDetailsSource === 'completed');
            }
            renderAll();
        }
    });

    $('#btn-save-details-steam-customid').addEventListener('click', async () => {
        if (!currentDetailsId) return;
        const game = state.backlog.find(g => g.id === currentDetailsId) || state.completed.find(g => g.id === currentDetailsId);
        if (game) {
            const newCustomId = $('#input-details-steam-customid').value.trim();
            
            if (newCustomId) {
                game.steamCustomId = newCustomId;
                await saveState();
                
                const statusRes = await fetchAchievementsFromSteam(game, true);
                if (statusRes && statusRes.success) {
                    showToast(t('toast_steam_customid_updated') || "SteamID perso mis à jour !", "🔌");
                } else {
                    const errorMsg = statusRes?.error || "Erreur de connexion.";
                    let translatedError = errorMsg;
                    if (errorMsg.includes('private') || errorMsg.includes('Private') || errorMsg.includes('Requested files not found')) {
                        translatedError = state.language === 'en' ? "Steam profile is private or invalid ID" : "Profil Steam privé ou ID invalide";
                    }
                    showToast(translatedError, "❌");
                }
            } else {
                game.steamCustomId = '';
                await saveState();
                await fetchAchievementsFromSteam(game, true);
                showToast(t('toast_steam_customid_removed') || "SteamID perso retiré.", "ℹ️");
            }
            
            renderAchievementsInDetails(game);
            
            if (currentDetailsId === game.id) {
                openGameDetails(game.id, currentDetailsSource === 'completed');
            }
            renderAll();
        }
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

    // Stats Dashboard Trigger events
    const openStats = () => {
        renderDetailedStats();
        openModal($('#stats-overlay'));
    };
    $('#stat-backlog')?.addEventListener('click', openStats);
    $('#stat-completed')?.addEventListener('click', openStats);
    $('#stat-total-playtime')?.addEventListener('click', openStats);
    $('#stat-avg-rating')?.addEventListener('click', openStats);
    $('#profile-level')?.addEventListener('click', openStats);
    $('#btn-close-stats-cross')?.addEventListener('click', () => closeModal($('#stats-overlay')));
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
    await computeDailyBoost();
    createParticles();
    initEvents();
    renderAll();
    
    // Initialize gamer quote and bind interactivity
    updateGamerQuote();
    $('#gamer-quote')?.addEventListener('click', () => updateGamerQuote(true));

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

            // Ensure achievements are loaded to prevent property lookup exceptions
            if (!game.achievements || game.achievements.length === 0) {
                await fetchAchievementsFromSteam(game, true);
            }
            if (!game.achievements) {
                game.achievements = [];
            }

            let updatedAny = false;
            for (const apiname of newlyUnlockedApinames) {
                const ach = game.achievements.find(a => {
                    const cleanLoc = apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanApi = a.apiname.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanName = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanLoc === cleanApi || cleanLoc === cleanName || cleanLoc.includes(cleanApi) || cleanApi.includes(cleanLoc);
                });
                const isAlreadyAwarded = ach ? (ach.xpAwarded === true || ach.xpAwarded === 1) : false;
                const isInBaseline = game.localTrophies && (game.localTrophiesBaseline || []).includes(apiname);
                if (ach && !ach.unlocked && !isAlreadyAwarded && !isInBaseline) {
                    ach.unlocked = true;
                    ach.xpAwarded = true; // Mark as rewarded!
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

    // Tenter de trouver les executables en tâche de fond pour les jeux non liés
    if (isElectron && state.backlog) {
        state.backlog.forEach(async (game) => {
            if (!game.exePath && game.autoDetectExe !== false) {
                try {
                    const autoPath = await window.questlog.autoFindExe(game.name);
                    if (autoPath) {
                        game.exePath = autoPath;
                        await saveState();
                        showToast(`Exécutable trouvé automatiquement pour ${game.name} : ${autoPath.split('\\').pop()} !`, "✅");
                        await scanLocalGameConfig(game, autoPath);
                        renderAll();
                    }
                } catch (e) {
                    console.warn(`Recherche d'exécutable en tâche de fond échouée pour ${game.name}:`, e);
                }
            }
        });
    }

    // Rafraîchir les succès et dates de sortie de tous les jeux en arrière-plan au démarrage
    if (state.backlog) {
        state.backlog.forEach((game, idx) => {
            if (game.steamAppId) {
                setTimeout(async () => {
                    // Automatically fetch or update release date and comingSoon status
                    if (!game.releaseDate || game.comingSoon) {
                        try {
                            const res = await window.questlog.fetchSteamReleaseDate(game.steamAppId);
                            if (res && res.success) {
                                let changed = false;
                                if (res.releaseDate !== game.releaseDate) {
                                    game.releaseDate = res.releaseDate;
                                    changed = true;
                                }
                                if (res.comingSoon !== game.comingSoon) {
                                    game.comingSoon = res.comingSoon;
                                    changed = true;
                                }
                                if (changed) {
                                    await saveState();
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to fetch release date on startup for', game.name, e);
                        }
                    }
                    await fetchAchievementsFromSteam(game, true);
                    renderAll();
                }, idx * 1000); // échelonner 1s par jeu pour ne pas saturer l'API
            }
        });
    }

    // Check if app version has updated to show release notes
    await checkAndShowChangelog();

    // Auto-refresh countdown badges for unreleased games every minute
    setInterval(() => {
        if (!state.backlog) return;
        const hasUnreleased = state.backlog.some(g => g.releaseDate && g.releaseDate * 1000 > Date.now());
        if (hasUnreleased) {
            isInitialRender = false;
            const searchVal = $('#backlog-search') ? $('#backlog-search').value : '';
            renderBacklog(searchVal);
        }
    }, 60000);
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
                        itemEl.className = 'changelog-card-item';

                        itemEl.innerHTML = `
                            <div style="flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; background: var(--accent-violet-dim); border: 1px solid rgba(167, 139, 250, 0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-violet);">
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
