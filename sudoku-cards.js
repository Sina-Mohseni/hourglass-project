// ===============================
// CONSTANTES ET CONFIGURATION
// ===============================

const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white', 'gray'];
const COLOR_NAMES = {
    red: 'Rouge',
    blue: 'Bleu',
    green: 'Vert',
    yellow: 'Jaune',
    orange: 'Orange',
    purple: 'Mauve',
    black: 'Noir',
    white: 'Blanc',
    gray: 'Gris'
};
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ===============================
// VARIABLES GLOBALES
// ===============================

let gameState = {
    deck: [],
    players: [],
    piles: Array(9).fill(null).map(() => []),
    currentPlayerIndex: 0,
    round: 1,
    maxScore: 100,
    selectedCard: null,
    selectedPile: null,
    lastRoundLoser: null,
    playingJoker: false
};

// ===============================
// GESTION DU MENU
// ===============================

function initMenu() {
    const numPlayersSelect = document.getElementById('num-players');
    const playersSetup = document.getElementById('players-setup');
    const startGameBtn = document.getElementById('start-game-btn');

    // Mise à jour de la configuration des joueurs
    numPlayersSelect.addEventListener('change', () => {
        updatePlayersSetup(parseInt(numPlayersSelect.value));
    });

    // Initialiser avec 2 joueurs
    updatePlayersSetup(2);

    // Démarrage de la partie
    startGameBtn.addEventListener('click', startGame);
}

function updatePlayersSetup(numPlayers) {
    const playersSetup = document.getElementById('players-setup');
    playersSetup.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-setup';
        playerDiv.innerHTML = `
            <h3>Joueur ${i + 1}</h3>
            <div class="player-type-selector">
                <button class="player-type-btn ${i === 0 ? 'active' : ''}" data-player="${i}" data-type="human">
                    Humain
                </button>
                <button class="player-type-btn ${i > 0 ? 'active' : ''}" data-player="${i}" data-type="ai">
                    IA
                </button>
            </div>
            <div class="player-config player-config-human ${i === 0 ? 'active' : ''}" data-player="${i}">
                <div class="setting-group">
                    <label>Pseudo :</label>
                    <input type="text" class="player-name-input" value="Joueur ${i + 1}" placeholder="Entrez un pseudo">
                </div>
            </div>
            <div class="player-config player-config-ai ${i > 0 ? 'active' : ''}" data-player="${i}">
                <div class="setting-group">
                    <label>Difficulté :</label>
                    <div class="ai-difficulty">
                        <button class="difficulty-btn" data-difficulty="easy">Facile</button>
                        <button class="difficulty-btn active" data-difficulty="normal">Normal</button>
                        <button class="difficulty-btn" data-difficulty="hard">Difficile</button>
                    </div>
                </div>
            </div>
        `;
        playersSetup.appendChild(playerDiv);
    }

    // Événements pour les boutons de type de joueur
    document.querySelectorAll('.player-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const playerIndex = e.target.dataset.player;
            const type = e.target.dataset.type;

            // Mettre à jour les boutons actifs
            const container = e.target.parentElement;
            container.querySelectorAll('.player-type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Afficher la bonne configuration
            const configs = document.querySelectorAll(`.player-config[data-player="${playerIndex}"]`);
            configs.forEach(config => config.classList.remove('active'));
            document.querySelector(`.player-config-${type}[data-player="${playerIndex}"]`).classList.add('active');
        });
    });

    // Événements pour les boutons de difficulté
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = e.target.parentElement;
            container.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

function startGame() {
    // Récupérer la configuration
    const maxScore = parseInt(document.getElementById('max-score').value);
    const numPlayers = parseInt(document.getElementById('num-players').value);

    // Créer les joueurs
    const players = [];
    for (let i = 0; i < numPlayers; i++) {
        const typeBtn = document.querySelector(`.player-type-btn.active[data-player="${i}"]`);
        const type = typeBtn.dataset.type;

        if (type === 'human') {
            const nameInput = document.querySelector(`.player-config-human[data-player="${i}"] .player-name-input`);
            players.push({
                id: i,
                name: nameInput.value || `Joueur ${i + 1}`,
                type: 'human',
                hand: [],
                score: 0,
                eliminated: false,
                jokers: 0,
                consecutiveLosses: 0
            });
        } else {
            const difficultyBtn = document.querySelector(`.player-config-ai[data-player="${i}"] .difficulty-btn.active`);
            const difficulty = difficultyBtn.dataset.difficulty;
            players.push({
                id: i,
                name: `IA ${i + 1} (${difficulty === 'easy' ? 'Facile' : difficulty === 'normal' ? 'Normal' : 'Difficile'})`,
                type: 'ai',
                difficulty: difficulty,
                hand: [],
                score: 0,
                eliminated: false,
                jokers: 0,
                consecutiveLosses: 0
            });
        }
    }

    // Initialiser le jeu
    gameState = {
        deck: createDeck(),
        players: players,
        piles: Array(9).fill(null).map(() => []),
        currentPlayerIndex: 0,
        round: 1,
        maxScore: maxScore,
        selectedCard: null,
        selectedPile: null,
        lastRoundLoser: null,
        playingJoker: false
    };

    // Passer à l'écran de jeu
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // Démarrer la première manche
    startRound();
}

// ===============================
// CRÉATION DU DECK
// ===============================

function createDeck() {
    const deck = [];
    for (const color of COLORS) {
        for (const number of NUMBERS) {
            deck.push({ color, number });
        }
    }
    return shuffleDeck(deck);
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ===============================
// GESTION DES MANCHES
// ===============================

function startRound() {
    // Réinitialiser le deck et les piles
    gameState.deck = createDeck();
    gameState.piles = Array(9).fill(null).map(() => []);
    gameState.selectedCard = null;
    gameState.selectedPile = null;
    gameState.playingJoker = false;

    // Réinitialiser les joueurs
    gameState.players.forEach(player => {
        player.hand = [];
        player.eliminated = false;
    });

    // Distribuer 5 cartes à chaque joueur
    gameState.players.forEach(player => {
        for (let i = 0; i < 5; i++) {
            player.hand.push(gameState.deck.pop());
        }
    });

    // Si c'est la première manche, le joueur 0 commence
    // Sinon, le perdant de la manche précédente commence
    if (gameState.lastRoundLoser !== null) {
        gameState.currentPlayerIndex = gameState.lastRoundLoser.id;
    } else {
        gameState.currentPlayerIndex = 0;
    }

    // Mettre à jour l'affichage
    updateGameDisplay();

    // Commencer le premier tour
    playTurn();
}

function endRound(eliminatedPlayer) {
    // Calculer les points
    const points = eliminatedPlayer.hand.reduce((sum, card) => sum + card.number, 0);
    eliminatedPlayer.score += points;

    // Gérer le système de jokers
    // Si c'est le même joueur que la manche précédente qui perd
    if (gameState.lastRoundLoser && gameState.lastRoundLoser.id === eliminatedPlayer.id) {
        eliminatedPlayer.consecutiveLosses++;
        eliminatedPlayer.jokers = eliminatedPlayer.consecutiveLosses;
    } else {
        // Si c'est un autre joueur qui perd
        // Réinitialiser les pertes consécutives des autres joueurs
        gameState.players.forEach(player => {
            if (player.id !== eliminatedPlayer.id && player.consecutiveLosses > 0) {
                player.consecutiveLosses = 0;
            }
        });

        eliminatedPlayer.consecutiveLosses = 1;
        eliminatedPlayer.jokers = 1;
    }

    // Mémoriser le perdant de cette manche
    gameState.lastRoundLoser = eliminatedPlayer;

    // Afficher le modal de fin de manche
    const modal = document.getElementById('round-end-modal');
    const roundResult = document.getElementById('round-result');
    const scoresTable = document.getElementById('scores-table');

    const jokerMessage = eliminatedPlayer.jokers > 0
        ? `<p style="color: #ffd700; margin-top: 10px;">⭐ Vous commencerez la prochaine manche avec ${eliminatedPlayer.jokers} Joker${eliminatedPlayer.jokers > 1 ? 's' : ''} !</p>`
        : '';

    roundResult.innerHTML = `
        <p><strong>${eliminatedPlayer.name}</strong> a été éliminé(e) !</p>
        <p>Points gagnés : <span style="color: var(--danger)">+${points}</span></p>
        ${jokerMessage}
    `;

    // Afficher les scores
    let scoresHTML = '<div class="scores-table">';
    gameState.players.forEach(player => {
        const jokerBadge = player.jokers > 0 ? ` <span style="color: #ffd700;">(⭐×${player.jokers})</span>` : '';
        scoresHTML += `
            <div class="score-row ${player.id === eliminatedPlayer.id ? 'loser' : ''}">
                <span>${player.name}${jokerBadge}</span>
                <span>${player.score} points</span>
            </div>
        `;
    });
    scoresHTML += '</div>';
    scoresTable.innerHTML = scoresHTML;

    modal.classList.add('active');

    // Vérifier si la partie est terminée
    const loser = gameState.players.find(p => p.score >= gameState.maxScore);
    if (loser) {
        document.getElementById('next-round-btn').style.display = 'none';
        setTimeout(() => endGame(loser), 2000);
    } else {
        document.getElementById('next-round-btn').style.display = 'block';
    }
}

function nextRound() {
    document.getElementById('round-end-modal').classList.remove('active');
    gameState.round++;
    startRound();
}

function endGame(loser) {
    document.getElementById('round-end-modal').classList.remove('active');

    const modal = document.getElementById('game-end-modal');
    const gameResult = document.getElementById('game-result');
    const finalScores = document.getElementById('final-scores');

    // Trouver le gagnant (celui avec le moins de points)
    const winner = gameState.players.reduce((min, player) =>
        player.score < min.score ? player : min
    );

    gameResult.innerHTML = `
        <p style="color: var(--success); font-size: 1.5rem; font-weight: 700;">
            🏆 ${winner.name} gagne la partie ! 🏆
        </p>
        <p style="color: var(--danger); margin-top: 10px;">
            ${loser.name} a perdu avec ${loser.score} points
        </p>
    `;

    // Afficher les scores finaux
    const sortedPlayers = [...gameState.players].sort((a, b) => a.score - b.score);
    let scoresHTML = '<div class="scores-table">';
    sortedPlayers.forEach((player, index) => {
        scoresHTML += `
            <div class="score-row ${index === 0 ? 'winner' : index === sortedPlayers.length - 1 ? 'loser' : ''}">
                <span>${index + 1}. ${player.name}</span>
                <span>${player.score} points</span>
            </div>
        `;
    });
    scoresHTML += '</div>';
    finalScores.innerHTML = scoresHTML;

    modal.classList.add('active');
}

// ===============================
// GESTION DES TOURS
// ===============================

function playTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Vérifier si le joueur a des coups possibles (cartes ou jokers)
    const validMoves = getValidMoves(currentPlayer);
    const hasJoker = currentPlayer.jokers > 0;

    if (validMoves.length === 0 && !hasJoker) {
        // Le joueur est éliminé
        currentPlayer.eliminated = true;
        endRound(currentPlayer);
        return;
    }

    updateGameDisplay();

    // Si c'est une IA, jouer automatiquement après un délai
    if (currentPlayer.type === 'ai') {
        setTimeout(() => {
            playAITurn(currentPlayer, validMoves);
        }, 1000);
    }
}

function playCard(card, pileIndex) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Retirer la carte de la main du joueur
    const cardIndex = currentPlayer.hand.findIndex(c => c.color === card.color && c.number === card.number);
    currentPlayer.hand.splice(cardIndex, 1);

    // Ajouter la carte à la pile
    gameState.piles[pileIndex].push(card);

    // Piocher une nouvelle carte si le deck n'est pas vide
    if (gameState.deck.length > 0) {
        currentPlayer.hand.push(gameState.deck.pop());
    }

    // Passer au joueur suivant
    nextPlayer();
}

function playJoker(pileIndex) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Déterminer quelle carte le joker va représenter
    const pile = gameState.piles[pileIndex];
    let jokerCard;

    if (pile.length === 0) {
        // Pile vide : choisir une couleur disponible et un chiffre stratégique
        const usedColors = gameState.piles
            .filter(p => p.length > 0)
            .map(p => p[0].color);
        const availableColors = COLORS.filter(c => !usedColors.includes(c));

        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        const number = Math.floor(Math.random() * 9) + 1;

        jokerCard = { color, number, isJoker: true };
    } else {
        // Pile existante : suivre la couleur et choisir un chiffre manquant
        const color = pile[0].color;
        const usedNumbers = pile.map(c => c.number);
        const availableNumbers = NUMBERS.filter(n => !usedNumbers.includes(n));

        const number = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        jokerCard = { color, number, isJoker: true };
    }

    // Ajouter le joker à la pile
    gameState.piles[pileIndex].push(jokerCard);

    // Réduire le nombre de jokers
    currentPlayer.jokers--;

    // Piocher une nouvelle carte si le deck n'est pas vide
    if (gameState.deck.length > 0) {
        currentPlayer.hand.push(gameState.deck.pop());
    }

    // Passer au joueur suivant
    nextPlayer();
}

function nextPlayer() {
    gameState.selectedCard = null;
    gameState.selectedPile = null;
    gameState.playingJoker = false;

    do {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    } while (gameState.players[gameState.currentPlayerIndex].eliminated);

    playTurn();
}

function passTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    currentPlayer.eliminated = true;
    endRound(currentPlayer);
}

// ===============================
// VALIDATION DES COUPS
// ===============================

function getValidMoves(player) {
    const validMoves = [];

    for (let i = 0; i < player.hand.length; i++) {
        const card = player.hand[i];
        for (let pileIndex = 0; pileIndex < 9; pileIndex++) {
            if (isValidMove(card, pileIndex)) {
                validMoves.push({ card, pileIndex });
            }
        }
    }

    return validMoves;
}

function isValidMove(card, pileIndex) {
    const pile = gameState.piles[pileIndex];

    // Si la pile est vide, la carte peut être placée
    if (pile.length === 0) {
        // Vérifier que la couleur n'est pas déjà utilisée sur une autre pile
        const colorUsed = gameState.piles.some((p, i) =>
            i !== pileIndex && p.length > 0 && p[0].color === card.color
        );
        if (colorUsed) return false;

        // Vérifier les règles du Sudoku (pas de même chiffre dans la ligne/colonne)
        return checkSudokuRules(card, pileIndex);
    }

    // La pile a déjà des cartes
    // Vérifier que la couleur correspond
    if (pile[0].color !== card.color) return false;

    // Vérifier que la pile n'est pas complète (9 cartes)
    if (pile.length >= 9) return false;

    // Vérifier que le chiffre n'est pas déjà dans la pile
    if (pile.some(c => c.number === card.number)) return false;

    // Vérifier les règles du Sudoku (pas de même chiffre dans la ligne/colonne)
    return checkSudokuRules(card, pileIndex);
}

function checkSudokuRules(card, pileIndex) {
    const row = Math.floor(pileIndex / 3);
    const col = pileIndex % 3;

    // Vérifier la ligne
    for (let c = 0; c < 3; c++) {
        const otherPileIndex = row * 3 + c;
        if (otherPileIndex !== pileIndex) {
            const otherPile = gameState.piles[otherPileIndex];
            if (otherPile.length > 0) {
                const topCard = otherPile[otherPile.length - 1];
                if (topCard.number === card.number) return false;
            }
        }
    }

    // Vérifier la colonne
    for (let r = 0; r < 3; r++) {
        const otherPileIndex = r * 3 + col;
        if (otherPileIndex !== pileIndex) {
            const otherPile = gameState.piles[otherPileIndex];
            if (otherPile.length > 0) {
                const topCard = otherPile[otherPile.length - 1];
                if (topCard.number === card.number) return false;
            }
        }
    }

    return true;
}

// ===============================
// IA
// ===============================

function playAITurn(player, validMoves) {
    // Si l'IA n'a pas de coups valides mais a un joker, l'utiliser
    if (validMoves.length === 0 && player.jokers > 0) {
        // Trouver une pile non pleine
        const availablePiles = gameState.piles
            .map((pile, index) => ({ pile, index }))
            .filter(({ pile }) => pile.length < 9);

        if (availablePiles.length > 0) {
            const randomPile = availablePiles[Math.floor(Math.random() * availablePiles.length)];
            playJoker(randomPile.index);
        }
        return;
    }

    let chosenMove;

    switch (player.difficulty) {
        case 'easy':
            chosenMove = playEasyAI(validMoves);
            break;
        case 'normal':
            chosenMove = playNormalAI(validMoves, player);
            break;
        case 'hard':
            chosenMove = playHardAI(validMoves, player);
            break;
    }

    if (chosenMove) {
        playCard(chosenMove.card, chosenMove.pileIndex);
    }
}

function playEasyAI(validMoves) {
    // Choisir un coup aléatoire
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

function playNormalAI(validMoves, player) {
    // Essayer de jouer les cartes avec les plus grands nombres d'abord
    const sortedMoves = validMoves.sort((a, b) => b.card.number - a.card.number);
    return sortedMoves[0];
}

function playHardAI(validMoves, player) {
    // Stratégie avancée :
    // 1. Privilégier les piles vides pour bloquer les couleurs
    // 2. Jouer les cartes hautes en priorité
    // 3. Éviter de créer des situations où on pourrait se bloquer

    let bestMove = null;
    let bestScore = -1;

    for (const move of validMoves) {
        let score = move.card.number; // Base : jouer les cartes hautes

        // Bonus si c'est une pile vide (on bloque une couleur)
        if (gameState.piles[move.pileIndex].length === 0) {
            score += 5;
        }

        // Bonus si on a d'autres cartes de cette couleur
        const sameColorCount = player.hand.filter(c => c.color === move.card.color).length;
        score += sameColorCount * 2;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

// ===============================
// AFFICHAGE
// ===============================

function updateGameDisplay() {
    updateHeader();
    updatePlayersList();
    updatePiles();
    updatePlayerHand();
    updateDeckCount();
}

function updateHeader() {
    document.getElementById('current-round').textContent = gameState.round;
    document.getElementById('game-max-score').textContent = gameState.maxScore;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('current-player-name').textContent = currentPlayer.name;
}

function updatePlayersList() {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${index === gameState.currentPlayerIndex ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}`;

        const jokerBadge = player.jokers > 0 ? `<div class="player-joker-badge">⭐ ×${player.jokers}</div>` : '';

        playerCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-score">${player.score} pts</div>
            <div class="player-cards-count">${player.hand.length} carte(s)</div>
            ${jokerBadge}
            ${index === gameState.currentPlayerIndex && !player.eliminated ? '<div class="player-status">À jouer</div>' : ''}
            ${player.eliminated ? '<div class="player-status" style="background: var(--danger);">Éliminé</div>' : ''}
        `;

        playersList.appendChild(playerCard);
    });
}

function updatePiles() {
    const piles = document.querySelectorAll('.pile');

    piles.forEach((pileElement, index) => {
        const pile = gameState.piles[index];
        pileElement.innerHTML = '';

        if (pile.length === 0) {
            pileElement.innerHTML = '<div class="pile-empty-text">Pile vide</div>';
        } else {
            // Afficher seulement la carte du dessus
            const topCard = pile[pile.length - 1];
            const cardElement = createCardElement(topCard, false);
            pileElement.appendChild(cardElement);

            // Afficher le nombre de cartes dans la pile
            const countElement = document.createElement('div');
            countElement.style.cssText = 'position: absolute; bottom: 5px; right: 5px; background: var(--bg-primary); padding: 3px 8px; border-radius: 5px; font-size: 0.8rem;';
            countElement.textContent = `${pile.length}/9`;
            pileElement.appendChild(countElement);
        }

        // Gérer le clic sur les piles
        pileElement.onclick = () => handlePileClick(index);
    });
}

function updatePlayerHand() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const handElement = document.getElementById('player-hand');
    const passBtn = document.getElementById('pass-turn-btn');
    const jokerIndicator = document.getElementById('joker-count');
    const jokerNumber = document.getElementById('joker-number');

    handElement.innerHTML = '';

    // Afficher l'indicateur de jokers si le joueur en a
    if (currentPlayer.jokers > 0) {
        jokerIndicator.style.display = 'flex';
        jokerNumber.textContent = currentPlayer.jokers;
    } else {
        jokerIndicator.style.display = 'none';
    }

    if (currentPlayer.type === 'human') {
        // Afficher les cartes normales
        currentPlayer.hand.forEach(card => {
            const cardElement = createCardElement(card, true);

            // Vérifier si la carte peut être jouée sur au moins une pile (indices 0 à 8)
            const canPlay = [0, 1, 2, 3, 4, 5, 6, 7, 8].some(pileIndex => isValidMove(card, pileIndex));
            if (!canPlay) {
                cardElement.classList.add('disabled');
            }

            cardElement.onclick = () => handleCardClick(card, canPlay);
            handElement.appendChild(cardElement);
        });

        // Afficher les cartes joker
        for (let i = 0; i < currentPlayer.jokers; i++) {
            const jokerCard = createJokerCard();
            jokerCard.onclick = () => handleJokerClick();
            handElement.appendChild(jokerCard);
        }

        // Afficher le bouton "passer" si aucun coup n'est possible
        const validMoves = getValidMoves(currentPlayer);
        const hasJoker = currentPlayer.jokers > 0;
        passBtn.style.display = (validMoves.length === 0 && !hasJoker) ? 'block' : 'none';
    } else {
        // Pour l'IA, afficher des cartes cachées
        for (let i = 0; i < currentPlayer.hand.length; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.style.width = '90px';
            cardBack.style.height = '120px';
            handElement.appendChild(cardBack);
        }

        // Afficher les jokers de l'IA
        for (let i = 0; i < currentPlayer.jokers; i++) {
            const jokerCard = createJokerCard();
            handElement.appendChild(jokerCard);
        }

        passBtn.style.display = 'none';
    }
}

function updateDeckCount() {
    document.getElementById('deck-count').textContent = gameState.deck.length;
}

function createCardElement(card, selectable) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.color}`;

    cardElement.innerHTML = `
        <div class="card-number">${card.number}</div>
        <div class="card-color-name">${COLOR_NAMES[card.color]}</div>
    `;

    if (selectable && gameState.selectedCard &&
        gameState.selectedCard.color === card.color &&
        gameState.selectedCard.number === card.number) {
        cardElement.classList.add('selected');
    }

    return cardElement;
}

function createJokerCard() {
    const jokerCard = document.createElement('div');
    jokerCard.className = 'card joker';

    if (gameState.playingJoker) {
        jokerCard.classList.add('selected');
    }

    jokerCard.innerHTML = `
        <div class="card-number">?</div>
        <div class="card-color-name">JOKER</div>
    `;

    return jokerCard;
}

// ===============================
// GESTION DES ÉVÉNEMENTS
// ===============================

function handleCardClick(card, canPlay) {
    if (!canPlay) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;

    gameState.selectedCard = card;
    gameState.selectedPile = null;
    gameState.playingJoker = false;

    // Mettre à jour l'affichage pour montrer les piles valides
    updatePiles();
    updatePlayerHand();

    // Mettre en évidence les piles valides
    const piles = document.querySelectorAll('.pile');
    piles.forEach((pileElement, index) => {
        pileElement.classList.remove('valid-drop', 'invalid-drop');

        if (isValidMove(card, index)) {
            pileElement.classList.add('valid-drop');
        } else {
            pileElement.classList.add('invalid-drop');
        }
    });
}

function handleJokerClick() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;
    if (currentPlayer.jokers <= 0) return;

    gameState.playingJoker = true;
    gameState.selectedCard = null;
    gameState.selectedPile = null;

    // Mettre à jour l'affichage
    updatePlayerHand();

    // Toutes les piles sont valides pour un joker (sauf les piles pleines)
    const piles = document.querySelectorAll('.pile');
    piles.forEach((pileElement, index) => {
        pileElement.classList.remove('valid-drop', 'invalid-drop');

        if (gameState.piles[index].length < 9) {
            pileElement.classList.add('valid-drop');
        } else {
            pileElement.classList.add('invalid-drop');
        }
    });
}

function handlePileClick(pileIndex) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;

    // Jouer un joker
    if (gameState.playingJoker) {
        if (gameState.piles[pileIndex].length < 9) {
            playJoker(pileIndex);
        }
        return;
    }

    // Jouer une carte normale
    if (!gameState.selectedCard) return;

    if (isValidMove(gameState.selectedCard, pileIndex)) {
        playCard(gameState.selectedCard, pileIndex);
    }
}

// ===============================
// INITIALISATION
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    initMenu();

    // Événements des boutons
    document.getElementById('menu-btn').addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment retourner au menu ? La partie en cours sera perdue.')) {
            document.getElementById('game-screen').classList.remove('active');
            document.getElementById('menu-screen').classList.add('active');
        }
    });

    document.getElementById('rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.add('active');
    });

    document.getElementById('close-rules-btn').addEventListener('click', () => {
        document.getElementById('rules-modal').classList.remove('active');
    });

    document.getElementById('next-round-btn').addEventListener('click', nextRound);

    document.getElementById('new-game-btn').addEventListener('click', () => {
        document.getElementById('game-end-modal').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('menu-screen').classList.add('active');
    });

    document.getElementById('pass-turn-btn').addEventListener('click', passTurn);
});
