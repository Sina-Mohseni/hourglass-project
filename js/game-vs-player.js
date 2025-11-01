// ===== CHESS & CARDS - GAME VS PLAYER =====

// ===== CONSTANTES =====
const CARD_TYPES = {
    QUEEN: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
};

const SYMBOLS = {
    CROWN: 'crown',
    PAPER: 'paper',
    ROCK: 'rock',
    SCISSORS: 'scissors',
    NUMBER: 'number'
};

const PHASES = {
    COMBAT: 'combat',
    WINNER_CHOICE: 'winner_choice',
    LOSER_CHOICE: 'loser_choice',
    RESOLUTION: 'resolution'
};

const PIECE_ICONS = {
    white: {
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
    },
    black: {
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
    }
};

// ===== ÉTAT DU JEU =====
const gameState = {
    settings: {
        hp: 10,
        defenders: 2,
        tacticalVictory: 6,
        maxTurns: 10,
        player1Name: 'Joueur 1',
        player1Color: 'white',
        player2Name: 'Joueur 2',
        player2Color: 'black'
    },
    turn: 1,
    firstPlayer: 'player1', // 'player1' ou 'player2'
    currentPlayer: 'player1', // Le joueur actif
    phase: PHASES.COMBAT,
    player1: {
        hp: 10,
        hand: [],
        defense: [],
        graveyard: [],
        prison: []
    },
    player2: {
        hp: 10,
        hand: [],
        defense: [],
        graveyard: [],
        prison: []
    },
    combat: {
        player1Card: null,
        player2Card: null,
        winner: null,
        loser: null
    },
    tempWinningCard: null,
    currentAction: null,
    waitingForTurnChange: false
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadGameSettings();
    initializeGame();
    setupEventListeners();
});

function loadGameSettings() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('hp')) {
        gameState.settings.hp = parseInt(urlParams.get('hp'));
    }
    if (urlParams.has('defenders')) {
        gameState.settings.defenders = parseInt(urlParams.get('defenders'));
    }
    if (urlParams.has('tactical')) {
        gameState.settings.tacticalVictory = parseInt(urlParams.get('tactical'));
    }
    if (urlParams.has('turns')) {
        gameState.settings.maxTurns = parseInt(urlParams.get('turns'));
    }
    if (urlParams.has('player1Name')) {
        gameState.settings.player1Name = urlParams.get('player1Name');
    }
    if (urlParams.has('player1Color')) {
        gameState.settings.player1Color = urlParams.get('player1Color');
    }
    if (urlParams.has('player2Name')) {
        gameState.settings.player2Name = urlParams.get('player2Name');
    }
    if (urlParams.has('player2Color')) {
        gameState.settings.player2Color = urlParams.get('player2Color');
    }

    // Initialiser les HP
    gameState.player1.hp = gameState.settings.hp;
    gameState.player2.hp = gameState.settings.hp;
}

function initializeGame() {
    // Créer les decks
    createDecks();

    // Déterminer le premier joueur aléatoirement
    gameState.firstPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
    gameState.currentPlayer = gameState.firstPlayer;

    // Mettre à jour l'interface
    updatePlayerNames();
    updateUI();

    // Montrer le modal de début de partie
    showTurnChangeModal(gameState.currentPlayer, true);

    console.log('🎮 Jeu initialisé', gameState);
}

function updatePlayerNames() {
    document.getElementById('player1-name').textContent = gameState.settings.player1Name;
    document.getElementById('player2-name').textContent = gameState.settings.player2Name;
    document.getElementById('player1-name-def').textContent = gameState.settings.player1Name;
    document.getElementById('player2-name-def').textContent = gameState.settings.player2Name;
}

function createDecks() {
    gameState.player1.hand = createDeck(gameState.settings.player1Color);
    gameState.player2.hand = createDeck(gameState.settings.player2Color);

    shuffleDeck(gameState.player1.hand);
    shuffleDeck(gameState.player2.hand);
}

function createDeck(color) {
    const deck = [];

    // 8 Pions numérotés 1-8
    for (let i = 1; i <= 8; i++) {
        deck.push({
            id: `${color}-pawn-${i}`,
            type: CARD_TYPES.PAWN,
            number: i,
            color: color,
            name: `Pion ${i}`
        });
    }

    // 2 Cavaliers
    for (let i = 1; i <= 2; i++) {
        deck.push({
            id: `${color}-knight-${i}`,
            type: CARD_TYPES.KNIGHT,
            color: color,
            name: 'Cavalier'
        });
    }

    // 2 Tours
    for (let i = 1; i <= 2; i++) {
        deck.push({
            id: `${color}-rook-${i}`,
            type: CARD_TYPES.ROOK,
            color: color,
            name: 'Tour'
        });
    }

    // 2 Fous
    for (let i = 1; i <= 2; i++) {
        deck.push({
            id: `${color}-bishop-${i}`,
            type: CARD_TYPES.BISHOP,
            color: color,
            name: 'Fou'
        });
    }

    // 1 Reine
    deck.push({
        id: `${color}-queen`,
        type: CARD_TYPES.QUEEN,
        color: color,
        name: 'Reine'
    });

    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// ===== SYSTÈME DE CHANGEMENT DE TOUR =====
function showTurnChangeModal(player, isFirstTurn = false) {
    gameState.waitingForTurnChange = true;

    const modal = document.getElementById('turn-change-modal');
    const nextPlayerName = document.getElementById('next-player-name');
    const readyButton = document.getElementById('ready-button');

    const playerName = player === 'player1' ? gameState.settings.player1Name : gameState.settings.player2Name;
    nextPlayerName.textContent = playerName;

    modal.classList.remove('hidden');

    readyButton.onclick = () => {
        modal.classList.add('hidden');
        gameState.waitingForTurnChange = false;

        if (isFirstTurn) {
            updateMessage('Sélectionnez une carte pour attaquer');
            startCombatPhase();
        }
    };
}

// ===== SYSTÈME DE COMBAT =====
function getAttackSymbol(card) {
    if (card.type === CARD_TYPES.QUEEN) return SYMBOLS.CROWN;
    if (card.type === CARD_TYPES.ROOK) return SYMBOLS.PAPER;
    if (card.type === CARD_TYPES.BISHOP) return SYMBOLS.SCISSORS;
    if (card.type === CARD_TYPES.KNIGHT) return SYMBOLS.ROCK;
    if (card.type === CARD_TYPES.PAWN) {
        if (card.number === 1 || card.number === 2) return SYMBOLS.CROWN;
        return SYMBOLS.NUMBER;
    }
}

function getDefenseSymbol(card) {
    if (card.type === CARD_TYPES.QUEEN) return SYMBOLS.CROWN;
    if (card.type === CARD_TYPES.ROOK) return SYMBOLS.ROCK;
    if (card.type === CARD_TYPES.BISHOP) return SYMBOLS.SCISSORS;
    if (card.type === CARD_TYPES.KNIGHT) return SYMBOLS.PAPER;
    if (card.type === CARD_TYPES.PAWN) {
        if (card.number === 8 || card.number === 3) return SYMBOLS.ROCK;
        if (card.number === 7 || card.number === 4) return SYMBOLS.SCISSORS;
        if (card.number === 6 || card.number === 5) return SYMBOLS.PAPER;
        if (card.number === 2 || card.number === 1) return SYMBOLS.CROWN;
    }
}

function resolveCombat(card1, card2, isAttackVsAttack = true, firstPlayer = null) {
    const symbol1 = isAttackVsAttack ? getAttackSymbol(card1) : getAttackSymbol(card1);
    const symbol2 = isAttackVsAttack ? getAttackSymbol(card2) : getDefenseSymbol(card2);

    // Cas spéciaux pour Pions 1 & 2
    if (card1.type === CARD_TYPES.PAWN && (card1.number === 1 || card1.number === 2)) {
        if (card2.type === CARD_TYPES.QUEEN) {
            // Couronne vs Couronne = Égalité → Premier joueur gagne
            return firstPlayer === 'card1' ? 1 : -1;
        } else {
            if (card2.type === CARD_TYPES.PAWN) {
                return card1.number > card2.number ? 1 : (card1.number < card2.number ? -1 : 0);
            }
            return -1;
        }
    }

    if (card2.type === CARD_TYPES.PAWN && (card2.number === 1 || card2.number === 2)) {
        if (card1.type === CARD_TYPES.QUEEN) {
            // Couronne vs Couronne = Égalité → Premier joueur gagne
            return firstPlayer === 'card1' ? 1 : -1;
        } else {
            if (card1.type === CARD_TYPES.PAWN) {
                return card1.number > card2.number ? 1 : (card1.number < card2.number ? -1 : 0);
            }
            return 1;
        }
    }

    // Hiérarchie : Couronne > Papier/Pierre/Ciseaux > Chiffre
    if (symbol1 === SYMBOLS.CROWN && symbol2 !== SYMBOLS.CROWN) return 1;
    if (symbol2 === SYMBOLS.CROWN && symbol1 !== SYMBOLS.CROWN) return -1;

    // Couronne vs Couronne (Reine vs Reine) = Égalité → Premier joueur gagne
    if (symbol1 === SYMBOLS.CROWN && symbol2 === SYMBOLS.CROWN) {
        return firstPlayer === 'card1' ? 1 : -1;
    }

    // Pierre-Feuille-Ciseaux
    if ((symbol1 === SYMBOLS.PAPER || symbol1 === SYMBOLS.ROCK || symbol1 === SYMBOLS.SCISSORS) &&
        symbol2 === SYMBOLS.NUMBER) {
        return 1;
    }
    if ((symbol2 === SYMBOLS.PAPER || symbol2 === SYMBOLS.ROCK || symbol2 === SYMBOLS.SCISSORS) &&
        symbol1 === SYMBOLS.NUMBER) {
        return -1;
    }

    // Papier > Pierre
    if (symbol1 === SYMBOLS.PAPER && symbol2 === SYMBOLS.ROCK) return 1;
    if (symbol1 === SYMBOLS.ROCK && symbol2 === SYMBOLS.PAPER) return -1;

    // Pierre > Ciseaux
    if (symbol1 === SYMBOLS.ROCK && symbol2 === SYMBOLS.SCISSORS) return 1;
    if (symbol1 === SYMBOLS.SCISSORS && symbol2 === SYMBOLS.ROCK) return -1;

    // Ciseaux > Papier
    if (symbol1 === SYMBOLS.SCISSORS && symbol2 === SYMBOLS.PAPER) return 1;
    if (symbol1 === SYMBOLS.PAPER && symbol2 === SYMBOLS.SCISSORS) return -1;

    // Chiffres (Pions)
    if (symbol1 === SYMBOLS.NUMBER && symbol2 === SYMBOLS.NUMBER) {
        if (card1.number > card2.number) return 1;
        if (card1.number < card2.number) return -1;
    }

    // Égalité → Premier joueur gagne toujours
    return firstPlayer === 'card1' ? 1 : -1;
}

// ===== GESTION DES PHASES =====

function startCombatPhase() {
    gameState.phase = PHASES.COMBAT;
    gameState.combat = { player1Card: null, player2Card: null, winner: null, loser: null };
    gameState.currentAction = null;
    gameState.tempWinningCard = null;

    // Premier joueur à sélectionner sa carte
    gameState.currentPlayer = gameState.firstPlayer;

    const playerName = gameState.currentPlayer === 'player1' ?
        gameState.settings.player1Name : gameState.settings.player2Name;

    updateMessage(`${playerName}, sélectionnez une carte pour attaquer`);
    updateUI();
    enableCardSelection();
}

function onPlayerCardSelected(card, player) {
    if (gameState.waitingForTurnChange) return;

    // Vérifier que c'est bien le tour du joueur
    if (player !== gameState.currentPlayer) {
        updateMessage('Ce n\'est pas votre tour !');
        return;
    }

    // Enregistrer la carte du joueur actuel
    if (player === 'player1') {
        gameState.combat.player1Card = card;
        const index = gameState.player1.hand.findIndex(c => c.id === card.id);
        if (index !== -1) {
            gameState.player1.hand.splice(index, 1);
        }
    } else {
        gameState.combat.player2Card = card;
        const index = gameState.player2.hand.findIndex(c => c.id === card.id);
        if (index !== -1) {
            gameState.player2.hand.splice(index, 1);
        }
    }

    updateUI();

    // Si les deux joueurs ont joué, révéler les cartes
    if (gameState.combat.player1Card && gameState.combat.player2Card) {
        setTimeout(() => {
            revealCards();
        }, 500);
    } else {
        // Changer de joueur pour qu'il sélectionne sa carte
        gameState.currentPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';

        const nextPlayerName = gameState.currentPlayer === 'player1' ?
            gameState.settings.player1Name : gameState.settings.player2Name;

        setTimeout(() => {
            showTurnChangeModal(gameState.currentPlayer);
            updateMessage(`${nextPlayerName}, sélectionnez votre carte pour attaquer`);
        }, 500);
    }
}

function revealCards() {
    updateMessage('Révélation des cartes...');

    setTimeout(() => {
        resolveCombatPhase();
    }, 1500);
}

function resolveCombatPhase() {
    const firstPlayer = gameState.firstPlayer;
    const result = resolveCombat(
        gameState.combat.player1Card,
        gameState.combat.player2Card,
        true,
        firstPlayer === 'player1' ? 'card1' : 'card2'
    );

    if (result > 0) {
        gameState.combat.winner = 'player1';
        gameState.combat.loser = 'player2';
        updateMessage(`${gameState.settings.player1Name} a gagné le combat !`);
    } else {
        gameState.combat.winner = 'player2';
        gameState.combat.loser = 'player1';
        updateMessage(`${gameState.settings.player2Name} a gagné le combat !`);
    }

    // Changer le joueur actif au gagnant
    gameState.currentPlayer = gameState.combat.winner;

    setTimeout(() => {
        startWinnerChoicePhase();
    }, 2000);
}

function startWinnerChoicePhase() {
    gameState.phase = PHASES.WINNER_CHOICE;
    showPlayerWinnerChoices();
}

function showPlayerWinnerChoices() {
    const winnerName = gameState.combat.winner === 'player1' ?
        gameState.settings.player1Name : gameState.settings.player2Name;

    updateMessage(`${winnerName} a gagné ! Choisissez votre action :`);

    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = '';
    actionButtons.classList.remove('hidden');

    // Option A : Enlever 1 PV
    const optionA = document.createElement('button');
    optionA.className = 'action-button';
    optionA.innerHTML = '❤️ Enlever 1 PV à l\'adversaire';
    optionA.onclick = () => winnerChoiceA();
    actionButtons.appendChild(optionA);

    // Option B : Attaquer un défenseur
    const winnerCard = gameState.combat.winner === 'player1' ?
        gameState.combat.player1Card : gameState.combat.player2Card;
    const loserDefense = gameState.combat.loser === 'player1' ?
        gameState.player1.defense : gameState.player2.defense;

    const beatableDefenders = getBeadableDefenders(winnerCard, loserDefense);

    if (beatableDefenders.length > 0) {
        const optionB = document.createElement('button');
        optionB.className = 'action-button';
        optionB.innerHTML = '🛡️ Attaquer un défenseur (' + beatableDefenders.length + ')';
        optionB.onclick = () => winnerChoiceB();
        actionButtons.appendChild(optionB);
    }
}

function getBeadableDefenders(attackCard, defenders) {
    return defenders.filter(defender => {
        // Le premier joueur est celui qui attaque (card1)
        const result = resolveCombat(attackCard, defender, false, 'card1');
        return result >= 0; // Attaquant gagne ou égalité (premier joueur = attaquant gagne en égalité)
    });
}

function winnerChoiceA() {
    document.getElementById('action-buttons').classList.add('hidden');

    const loser = gameState.combat.loser;
    gameState[loser].hp--;
    updateUI();

    const loserName = loser === 'player1' ? gameState.settings.player1Name : gameState.settings.player2Name;
    updateMessage(`${loserName} perd 1 PV !`);

    setTimeout(() => {
        gameState.currentPlayer = gameState.combat.loser;
        startLoserChoicePhase();
    }, 1500);
}

function winnerChoiceB() {
    document.getElementById('action-buttons').classList.add('hidden');

    const winnerCard = gameState.combat.winner === 'player1' ?
        gameState.combat.player1Card : gameState.combat.player2Card;
    const loserDefense = gameState.combat.loser === 'player1' ?
        gameState.player1.defense : gameState.player2.defense;

    const beatableDefenders = getBeadableDefenders(winnerCard, loserDefense);

    if (beatableDefenders.length === 0) {
        updateMessage('Aucun défenseur ne peut être battu !');
        return;
    }

    updateMessage('Sélectionnez un défenseur à attaquer');
    highlightTargetableDefenders(gameState.combat.loser, beatableDefenders);
}

function onDefenderTargeted(owner, defenderIndex) {
    const defender = gameState[owner].defense[defenderIndex];

    gameState[owner].defense.splice(defenderIndex, 1);

    if (gameState.combat.winner === 'player1') {
        gameState.player1.prison.push(defender);
        gameState.player2.graveyard.push(gameState.combat.player2Card);
    } else {
        gameState.player2.prison.push(defender);
        gameState.player1.graveyard.push(gameState.combat.player1Card);
    }

    updateUI();
    updateMessage('Défenseur battu ! Carte envoyée en prison.');

    removeDefenderHighlights();

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function startLoserChoicePhase() {
    gameState.phase = PHASES.LOSER_CHOICE;
    showPlayerLoserChoices();
}

function showPlayerLoserChoices() {
    const loserName = gameState.combat.loser === 'player1' ?
        gameState.settings.player1Name : gameState.settings.player2Name;

    updateMessage(`${loserName} a perdu le combat. Choisissez votre action :`);

    const actionButtons = document.getElementById('action-buttons');
    actionButtons.innerHTML = '';
    actionButtons.classList.remove('hidden');

    // Option A : Accepter
    const optionA = document.createElement('button');
    optionA.className = 'action-button';
    optionA.innerHTML = '✓ Accepter (-1 carte / -1 PV)';
    optionA.onclick = () => loserChoiceA();
    actionButtons.appendChild(optionA);

    // Option B : Remplacer un défenseur
    const loserDefense = gameState.combat.loser === 'player1' ?
        gameState.player1.defense : gameState.player2.defense;

    if (loserDefense.length > 0) {
        const optionB = document.createElement('button');
        optionB.className = 'action-button';
        optionB.innerHTML = '🔄 Remplacer un défenseur (-1 carte / -1 PV)';
        optionB.onclick = () => loserChoiceB();
        actionButtons.appendChild(optionB);
    }

    // Option C : Sacrifier un défenseur
    if (loserDefense.length > 0) {
        const optionC = document.createElement('button');
        optionC.className = 'action-button secondary';
        optionC.innerHTML = '⚔️ Sacrifier un défenseur (-2 cartes / 0 PV)';
        optionC.onclick = () => loserChoiceC();
        actionButtons.appendChild(optionC);
    }
}

function loserChoiceA() {
    document.getElementById('action-buttons').classList.add('hidden');

    if (gameState.combat.loser === 'player1') {
        gameState.player1.graveyard.push(gameState.combat.player1Card);
    } else {
        gameState.player2.graveyard.push(gameState.combat.player2Card);
    }

    updateUI();
    updateMessage('Carte envoyée à la défausse. -1 PV déjà appliqué.');

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function loserChoiceB() {
    document.getElementById('action-buttons').classList.add('hidden');
    gameState.currentAction = 'replace_loser';
    updateMessage('Sélectionnez un défenseur à remplacer');
    highlightAllDefenders(gameState.combat.loser);
}

function onDefenderReplaced(defenderIndex) {
    const loser = gameState.combat.loser;
    const losingCard = loser === 'player1' ? gameState.combat.player1Card : gameState.combat.player2Card;

    const replacedDefender = gameState[loser].defense[defenderIndex];
    gameState[loser].graveyard.push(replacedDefender);

    gameState[loser].defense[defenderIndex] = losingCard;

    gameState.currentAction = null;

    updateUI();
    updateMessage('Défenseur remplacé !');

    removeDefenderHighlights();

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function loserChoiceC() {
    document.getElementById('action-buttons').classList.add('hidden');
    gameState.currentAction = 'sacrifice';
    updateMessage('Sélectionnez un défenseur à sacrifier');
    highlightAllDefenders(gameState.combat.loser);
}

function onDefenderSacrificed(defenderIndex) {
    const loser = gameState.combat.loser;
    const losingCard = loser === 'player1' ? gameState.combat.player1Card : gameState.combat.player2Card;

    gameState[loser].graveyard.push(losingCard);

    const sacrificedDefender = gameState[loser].defense.splice(defenderIndex, 1)[0];
    gameState[loser].graveyard.push(sacrificedDefender);

    gameState[loser].hp++;

    gameState.currentAction = null;

    updateUI();
    updateMessage('Défenseur sacrifié ! Pas de perte de PV.');

    removeDefenderHighlights();

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function startResolutionPhase() {
    gameState.phase = PHASES.RESOLUTION;
    document.getElementById('action-buttons').classList.add('hidden');

    updateMessage('Résolution...');

    const winner = gameState.combat.winner;
    const winningCard = winner === 'player1' ? gameState.combat.player1Card : gameState.combat.player2Card;

    // Changer le joueur actif au gagnant pour la résolution
    gameState.currentPlayer = winner;

    if (gameState[winner].defense.length >= gameState.settings.defenders) {
        showDefenderReplacementChoice(winningCard, winner);
    } else {
        gameState[winner].defense.push(winningCard);
        updateUI();

        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

function showDefenderReplacementChoice(newCard, winner) {
    gameState.tempWinningCard = newCard;

    const winnerName = winner === 'player1' ? gameState.settings.player1Name : gameState.settings.player2Name;
    updateMessage(`${winnerName}, votre défense est pleine. Choisissez un défenseur à remplacer :`);
    highlightAllDefenders(winner);
}

function replaceDefenderWithWinningCard(defenderIndex, owner) {
    const newCard = gameState.tempWinningCard;

    const replacedDefender = gameState[owner].defense[defenderIndex];
    gameState[owner].hand.push(replacedDefender);

    gameState[owner].defense[defenderIndex] = newCard;

    gameState.tempWinningCard = null;

    updateUI();
    removeDefenderHighlights();

    setTimeout(() => {
        endTurn();
    }, 1000);
}

function endTurn() {
    gameState.firstPlayer = gameState.firstPlayer === 'player1' ? 'player2' : 'player1';

    const victoryCheck = checkVictoryConditions();
    if (victoryCheck) {
        endGame(victoryCheck);
        return;
    }

    gameState.turn++;
    updateUI();

    setTimeout(() => {
        startCombatPhase();
    }, 500);
}

// ===== CONDITIONS DE VICTOIRE =====

function checkVictoryConditions() {
    // Victoire HP
    if (gameState.player1.hp <= 0) {
        return { winner: 'player2', reason: 'HP à 0', type: 'hp' };
    }
    if (gameState.player2.hp <= 0) {
        return { winner: 'player1', reason: 'HP à 0', type: 'hp' };
    }

    // Victoire Cartes
    if (gameState.player1.hand.length === 0) {
        return { winner: 'player2', reason: 'Plus de cartes en main', type: 'cards' };
    }
    if (gameState.player2.hand.length === 0) {
        return { winner: 'player1', reason: 'Plus de cartes en main', type: 'cards' };
    }

    // Victoire Tactique
    if (gameState.player1.prison.length >= gameState.settings.tacticalVictory) {
        return { winner: 'player1', reason: 'Victoire tactique', type: 'tactical' };
    }
    if (gameState.player2.prison.length >= gameState.settings.tacticalVictory) {
        return { winner: 'player2', reason: 'Victoire tactique', type: 'tactical' };
    }

    // Fin de partie par tours max
    if (gameState.turn > gameState.settings.maxTurns) {
        if (gameState.player1.hp > gameState.player2.hp) {
            return { winner: 'player1', reason: 'Plus de HP à la fin', type: 'turns' };
        } else if (gameState.player2.hp > gameState.player1.hp) {
            return { winner: 'player2', reason: 'Plus de HP à la fin', type: 'turns' };
        } else {
            if (gameState.player1.graveyard.length < gameState.player2.graveyard.length) {
                return { winner: 'player1', reason: 'Moins de cartes en défausse', type: 'turns' };
            } else if (gameState.player2.graveyard.length < gameState.player1.graveyard.length) {
                return { winner: 'player2', reason: 'Moins de cartes en défausse', type: 'turns' };
            } else {
                return { winner: 'draw', reason: 'Égalité parfaite', type: 'draw' };
            }
        }
    }

    return null;
}

function endGame(victoryData) {
    console.log('🏆 Fin de partie', victoryData);

    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('game-over-title');
    const icon = document.getElementById('victory-icon');
    const message = document.getElementById('victory-message');
    const stats = document.getElementById('final-stats');

    const winner1Name = gameState.settings.player1Name;
    const winner2Name = gameState.settings.player2Name;

    if (victoryData.winner === 'player1') {
        title.textContent = `VICTOIRE DE ${winner1Name.toUpperCase()} !`;
        icon.textContent = '🏆';
        message.textContent = `${winner1Name} a gagné par ${victoryData.reason} !`;
    } else if (victoryData.winner === 'player2') {
        title.textContent = `VICTOIRE DE ${winner2Name.toUpperCase()} !`;
        icon.textContent = '🏆';
        message.textContent = `${winner2Name} a gagné par ${victoryData.reason} !`;
    } else {
        title.textContent = 'ÉGALITÉ';
        icon.textContent = '🤝';
        message.textContent = victoryData.reason;
    }

    stats.innerHTML = `
        <h3>Statistiques finales</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
                <h4>${winner1Name}</h4>
                <p>❤️ HP: ${gameState.player1.hp}</p>
                <p>🖐️ Cartes: ${gameState.player1.hand.length}</p>
                <p>💀 Défausse: ${gameState.player1.graveyard.length}</p>
                <p>🏆 Prison: ${gameState.player1.prison.length}</p>
            </div>
            <div>
                <h4>${winner2Name}</h4>
                <p>❤️ HP: ${gameState.player2.hp}</p>
                <p>🖐️ Cartes: ${gameState.player2.hand.length}</p>
                <p>💀 Défausse: ${gameState.player2.graveyard.length}</p>
                <p>🏆 Prison: ${gameState.player2.prison.length}</p>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// ===== INTERFACE UTILISATEUR =====

function updateUI() {
    // Mettre à jour les statistiques
    document.getElementById('player1-hp').textContent = gameState.player1.hp;
    document.getElementById('player1-cards').textContent = gameState.player1.hand.length;
    document.getElementById('player1-graveyard').textContent = gameState.player1.graveyard.length;
    document.getElementById('player1-prison').textContent = gameState.player1.prison.length;

    document.getElementById('player2-hp').textContent = gameState.player2.hp;
    document.getElementById('player2-cards').textContent = gameState.player2.hand.length;
    document.getElementById('player2-graveyard').textContent = gameState.player2.graveyard.length;
    document.getElementById('player2-prison').textContent = gameState.player2.prison.length;

    // Mettre à jour le tour
    document.getElementById('turn-number').textContent = gameState.turn;

    // Mettre à jour le premier joueur
    const player1FirstPlayer = document.getElementById('player1-first-player');
    const player2FirstPlayer = document.getElementById('player2-first-player');

    if (gameState.firstPlayer === 'player1') {
        player1FirstPlayer.classList.add('active');
        player2FirstPlayer.classList.remove('active');
    } else {
        player2FirstPlayer.classList.add('active');
        player1FirstPlayer.classList.remove('active');
    }

    // Mettre à jour les mains
    renderHand('player1');
    renderHand('player2');

    // Mettre à jour les défenses
    renderDefense('player1');
    renderDefense('player2');

    // Mettre à jour la zone de combat
    renderCombatZone();
}

function renderHand(owner) {
    const handElement = document.getElementById(`${owner}-hand`);
    handElement.innerHTML = '';

    const hand = gameState[owner].hand;

    if (hand.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-hand-message';
        emptyMessage.style.cssText = 'text-align: center; opacity: 0.6; padding: 20px;';
        emptyMessage.textContent = 'Main vide';
        handElement.appendChild(emptyMessage);
        return;
    }

    // Déterminer si on doit cacher les cartes (quand ce n'est pas le tour de ce joueur en phase combat)
    const shouldHideCards = gameState.phase === PHASES.COMBAT &&
                           gameState.currentPlayer !== owner &&
                           !gameState.waitingForTurnChange;

    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, shouldHideCards);

        if (!shouldHideCards && gameState.phase === PHASES.COMBAT && gameState.currentPlayer === owner) {
            let touchHandled = false;

            // Gestion tactile (mobile)
            cardElement.addEventListener('touchstart', (e) => {
                touchHandled = true;
            });

            cardElement.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showCardActionModal(card, owner);
                // Reset après un délai pour permettre les futurs clics
                setTimeout(() => { touchHandled = false; }, 300);
            });

            // Gestion clic (desktop uniquement)
            cardElement.onclick = (e) => {
                if (!touchHandled) {
                    e.preventDefault();
                    showCardActionModal(card, owner);
                }
            };
        }

        handElement.appendChild(cardElement);
    });
}

function renderDefense(owner) {
    const defenseElement = document.getElementById(`${owner}-defense`);
    defenseElement.innerHTML = '';

    const maxDefenders = gameState.settings.defenders;

    for (let i = 0; i < maxDefenders; i++) {
        const slot = document.createElement('div');
        slot.className = 'defense-slot';
        slot.dataset.owner = owner;
        slot.dataset.index = i;

        if (i < gameState[owner].defense.length) {
            const card = gameState[owner].defense[i];
            const cardElement = createCardElement(card, false, true); // isDefense = true
            cardElement.style.margin = '0';
            slot.appendChild(cardElement);
            slot.classList.add('occupied');
        } else {
            const emptyText = document.createElement('div');
            emptyText.className = 'defense-slot-empty';
            emptyText.textContent = 'Vide';
            slot.appendChild(emptyText);
        }

        defenseElement.appendChild(slot);
    }
}

function renderCombatZone() {
    const player1CombatSlot = document.getElementById('player1-combat-card');
    const player2CombatSlot = document.getElementById('player2-combat-card');

    player1CombatSlot.innerHTML = '';
    player2CombatSlot.innerHTML = '';

    if (gameState.combat.player1Card) {
        const cardElement = createCardElement(gameState.combat.player1Card, false);
        player1CombatSlot.appendChild(cardElement);
        player1CombatSlot.classList.add('filled');
    } else {
        player1CombatSlot.innerHTML = '<span class="placeholder-text">?</span>';
        player1CombatSlot.classList.remove('filled');
    }

    if (gameState.combat.player2Card) {
        const cardElement = createCardElement(gameState.combat.player2Card, false);
        player2CombatSlot.appendChild(cardElement);
        player2CombatSlot.classList.add('filled');
    } else {
        player2CombatSlot.innerHTML = '<span class="placeholder-text">?</span>';
        player2CombatSlot.classList.remove('filled');
    }
}

function getCurrentPowerDisplay(symbol, card, isDefense) {
    if (card.type === CARD_TYPES.PAWN && (card.number === 1 || card.number === 2)) {
        if (isDefense) {
            return '👑';
        } else {
            return `${card.number} <span class="crown-r">👑<span class="r-letter">R</span></span>`;
        }
    }

    if (symbol === SYMBOLS.CROWN) {
        return '👑';
    } else if (symbol === SYMBOLS.PAPER) {
        return '📄';
    } else if (symbol === SYMBOLS.ROCK) {
        return '🪨';
    } else if (symbol === SYMBOLS.SCISSORS) {
        return '✂️';
    } else if (symbol === SYMBOLS.NUMBER) {
        return `${card.number}`;
    }

    return '';
}

function createCardElement(card, hidden = false, isDefense = false) {
    const div = document.createElement('div');
    div.className = `card ${card.color}`;
    div.dataset.cardId = card.id;

    if (hidden) {
        div.classList.add('hidden');
        div.innerHTML = `
            <div class="card-inner">
                <div class="card-body">
                    <div class="card-piece">?</div>
                </div>
            </div>
        `;
        return div;
    }

    const icon = PIECE_ICONS[card.color][card.type];

    const currentSymbol = isDefense ? getDefenseSymbol(card) : getAttackSymbol(card);
    const powerDisplay = getCurrentPowerDisplay(currentSymbol, card, isDefense);

    const headerHTML = `
        <div class="card-header">
            <div class="current-power">${powerDisplay}</div>
            ${card.type === CARD_TYPES.PAWN ? `<div class="card-number">${card.number}</div>` : '<div></div>'}
        </div>
    `;

    const bodyHTML = `
        <div class="card-body">
            <div class="card-piece">${icon}</div>
            <div class="card-name">${card.name}</div>
        </div>
    `;

    div.innerHTML = `<div class="card-inner">${headerHTML}${bodyHTML}</div>`;

    // Ajouter les événements de tooltip (desktop uniquement)
    div.addEventListener('mouseenter', (e) => showCardTooltip(card, e));
    div.addEventListener('mouseleave', hideCardTooltip);

    return div;
}

function getPowerData(symbol, card) {
    let icon = '';
    let value = '';

    if (symbol === SYMBOLS.CROWN) {
        icon = '👑';
        if (card.type === CARD_TYPES.PAWN && (card.number === 1 || card.number === 2)) {
            value = `${card.number} <span class="crown-r">👑<span class="r-letter">R</span></span>`;
        } else {
            value = '';
        }
    } else if (symbol === SYMBOLS.PAPER) {
        icon = '📄';
        value = '';
    } else if (symbol === SYMBOLS.ROCK) {
        icon = '🪨';
        value = '';
    } else if (symbol === SYMBOLS.SCISSORS) {
        icon = '✂️';
        value = '';
    } else if (symbol === SYMBOLS.NUMBER) {
        icon = '#';
        value = card.number;
    }

    return { icon, value };
}

function updateMessage(text) {
    const messageElement = document.getElementById('game-message');
    messageElement.textContent = text;
    messageElement.style.animation = 'none';
    setTimeout(() => {
        messageElement.style.animation = 'fadeIn 0.5s ease-out';
    }, 10);
}

function enableCardSelection() {
    // Déjà géré dans renderHand
}

function highlightTargetableDefenders(owner, defenders) {
    const defenseElement = document.getElementById(`${owner}-defense`);
    const defenseSlots = defenseElement.querySelectorAll('.defense-slot');

    defenders.forEach(defender => {
        const index = gameState[owner].defense.indexOf(defender);
        if (index !== -1 && defenseSlots[index]) {
            defenseSlots[index].classList.add('targetable');
            defenseSlots[index].onclick = () => onDefenderTargeted(owner, index);
        }
    });
}

function highlightAllDefenders(owner) {
    const defenseElement = document.getElementById(`${owner}-defense`);
    const slots = defenseElement.querySelectorAll('.defense-slot');

    slots.forEach((slot, slotIndex) => {
        if (!slot.classList.contains('occupied')) return;

        const actualIndex = parseInt(slot.dataset.index);

        slot.classList.add('targetable');
        slot.onclick = () => {
            if (gameState.phase === PHASES.LOSER_CHOICE) {
                if (gameState.currentAction === 'replace_loser') {
                    onDefenderReplaced(actualIndex);
                } else if (gameState.currentAction === 'sacrifice') {
                    onDefenderSacrificed(actualIndex);
                }
            } else if (gameState.phase === PHASES.RESOLUTION) {
                replaceDefenderWithWinningCard(actualIndex, owner);
            }
        };
    });
}

function removeDefenderHighlights() {
    const allSlots = document.querySelectorAll('.defense-slot');
    allSlots.forEach(slot => {
        slot.classList.remove('targetable');
        slot.onclick = null;
    });
}

// ===== MODAL D'ACTION DE CARTE (MOBILE) =====

function showCardActionModal(card, owner) {
    // Supprimer l'ancien modal s'il existe
    const oldModal = document.getElementById('card-action-modal');
    if (oldModal) {
        oldModal.remove();
    }

    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'card-action-modal';
    modal.style.display = 'flex';

    const attackSymbol = getAttackSymbol(card);
    const defenseSymbol = getDefenseSymbol(card);
    const attackData = getPowerData(attackSymbol, card);
    const defenseData = getPowerData(defenseSymbol, card);

    modal.innerHTML = `
        <div class="modal-content card-action-modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Sélectionner une action</h2>
            </div>
            <div class="modal-body">
                <div class="card-action-preview">
                    ${createCardElement(card, false).outerHTML}
                </div>
                <div class="card-action-info">
                    <h3>${card.name}</h3>
                    <p class="card-type-info">${getCardTypeName(card.type)} ${card.color === 'white' ? 'Blanc' : 'Noir'}</p>
                    <div class="card-powers-info">
                        <div class="power-info-item">
                            <span class="power-info-label">⚔️ Attaque:</span>
                            <span class="power-info-value">${attackData.icon} ${attackData.value || ''}</span>
                        </div>
                        <div class="power-info-item">
                            <span class="power-info-label">🛡️ Défense:</span>
                            <span class="power-info-value">${defenseData.icon} ${defenseData.value || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-button primary-button" id="attack-card-button">
                    ⚔️ Attaquer
                </button>
                <button class="modal-button secondary-button" id="cancel-card-button">
                    ✖️ Annuler
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Événements des boutons
    document.getElementById('attack-card-button').addEventListener('click', () => {
        modal.remove();
        onPlayerCardSelected(card, owner);
    });

    document.getElementById('cancel-card-button').addEventListener('click', () => {
        modal.remove();
    });

    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ===== TOOLTIPS DE CARTES =====

let currentTooltip = null;
let tooltipTimeout = null;

function showCardTooltip(card, event) {
    hideCardTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'card-tooltip';
    tooltip.id = 'card-tooltip';

    const attackSymbol = getAttackSymbol(card);
    const defenseSymbol = getDefenseSymbol(card);
    const attackData = getPowerData(attackSymbol, card);
    const defenseData = getPowerData(defenseSymbol, card);

    let description = getCardDescription(card, attackSymbol, defenseSymbol);

    tooltip.innerHTML = `
        <div class="tooltip-card-preview">
            ${createCardElement(card, false).outerHTML}
            <div class="tooltip-card-info">
                <div class="tooltip-card-title">${card.name}</div>
                <div class="tooltip-card-type">${getCardTypeName(card.type)} ${card.color === 'white' ? 'Blanc' : 'Noir'}</div>
            </div>
        </div>
        <div class="tooltip-powers">
            <div class="tooltip-power-item">
                <div class="tooltip-power-label">Attaque</div>
                <div class="tooltip-power-value attack-power">${attackData.icon} ${attackData.value}</div>
            </div>
            <div class="tooltip-power-item">
                <div class="tooltip-power-label">Défense</div>
                <div class="tooltip-power-value defense-power">${defenseData.icon} ${defenseData.value}</div>
            </div>
        </div>
        <div class="tooltip-description">${description}</div>
    `;

    document.body.appendChild(tooltip);
    currentTooltip = tooltip;

    positionTooltip(tooltip, event);
}

function hideCardTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }

    if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
    }
}

function positionTooltip(tooltip, event) {
    const mouseX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const mouseY = event.clientY || (event.touches && event.touches[0].clientY) || 0;

    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX + 15;
    let top = mouseY + 15;

    if (left + tooltipRect.width > viewportWidth) {
        left = mouseX - tooltipRect.width - 15;
    }

    if (top + tooltipRect.height > viewportHeight) {
        top = mouseY - tooltipRect.height - 15;
    }

    left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function getCardTypeName(type) {
    const typeNames = {
        queen: 'Reine',
        rook: 'Tour',
        bishop: 'Fou',
        knight: 'Cavalier',
        pawn: 'Pion'
    };
    return typeNames[type] || type;
}

function getCardDescription(card, attackSymbol, defenseSymbol) {
    let desc = '<strong>En Attaque:</strong> ';

    if (attackSymbol === SYMBOLS.CROWN) {
        desc += 'Couronne - Bat toutes les pièces';
        if (card.type === CARD_TYPES.PAWN && (card.number === 1 || card.number === 2)) {
            desc += ' (sauf contre pièces majeures où compte comme chiffre)';
        }
    } else if (attackSymbol === SYMBOLS.PAPER) {
        desc += 'Papier - Bat Pierre';
    } else if (attackSymbol === SYMBOLS.ROCK) {
        desc += 'Pierre - Bat Ciseaux';
    } else if (attackSymbol === SYMBOLS.SCISSORS) {
        desc += 'Ciseaux - Bat Papier';
    } else if (attackSymbol === SYMBOLS.NUMBER) {
        desc += `Chiffre ${card.number} - Plus le chiffre est élevé, plus fort`;
    }

    desc += '<br><br><strong>En Défense:</strong> ';

    if (defenseSymbol === SYMBOLS.CROWN) {
        desc += 'Couronne - Bloque tout sauf Reine attaquante';
    } else if (defenseSymbol === SYMBOLS.PAPER) {
        desc += 'Papier - Bloque Pierre';
    } else if (defenseSymbol === SYMBOLS.ROCK) {
        desc += 'Pierre - Bloque Ciseaux';
    } else if (defenseSymbol === SYMBOLS.SCISSORS) {
        desc += 'Ciseaux - Bloque Papier';
    }

    return desc;
}

// ===== MODAL DE DÉFAUSSE =====

function makeGraveyardStatsClickable() {
    document.getElementById('player1-graveyard').parentElement.classList.add('clickable');
    document.getElementById('player1-graveyard').parentElement.addEventListener('click', () => {
        showGraveyardModal('player1');
    });

    document.getElementById('player1-prison').parentElement.classList.add('clickable');
    document.getElementById('player1-prison').parentElement.addEventListener('click', () => {
        showGraveyardModal('player1', true);
    });

    document.getElementById('player2-graveyard').parentElement.classList.add('clickable');
    document.getElementById('player2-graveyard').parentElement.addEventListener('click', () => {
        showGraveyardModal('player2');
    });

    document.getElementById('player2-prison').parentElement.classList.add('clickable');
    document.getElementById('player2-prison').parentElement.addEventListener('click', () => {
        showGraveyardModal('player2', true);
    });
}

function showGraveyardModal(owner, prisonOnly = false) {
    const modal = document.createElement('div');
    modal.className = 'graveyard-modal';
    modal.id = 'graveyard-modal-temp';

    const ownerName = owner === 'player1' ? gameState.settings.player1Name : gameState.settings.player2Name;

    let modalHTML = `
        <div class="graveyard-modal-content">
            <div class="graveyard-modal-header">
                <h2 class="graveyard-modal-title">
                    ${prisonOnly ? '🏆' : '💀'} Défausse de ${ownerName}
                </h2>
                <button class="close-modal" id="close-graveyard">×</button>
            </div>
            <div class="graveyard-modal-body">
    `;

    if (!prisonOnly) {
        modalHTML += `
            <div class="graveyard-section">
                <h3 class="graveyard-section-title">
                    💀 Cimetière <span class="count-badge">${gameState[owner].graveyard.length}</span>
                </h3>
                <div class="graveyard-cards-grid" id="graveyard-cemetery">
        `;

        if (gameState[owner].graveyard.length === 0) {
            modalHTML += '<div class="graveyard-empty">Aucune carte</div>';
        } else {
            gameState[owner].graveyard.forEach(card => {
                modalHTML += createCardElement(card, false).outerHTML;
            });
        }

        modalHTML += '</div></div>';
    }

    modalHTML += `
        <div class="graveyard-section">
            <h3 class="graveyard-section-title">
                🏆 Prison (Victoire Tactique) <span class="count-badge">${gameState[owner].prison.length} / ${gameState.settings.tacticalVictory}</span>
            </h3>
            <div class="graveyard-cards-grid" id="graveyard-prison">
    `;

    if (gameState[owner].prison.length === 0) {
        modalHTML += '<div class="graveyard-empty">Aucun défenseur battu</div>';
    } else {
        gameState[owner].prison.forEach(card => {
            modalHTML += createCardElement(card, false).outerHTML;
        });
    }

    modalHTML += '</div></div></div></div>';

    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);

    document.getElementById('close-graveyard').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    document.getElementById('back-to-menu').addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment quitter la partie en cours ?')) {
            window.location.href = 'chess-cards.html';
        }
    });

    document.getElementById('help-button').addEventListener('click', () => {
        document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('close-help').addEventListener('click', () => {
        document.getElementById('help-modal').classList.add('hidden');
    });

    document.getElementById('new-game-button').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('menu-button').addEventListener('click', () => {
        window.location.href = 'chess-cards.html';
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && modal.id !== 'turn-change-modal') {
                modal.classList.add('hidden');
            }
        });
    });

    makeGraveyardStatsClickable();
}

console.log('♔ Chess & Cards - Game VS Player loaded ♛');
