// ===== ÉTAT DU JEU =====
const gameState = {
    mode: 'vsAI', // 'vsAI' ou 'vsPlayer'
    difficulty: 'easy', // 'easy', 'normal', 'hard'
    playerColor: 'white', // 'white' ou 'black'
    player1: {
        name: '',
        color: 'white'
    },
    player2: {
        name: '',
        color: 'black'
    },
    settings: {
        hp: 10,
        defenders: 2,
        tacticalVictory: 6,
        maxTurns: 10
    }
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeModeSelection();
    initializeAIOptions();
    initializePlayerOptions();
    initializeSliders();
    initializeRulesToggle();
    initializeStartButton();
});

// ===== SÉLECTION DU MODE =====
function initializeModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-button');
    const aiOptions = document.getElementById('ai-options');
    const playerOptions = document.getElementById('player-options');

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            modeButtons.forEach(btn => btn.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');

            const mode = button.dataset.mode;
            gameState.mode = mode;

            // Afficher/masquer les options appropriées
            if (mode === 'vsAI') {
                aiOptions.classList.remove('hidden');
                playerOptions.classList.add('hidden');
            } else {
                aiOptions.classList.add('hidden');
                playerOptions.classList.remove('hidden');
            }
        });
    });
}

// ===== OPTIONS IA =====
function initializeAIOptions() {
    // Difficulté
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.difficulty = button.dataset.difficulty;
        });
    });

    // Couleur du joueur (mode IA)
    const colorButtons = document.querySelectorAll('.ai-options .color-button');
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            colorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.playerColor = button.dataset.color;
        });
    });
}

// ===== OPTIONS JOUEURS =====
function initializePlayerOptions() {
    // Inputs pour les noms
    const player1Input = document.getElementById('player1-name');
    const player2Input = document.getElementById('player2-name');

    player1Input.addEventListener('input', (e) => {
        gameState.player1.name = e.target.value.trim();
    });

    player2Input.addEventListener('input', (e) => {
        gameState.player2.name = e.target.value.trim();
    });

    // Couleurs des joueurs
    const player1ColorButtons = document.querySelectorAll('[data-player="1"]');
    const player2ColorButtons = document.querySelectorAll('[data-player="2"]');

    player1ColorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const color = button.dataset.color;

            // Ne pas permettre la même couleur pour les deux joueurs
            if (color === gameState.player2.color) {
                showNotification('Les deux joueurs ne peuvent pas avoir la même couleur !');
                return;
            }

            player1ColorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.player1.color = color;
        });
    });

    player2ColorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const color = button.dataset.color;

            // Ne pas permettre la même couleur pour les deux joueurs
            if (color === gameState.player1.color) {
                showNotification('Les deux joueurs ne peuvent pas avoir la même couleur !');
                return;
            }

            player2ColorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.player2.color = color;
        });
    });
}

// ===== SLIDERS =====
function initializeSliders() {
    // HP de départ
    const hpSlider = document.getElementById('hp-slider');
    const hpValue = document.getElementById('hp-value');
    hpSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        hpValue.textContent = value;
        gameState.settings.hp = parseInt(value);
    });

    // Défenseurs max
    const defendersSlider = document.getElementById('defenders-slider');
    const defendersValue = document.getElementById('defenders-value');
    defendersSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        defendersValue.textContent = value;
        gameState.settings.defenders = parseInt(value);
    });

    // Victoire tactique
    const tacticalSlider = document.getElementById('tactical-slider');
    const tacticalValue = document.getElementById('tactical-value');
    tacticalSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        tacticalValue.textContent = value;
        gameState.settings.tacticalVictory = parseInt(value);
    });

    // Nombre de tours max
    const turnsSlider = document.getElementById('turns-slider');
    const turnsValue = document.getElementById('turns-value');
    turnsSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        turnsValue.textContent = value;
        gameState.settings.maxTurns = parseInt(value);
    });
}

// ===== TOGGLE DES RÈGLES =====
function initializeRulesToggle() {
    const rulesToggle = document.getElementById('rules-toggle');
    const rulesContent = document.getElementById('rules-content');

    rulesToggle.addEventListener('click', () => {
        rulesToggle.classList.toggle('active');
        rulesContent.classList.toggle('active');
        rulesContent.classList.toggle('hidden');
    });
}

// ===== BOUTON COMMENCER =====
function initializeStartButton() {
    const startButton = document.getElementById('start-button');

    startButton.addEventListener('click', () => {
        if (validateGameSettings()) {
            startGame();
        }
    });
}

// ===== VALIDATION =====
function validateGameSettings() {
    if (gameState.mode === 'vsPlayer') {
        // Vérifier que les deux joueurs ont entré leur pseudo
        if (!gameState.player1.name || gameState.player1.name.length < 2) {
            showNotification('Le Joueur 1 doit entrer un pseudo (min. 2 caractères) !');
            return false;
        }
        if (!gameState.player2.name || gameState.player2.name.length < 2) {
            showNotification('Le Joueur 2 doit entrer un pseudo (min. 2 caractères) !');
            return false;
        }

        // Vérifier que les pseudos sont différents
        if (gameState.player1.name.toLowerCase() === gameState.player2.name.toLowerCase()) {
            showNotification('Les deux joueurs doivent avoir des pseudos différents !');
            return false;
        }

        // Vérifier que les couleurs sont différentes
        if (gameState.player1.color === gameState.player2.color) {
            showNotification('Les deux joueurs doivent avoir des couleurs différentes !');
            return false;
        }
    }

    return true;
}

// ===== NOTIFICATION =====
function showNotification(message) {
    // Supprimer l'ancienne notification si elle existe
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    // Créer la notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Ajouter le style inline (ou vous pouvez l'ajouter au CSS)
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #e94560 0%, #ff6b81 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInDown 0.4s ease-out;
        font-weight: 600;
        font-size: 1rem;
        max-width: 90%;
        text-align: center;
    `;

    document.body.appendChild(notification);

    // Retirer la notification après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Ajouter les animations pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            transform: translate(-50%, -100px);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }

    @keyframes slideOutUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== DÉMARRER LA PARTIE =====
function startGame() {
    console.log('🎮 Démarrage de la partie avec les paramètres suivants :');
    console.log('Mode:', gameState.mode);

    if (gameState.mode === 'vsAI') {
        console.log('Difficulté:', gameState.difficulty);
        console.log('Couleur du joueur:', gameState.playerColor);
    } else {
        console.log('Joueur 1:', gameState.player1);
        console.log('Joueur 2:', gameState.player2);
    }

    console.log('Paramètres:', gameState.settings);

    // Animation de démarrage
    const startButton = document.getElementById('start-button');
    startButton.textContent = '⚔️ Chargement...';
    startButton.disabled = true;

    // Simuler le chargement
    setTimeout(() => {
        showNotification('🎮 La partie commence ! (Interface de jeu à venir)');

        // Réinitialiser le bouton après 2 secondes
        setTimeout(() => {
            startButton.innerHTML = '<span class="start-icon">⚔️</span>Commencer la partie';
            startButton.disabled = false;
        }, 2000);

        // ICI : Vous pourrez rediriger vers l'interface de jeu
        // window.location.href = 'game.html';
        // OU afficher l'interface de jeu dans la même page
    }, 1000);
}

// ===== FONCTIONS UTILITAIRES =====

// Récupérer l'état actuel du jeu
function getGameState() {
    return { ...gameState };
}

// Réinitialiser le jeu
function resetGame() {
    gameState.mode = 'vsAI';
    gameState.difficulty = 'easy';
    gameState.playerColor = 'white';
    gameState.player1 = { name: '', color: 'white' };
    gameState.player2 = { name: '', color: 'black' };
    gameState.settings = {
        hp: 10,
        defenders: 2,
        tacticalVictory: 6,
        maxTurns: 10
    };

    // Réinitialiser l'interface
    document.getElementById('player1-name').value = '';
    document.getElementById('player2-name').value = '';
    document.getElementById('hp-slider').value = 10;
    document.getElementById('hp-value').textContent = 10;
    document.getElementById('defenders-slider').value = 2;
    document.getElementById('defenders-value').textContent = 2;
    document.getElementById('tactical-slider').value = 6;
    document.getElementById('tactical-value').textContent = 6;
    document.getElementById('turns-slider').value = 10;
    document.getElementById('turns-value').textContent = 10;
}

// Sauvegarder les paramètres dans le localStorage
function saveSettings() {
    localStorage.setItem('chessCardsSettings', JSON.stringify(gameState.settings));
}

// Charger les paramètres depuis le localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('chessCardsSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        gameState.settings = settings;

        // Mettre à jour l'interface
        document.getElementById('hp-slider').value = settings.hp;
        document.getElementById('hp-value').textContent = settings.hp;
        document.getElementById('defenders-slider').value = settings.defenders;
        document.getElementById('defenders-value').textContent = settings.defenders;
        document.getElementById('tactical-slider').value = settings.tacticalVictory;
        document.getElementById('tactical-value').textContent = settings.tacticalVictory;
        document.getElementById('turns-slider').value = settings.maxTurns;
        document.getElementById('turns-value').textContent = settings.maxTurns;
    }
}

// Charger les paramètres au démarrage
loadSettings();

// Sauvegarder les paramètres quand ils changent
document.querySelectorAll('.slider').forEach(slider => {
    slider.addEventListener('change', saveSettings);
});

// ===== EXPORT POUR UTILISATION FUTURE =====
// Ces fonctions pourront être utilisées par d'autres scripts
window.ChessCards = {
    getGameState,
    resetGame,
    saveSettings,
    loadSettings,
    startGame
};

// ===== EASTER EGG =====
// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    showNotification('🎉 Mode Maître des Échecs activé ! 👑');
    document.body.style.animation = 'rainbow 2s infinite';

    const rainbowStyle = document.createElement('style');
    rainbowStyle.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(rainbowStyle);

    setTimeout(() => {
        document.body.style.animation = '';
        rainbowStyle.remove();
    }, 10000);
}

console.log('♔ Chess & Cards - Menu Principal chargé ♛');
console.log('Utilisez window.ChessCards pour accéder aux fonctions du jeu');
