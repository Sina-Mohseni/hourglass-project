// ===== CHESS & CARDS - GAME VS AI =====

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
        difficulty: 'easy',
        playerColor: 'white',
        aiColor: 'black'
    },
    turn: 1,
    firstPlayer: 'player', // 'player' ou 'ai'
    phase: PHASES.COMBAT,
    player: {
        hp: 10,
        hand: [],
        defense: [],
        graveyard: [],
        prison: []
    },
    ai: {
        hp: 10,
        hand: [],
        defense: [],
        graveyard: [],
        prison: []
    },
    combat: {
        playerCard: null,
        aiCard: null,
        winner: null,
        loser: null
    },
    tempWinningCard: null, // Pour stocker la carte gagnante temporairement
    currentAction: null // Pour stocker l'action en cours (replace, sacrifice, etc.)
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadGameSettings();
    initializeGame();
    setupEventListeners();
});

function loadGameSettings() {
    // Récupérer les paramètres depuis localStorage ou URL
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
    if (urlParams.has('difficulty')) {
        gameState.settings.difficulty = urlParams.get('difficulty');
    }
    if (urlParams.has('color')) {
        gameState.settings.playerColor = urlParams.get('color');
        gameState.settings.aiColor = urlParams.get('color') === 'white' ? 'black' : 'white';
    }

    // Initialiser les HP
    gameState.player.hp = gameState.settings.hp;
    gameState.ai.hp = gameState.settings.hp;
}

function initializeGame() {
    // Créer les decks
    createDecks();

    // Déterminer le premier joueur aléatoirement
    gameState.firstPlayer = Math.random() < 0.5 ? 'player' : 'ai';

    // Mettre à jour l'interface
    updateUI();
    updateMessage('Sélectionnez une carte pour attaquer');

    console.log('🎮 Jeu initialisé', gameState);
}

function createDecks() {
    // Créer le deck du joueur
    gameState.player.hand = createDeck(gameState.settings.playerColor);

    // Créer le deck de l'IA
    gameState.ai.hand = createDeck(gameState.settings.aiColor);

    // Mélanger les decks
    shuffleDeck(gameState.player.hand);
    shuffleDeck(gameState.ai.hand);
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

// ===== SYSTÈME DE COMBAT =====

function getAttackSymbol(card) {
    if (card.type === CARD_TYPES.QUEEN) {
        return SYMBOLS.CROWN;
    }
    if (card.type === CARD_TYPES.ROOK) {
        return SYMBOLS.PAPER;
    }
    if (card.type === CARD_TYPES.BISHOP) {
        return SYMBOLS.SCISSORS;
    }
    if (card.type === CARD_TYPES.KNIGHT) {
        return SYMBOLS.ROCK;
    }
    if (card.type === CARD_TYPES.PAWN) {
        if (card.number === 1 || card.number === 2) {
            return SYMBOLS.CROWN; // Couronne Reine pour pions 1 & 2
        }
        return SYMBOLS.NUMBER;
    }
}

function getDefenseSymbol(card) {
    if (card.type === CARD_TYPES.QUEEN) {
        return SYMBOLS.CROWN;
    }
    if (card.type === CARD_TYPES.ROOK) {
        return SYMBOLS.ROCK; // Changement
    }
    if (card.type === CARD_TYPES.BISHOP) {
        return SYMBOLS.SCISSORS;
    }
    if (card.type === CARD_TYPES.KNIGHT) {
        return SYMBOLS.PAPER; // Changement
    }
    if (card.type === CARD_TYPES.PAWN) {
        if (card.number === 8 || card.number === 3) {
            return SYMBOLS.ROCK;
        }
        if (card.number === 7 || card.number === 4) {
            return SYMBOLS.SCISSORS;
        }
        if (card.number === 6 || card.number === 5) {
            return SYMBOLS.PAPER;
        }
        if (card.number === 2 || card.number === 1) {
            return SYMBOLS.CROWN;
        }
    }
}

function resolveCombat(card1, card2, isAttackVsAttack = true, firstPlayer = null) {
    const symbol1 = isAttackVsAttack ? getAttackSymbol(card1) : getAttackSymbol(card1);
    const symbol2 = isAttackVsAttack ? getAttackSymbol(card2) : getDefenseSymbol(card2);

    // Cas spéciaux pour Pions 1 & 2
    if (card1.type === CARD_TYPES.PAWN && (card1.number === 1 || card1.number === 2)) {
        if (card2.type === CARD_TYPES.QUEEN) {
            // Couronne vs Couronne = Égalité
            if (isAttackVsAttack) {
                return firstPlayer === 'card1' ? 1 : -1;
            } else {
                // Attaquant vs Défenseur : Attaquant gagne en égalité
                return 1;
            }
        } else {
            // Contre autres pièces, pions 1&2 sont considérés comme chiffres faibles
            if (card2.type === CARD_TYPES.PAWN) {
                return card1.number > card2.number ? 1 : (card1.number < card2.number ? -1 : 0);
            }
            return -1; // Pions 1&2 perdent contre pièces majeures
        }
    }

    if (card2.type === CARD_TYPES.PAWN && (card2.number === 1 || card2.number === 2)) {
        if (card1.type === CARD_TYPES.QUEEN) {
            // Couronne vs Couronne = Égalité
            if (isAttackVsAttack) {
                return firstPlayer === 'card1' ? 1 : -1;
            } else {
                return 1; // Attaquant gagne
            }
        } else {
            if (card1.type === CARD_TYPES.PAWN) {
                return card1.number > card2.number ? 1 : (card1.number < card2.number ? -1 : 0);
            }
            return 1; // Pièces majeures battent pions 1&2
        }
    }

    // Hiérarchie : Couronne > Papier/Pierre/Ciseaux > Chiffre
    if (symbol1 === SYMBOLS.CROWN && symbol2 !== SYMBOLS.CROWN) {
        return 1;
    }
    if (symbol2 === SYMBOLS.CROWN && symbol1 !== SYMBOLS.CROWN) {
        return -1;
    }

    // Couronne vs Couronne (Reine vs Reine)
    if (symbol1 === SYMBOLS.CROWN && symbol2 === SYMBOLS.CROWN) {
        if (isAttackVsAttack) {
            return firstPlayer === 'card1' ? 1 : -1;
        } else {
            return 1; // Attaquant gagne
        }
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

    // Égalité
    if (isAttackVsAttack) {
        return firstPlayer === 'card1' ? 1 : -1;
    } else {
        return 1; // Attaquant gagne en cas d'égalité vs défenseur
    }
}

// ===== GESTION DES PHASES =====

function startCombatPhase() {
    gameState.phase = PHASES.COMBAT;
    gameState.combat = { playerCard: null, aiCard: null, winner: null, loser: null };
    gameState.currentAction = null;
    gameState.tempWinningCard = null;

    updateMessage('Sélectionnez une carte pour attaquer');
    updateUI();
    enableCardSelection();
}

function onPlayerCardSelected(card) {
    gameState.combat.playerCard = card;

    // Retirer la carte de la main
    const index = gameState.player.hand.findIndex(c => c.id === card.id);
    if (index !== -1) {
        gameState.player.hand.splice(index, 1);
    }

    // L'IA choisit sa carte
    const aiCard = selectAICard();
    gameState.combat.aiCard = aiCard;

    // Retirer la carte de la main de l'IA
    const aiIndex = gameState.ai.hand.findIndex(c => c.id === aiCard.id);
    if (aiIndex !== -1) {
        gameState.ai.hand.splice(aiIndex, 1);
    }

    updateUI();

    setTimeout(() => {
        revealCards();
    }, 500);
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
        gameState.combat.playerCard,
        gameState.combat.aiCard,
        true,
        firstPlayer === 'player' ? 'card1' : 'card2'
    );

    if (result > 0) {
        // Joueur gagne
        gameState.combat.winner = 'player';
        gameState.combat.loser = 'ai';
        updateMessage('Vous avez gagné le combat !');
    } else {
        // IA gagne
        gameState.combat.winner = 'ai';
        gameState.combat.loser = 'player';
        updateMessage('L\'IA a gagné le combat !');
    }

    setTimeout(() => {
        startWinnerChoicePhase();
    }, 2000);
}

function startWinnerChoicePhase() {
    gameState.phase = PHASES.WINNER_CHOICE;

    if (gameState.combat.winner === 'player') {
        showPlayerWinnerChoices();
    } else {
        makeAIWinnerChoice();
    }
}

function showPlayerWinnerChoices() {
    updateMessage('Vous avez gagné ! Choisissez votre action :');

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
    const beatableDefenders = getBeadableDefenders(
        gameState.combat.playerCard,
        gameState.ai.defense
    );

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
        const result = resolveCombat(attackCard, defender, false);
        return result >= 0; // Attaquant gagne ou égalité (attaquant gagne en égalité)
    });
}

function winnerChoiceA() {
    document.getElementById('action-buttons').classList.add('hidden');

    // Retirer 1 PV
    gameState.ai.hp--;
    updateUI();

    updateMessage('L\'IA perd 1 PV !');

    setTimeout(() => {
        startLoserChoicePhase();
    }, 1500);
}

function winnerChoiceB() {
    document.getElementById('action-buttons').classList.add('hidden');

    const beatableDefenders = getBeadableDefenders(
        gameState.combat.playerCard,
        gameState.ai.defense
    );

    if (beatableDefenders.length === 0) {
        updateMessage('Aucun défenseur ne peut être battu !');
        return;
    }

    updateMessage('Sélectionnez un défenseur à attaquer');
    highlightTargetableDefenders('ai', beatableDefenders);
}

function onDefenderTargeted(owner, defenderIndex) {
    const defender = gameState[owner].defense[defenderIndex];

    // Retirer le défenseur
    gameState[owner].defense.splice(defenderIndex, 1);

    // Ajouter à la prison du gagnant
    if (gameState.combat.winner === 'player') {
        gameState.player.prison.push(defender);
        gameState.ai.graveyard.push(gameState.combat.aiCard);
    } else {
        gameState.ai.prison.push(defender);
        gameState.player.graveyard.push(gameState.combat.playerCard);
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

    if (gameState.combat.loser === 'player') {
        showPlayerLoserChoices();
    } else {
        makeAILoserChoice();
    }
}

function showPlayerLoserChoices() {
    updateMessage('Vous avez perdu le combat. Choisissez votre action :');

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
    if (gameState.player.defense.length > 0) {
        const optionB = document.createElement('button');
        optionB.className = 'action-button';
        optionB.innerHTML = '🔄 Remplacer un défenseur (-1 carte / -1 PV)';
        optionB.onclick = () => loserChoiceB();
        actionButtons.appendChild(optionB);
    }

    // Option C : Sacrifier un défenseur
    if (gameState.player.defense.length > 0) {
        const optionC = document.createElement('button');
        optionC.className = 'action-button secondary';
        optionC.innerHTML = '⚔️ Sacrifier un défenseur (-2 cartes / 0 PV)';
        optionC.onclick = () => loserChoiceC();
        actionButtons.appendChild(optionC);
    }
}

function loserChoiceA() {
    document.getElementById('action-buttons').classList.add('hidden');

    // Carte perdante → défausse
    if (gameState.combat.loser === 'player') {
        gameState.player.graveyard.push(gameState.combat.playerCard);
    } else {
        gameState.ai.graveyard.push(gameState.combat.aiCard);
    }

    updateUI();
    updateMessage('Carte envoyée à la défausse. -1 PV déjà appliqué.');

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function loserChoiceB() {
    document.getElementById('action-buttons').classList.add('hidden');
    gameState.currentAction = 'replace_loser'; // Définir l'action en cours
    updateMessage('Sélectionnez un défenseur à remplacer');
    highlightAllDefenders(gameState.combat.loser);
}

function onDefenderReplaced(defenderIndex) {
    const loser = gameState.combat.loser;
    const losingCard = loser === 'player' ? gameState.combat.playerCard : gameState.combat.aiCard;

    // Défenseur remplacé → défausse
    const replacedDefender = gameState[loser].defense[defenderIndex];
    gameState[loser].graveyard.push(replacedDefender);

    // Carte perdante → défense
    gameState[loser].defense[defenderIndex] = losingCard;

    gameState.currentAction = null; // Réinitialiser

    updateUI();
    updateMessage('Défenseur remplacé !');

    removeDefenderHighlights();

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

function loserChoiceC() {
    document.getElementById('action-buttons').classList.add('hidden');
    gameState.currentAction = 'sacrifice'; // Définir l'action en cours
    updateMessage('Sélectionnez un défenseur à sacrifier');
    highlightAllDefenders(gameState.combat.loser);
}

function onDefenderSacrificed(defenderIndex) {
    const loser = gameState.combat.loser;
    const losingCard = loser === 'player' ? gameState.combat.playerCard : gameState.combat.aiCard;

    // Carte perdante → défausse
    gameState[loser].graveyard.push(losingCard);

    // Défenseur sacrifié → défausse
    const sacrificedDefender = gameState[loser].defense.splice(defenderIndex, 1)[0];
    gameState[loser].graveyard.push(sacrificedDefender);

    // Annuler la perte de PV (déjà appliquée dans winnerChoiceA)
    gameState[loser].hp++;

    gameState.currentAction = null; // Réinitialiser

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

    // Carte gagnante → défense du gagnant
    const winner = gameState.combat.winner;
    const winningCard = winner === 'player' ? gameState.combat.playerCard : gameState.combat.aiCard;

    // Si défense pleine, demander remplacement
    if (gameState[winner].defense.length >= gameState.settings.defenders) {
        if (winner === 'player') {
            showDefenderReplacementChoice(winningCard);
        } else {
            replaceAIDefender(winningCard);
        }
    } else {
        // Ajouter directement
        gameState[winner].defense.push(winningCard);
        updateUI();

        setTimeout(() => {
            endTurn();
        }, 1000);
    }
}

function showDefenderReplacementChoice(newCard) {
    gameState.tempWinningCard = newCard; // Stocker la carte temporairement
    updateMessage('Votre défense est pleine. Choisissez un défenseur à remplacer :');
    highlightAllDefenders('player');
}

function replaceDefenderWithWinningCard(defenderIndex) {
    const newCard = gameState.tempWinningCard;

    // Défenseur remplacé → retourne en main
    const replacedDefender = gameState.player.defense[defenderIndex];
    gameState.player.hand.push(replacedDefender);

    // Nouvelle carte → défense
    gameState.player.defense[defenderIndex] = newCard;

    gameState.tempWinningCard = null; // Réinitialiser

    updateUI();
    removeDefenderHighlights();

    setTimeout(() => {
        endTurn();
    }, 1000);
}

function replaceAIDefender(newCard) {
    // IA choisit aléatoirement (on pourrait améliorer selon difficulté)
    const randomIndex = Math.floor(Math.random() * gameState.ai.defense.length);
    const replacedDefender = gameState.ai.defense[randomIndex];
    gameState.ai.hand.push(replacedDefender);
    gameState.ai.defense[randomIndex] = newCard;

    updateUI();

    setTimeout(() => {
        endTurn();
    }, 1000);
}

function endTurn() {
    // Changer le jeton premier joueur
    gameState.firstPlayer = gameState.firstPlayer === 'player' ? 'ai' : 'player';

    // Vérifier les conditions de victoire
    const victoryCheck = checkVictoryConditions();
    if (victoryCheck) {
        endGame(victoryCheck);
        return;
    }

    // Tour suivant
    gameState.turn++;
    updateUI();

    updateMessage('Nouveau tour ! Sélectionnez une carte pour attaquer.');
    startCombatPhase();
}

// ===== IA =====

function selectAICard() {
    const difficulty = gameState.settings.difficulty;

    if (difficulty === 'easy') {
        // IA facile : choisit une carte aléatoire
        const randomIndex = Math.floor(Math.random() * gameState.ai.hand.length);
        return gameState.ai.hand[randomIndex];
    }

    if (difficulty === 'normal') {
        // IA normale : préfère les cartes fortes
        const sortedHand = [...gameState.ai.hand].sort((a, b) => {
            const powerA = getCardPower(a);
            const powerB = getCardPower(b);
            return powerB - powerA;
        });

        // 60% de chance de choisir les 3 meilleures cartes
        if (Math.random() < 0.6 && sortedHand.length >= 3) {
            const topCards = sortedHand.slice(0, 3);
            return topCards[Math.floor(Math.random() * topCards.length)];
        } else {
            return sortedHand[Math.floor(Math.random() * sortedHand.length)];
        }
    }

    if (difficulty === 'hard') {
        // IA difficile : stratégie optimale
        // Choisit toujours les meilleures cartes en priorité
        const sortedHand = [...gameState.ai.hand].sort((a, b) => {
            const powerA = getCardPower(a);
            const powerB = getCardPower(b);
            return powerB - powerA;
        });

        return sortedHand[0];
    }
}

function getCardPower(card) {
    if (card.type === CARD_TYPES.QUEEN) return 100;
    if (card.type === CARD_TYPES.ROOK) return 50;
    if (card.type === CARD_TYPES.BISHOP) return 45;
    if (card.type === CARD_TYPES.KNIGHT) return 40;
    if (card.type === CARD_TYPES.PAWN) {
        if (card.number >= 7) return 20 + card.number;
        if (card.number >= 5) return 15 + card.number;
        return 10 + card.number;
    }
    return 0;
}

function makeAIWinnerChoice() {
    const difficulty = gameState.settings.difficulty;

    // Vérifier si l'IA peut attaquer un défenseur
    const beatableDefenders = getBeadableDefenders(
        gameState.combat.aiCard,
        gameState.player.defense
    );

    let choice = 'A';

    if (difficulty === 'easy') {
        // 70% Option A, 30% Option B si disponible
        if (beatableDefenders.length > 0 && Math.random() < 0.3) {
            choice = 'B';
        }
    } else if (difficulty === 'normal') {
        // 50/50 si Option B disponible
        if (beatableDefenders.length > 0 && Math.random() < 0.5) {
            choice = 'B';
        }
    } else if (difficulty === 'hard') {
        // Stratégie : privilégier victoire tactique si proche
        if (beatableDefenders.length > 0) {
            const prisonProgress = gameState.ai.prison.length / gameState.settings.tacticalVictory;
            const hpProgress = (gameState.settings.hp - gameState.player.hp) / gameState.settings.hp;

            if (prisonProgress > hpProgress || gameState.ai.prison.length >= gameState.settings.tacticalVictory - 2) {
                choice = 'B';
            }
        }
    }

    if (choice === 'A') {
        gameState.player.hp--;
        updateUI();
        updateMessage('L\'IA enlève 1 PV !');

        setTimeout(() => {
            startLoserChoicePhase();
        }, 1500);
    } else {
        // Choisir un défenseur aléatoire parmi ceux battables
        const randomDefender = beatableDefenders[Math.floor(Math.random() * beatableDefenders.length)];
        const defenderIndex = gameState.player.defense.indexOf(randomDefender);

        updateMessage('L\'IA attaque votre défenseur !');

        setTimeout(() => {
            onDefenderTargeted('player', defenderIndex);
        }, 1500);
    }
}

function makeAILoserChoice() {
    const difficulty = gameState.settings.difficulty;
    const hasDefenders = gameState.ai.defense.length > 0;

    let choice = 'A';

    if (hasDefenders) {
        if (difficulty === 'easy') {
            // 70% Accepter, 15% Remplacer, 15% Sacrifier
            const rand = Math.random();
            if (rand < 0.15) choice = 'B';
            else if (rand < 0.30) choice = 'C';
        } else if (difficulty === 'normal') {
            // Décision selon HP
            if (gameState.ai.hp <= 3) {
                // HP faibles : sacrifier pour sauver HP
                choice = 'C';
            } else if (Math.random() < 0.3) {
                choice = 'B';
            }
        } else if (difficulty === 'hard') {
            // Stratégie optimale
            if (gameState.ai.hp <= 2) {
                choice = 'C'; // Sacrifier pour sauver HP
            } else if (gameState.ai.hp <= 4 && Math.random() < 0.6) {
                choice = 'C';
            } else if (Math.random() < 0.4) {
                choice = 'B';
            }
        }
    }

    if (choice === 'A') {
        gameState.ai.graveyard.push(gameState.combat.aiCard);
        updateMessage('L\'IA accepte la défaite.');
    } else if (choice === 'B') {
        const randomIndex = Math.floor(Math.random() * gameState.ai.defense.length);
        const replacedDefender = gameState.ai.defense[randomIndex];
        gameState.ai.graveyard.push(replacedDefender);
        gameState.ai.defense[randomIndex] = gameState.combat.aiCard;
        updateMessage('L\'IA remplace un défenseur.');
    } else if (choice === 'C') {
        const randomIndex = Math.floor(Math.random() * gameState.ai.defense.length);
        const sacrificedDefender = gameState.ai.defense.splice(randomIndex, 1)[0];
        gameState.ai.graveyard.push(gameState.combat.aiCard);
        gameState.ai.graveyard.push(sacrificedDefender);
        gameState.ai.hp++; // Annuler la perte de PV
        updateMessage('L\'IA sacrifie un défenseur pour sauver ses HP !');
    }

    updateUI();

    setTimeout(() => {
        startResolutionPhase();
    }, 1500);
}

// ===== CONDITIONS DE VICTOIRE =====

function checkVictoryConditions() {
    // Victoire HP
    if (gameState.player.hp <= 0) {
        return { winner: 'ai', reason: 'HP à 0', type: 'hp' };
    }
    if (gameState.ai.hp <= 0) {
        return { winner: 'player', reason: 'HP à 0', type: 'hp' };
    }

    // Victoire Cartes
    if (gameState.player.hand.length === 0) {
        return { winner: 'ai', reason: 'Plus de cartes en main', type: 'cards' };
    }
    if (gameState.ai.hand.length === 0) {
        return { winner: 'player', reason: 'Plus de cartes en main', type: 'cards' };
    }

    // Victoire Tactique
    if (gameState.player.prison.length >= gameState.settings.tacticalVictory) {
        return { winner: 'player', reason: 'Victoire tactique', type: 'tactical' };
    }
    if (gameState.ai.prison.length >= gameState.settings.tacticalVictory) {
        return { winner: 'ai', reason: 'Victoire tactique', type: 'tactical' };
    }

    // Fin de partie par tours max
    if (gameState.turn > gameState.settings.maxTurns) {
        if (gameState.player.hp > gameState.ai.hp) {
            return { winner: 'player', reason: 'Plus de HP à la fin', type: 'turns' };
        } else if (gameState.ai.hp > gameState.player.hp) {
            return { winner: 'ai', reason: 'Plus de HP à la fin', type: 'turns' };
        } else {
            // Égalité HP, vérifier défausse
            if (gameState.player.graveyard.length < gameState.ai.graveyard.length) {
                return { winner: 'player', reason: 'Moins de cartes en défausse', type: 'turns' };
            } else if (gameState.ai.graveyard.length < gameState.player.graveyard.length) {
                return { winner: 'ai', reason: 'Moins de cartes en défausse', type: 'turns' };
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

    if (victoryData.winner === 'player') {
        title.textContent = 'VICTOIRE !';
        icon.textContent = '🏆';
        message.textContent = `Vous avez gagné par ${victoryData.reason} !`;
    } else if (victoryData.winner === 'ai') {
        title.textContent = 'DÉFAITE';
        icon.textContent = '💔';
        message.textContent = `L'IA a gagné par ${victoryData.reason}.`;
    } else {
        title.textContent = 'ÉGALITÉ';
        icon.textContent = '🤝';
        message.textContent = victoryData.reason;
    }

    stats.innerHTML = `
        <h3>Statistiques finales</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
                <h4>Vous</h4>
                <p>❤️ HP: ${gameState.player.hp}</p>
                <p>🖐️ Cartes: ${gameState.player.hand.length}</p>
                <p>💀 Défausse: ${gameState.player.graveyard.length}</p>
                <p>🏆 Prison: ${gameState.player.prison.length}</p>
            </div>
            <div>
                <h4>IA</h4>
                <p>❤️ HP: ${gameState.ai.hp}</p>
                <p>🖐️ Cartes: ${gameState.ai.hand.length}</p>
                <p>💀 Défausse: ${gameState.ai.graveyard.length}</p>
                <p>🏆 Prison: ${gameState.ai.prison.length}</p>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// ===== INTERFACE UTILISATEUR =====

function updateUI() {
    // Mettre à jour les statistiques
    document.getElementById('player-hp').textContent = gameState.player.hp;
    document.getElementById('player-cards').textContent = gameState.player.hand.length;
    document.getElementById('player-graveyard').textContent = gameState.player.graveyard.length;
    document.getElementById('player-prison').textContent = gameState.player.prison.length;

    document.getElementById('ai-hp').textContent = gameState.ai.hp;
    document.getElementById('ai-cards').textContent = gameState.ai.hand.length;
    document.getElementById('ai-graveyard').textContent = gameState.ai.graveyard.length;
    document.getElementById('ai-prison').textContent = gameState.ai.prison.length;

    // Mettre à jour le tour
    document.getElementById('turn-number').textContent = gameState.turn;

    // Mettre à jour le premier joueur
    const playerFirstPlayer = document.getElementById('player-first-player');
    const aiFirstPlayer = document.getElementById('ai-first-player');

    if (gameState.firstPlayer === 'player') {
        playerFirstPlayer.classList.add('active');
        aiFirstPlayer.classList.remove('active');
    } else {
        aiFirstPlayer.classList.add('active');
        playerFirstPlayer.classList.remove('active');
    }

    // Mettre à jour les couleurs
    document.getElementById('player-color').textContent =
        gameState.settings.playerColor === 'white' ? 'Blanc' : 'Noir';

    document.getElementById('ai-difficulty').textContent =
        gameState.settings.difficulty === 'easy' ? 'Facile' :
        gameState.settings.difficulty === 'normal' ? 'Normal' : 'Difficile';

    // Mettre à jour les mains
    renderHand('player');
    renderHand('ai');

    // Mettre à jour les défenses
    renderDefense('player');
    renderDefense('ai');

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

    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, owner === 'ai');

        if (owner === 'player' && gameState.phase === PHASES.COMBAT) {
            cardElement.onclick = () => onPlayerCardSelected(card);
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
            const cardElement = createCardElement(card, false);
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
    const playerCombatSlot = document.getElementById('player-combat-card');
    const aiCombatSlot = document.getElementById('ai-combat-card');

    playerCombatSlot.innerHTML = '';
    aiCombatSlot.innerHTML = '';

    if (gameState.combat.playerCard) {
        const cardElement = createCardElement(gameState.combat.playerCard, false);
        playerCombatSlot.appendChild(cardElement);
        playerCombatSlot.classList.add('filled');
    } else {
        playerCombatSlot.innerHTML = '<span class="placeholder-text">Choisissez une carte</span>';
        playerCombatSlot.classList.remove('filled');
    }

    if (gameState.combat.aiCard) {
        const cardElement = createCardElement(gameState.combat.aiCard, false);
        aiCombatSlot.appendChild(cardElement);
        aiCombatSlot.classList.add('filled');
    } else {
        aiCombatSlot.innerHTML = '<span class="placeholder-text">?</span>';
        aiCombatSlot.classList.remove('filled');
    }
}

function createCardElement(card, hidden = false) {
    const div = document.createElement('div');
    div.className = `card ${card.color}`;
    div.dataset.cardId = card.id;

    if (hidden) {
        div.classList.add('hidden');
        div.innerHTML = '<div class="card-body"><div class="card-piece">?</div></div>';
        return div;
    }

    const icon = PIECE_ICONS[card.color][card.type];
    const attackSymbol = getAttackSymbol(card);
    const defenseSymbol = getDefenseSymbol(card);

    // Obtenir les icônes et valeurs de pouvoir
    const attackData = getPowerData(attackSymbol, card);
    const defenseData = getPowerData(defenseSymbol, card);

    // Header
    let headerHTML = '<div class="card-header">';
    if (card.type === CARD_TYPES.PAWN) {
        headerHTML += `<div class="card-number">${card.number}</div>`;
    } else {
        headerHTML += '<div></div>';
    }
    headerHTML += `<div class="power-type-badge">${attackData.icon}</div>`;
    headerHTML += '</div>';

    // Body
    const bodyHTML = `
        <div class="card-body">
            <div class="card-piece">${icon}</div>
            <div class="card-name">${card.name}</div>
        </div>
    `;

    // Footer avec puissances
    const footerHTML = `
        <div class="card-footer">
            <div class="card-power-section">
                <div class="power-label">ATK</div>
                <div class="power-value attack-power">
                    <span class="power-icon">${attackData.icon}</span>
                    <span>${attackData.value}</span>
                </div>
            </div>
            <div class="card-power-section">
                <div class="power-label">DEF</div>
                <div class="power-value defense-power">
                    <span class="power-icon">${defenseData.icon}</span>
                    <span>${defenseData.value}</span>
                </div>
            </div>
        </div>
    `;

    div.innerHTML = headerHTML + bodyHTML + footerHTML;

    // Ajouter les événements de tooltip
    div.addEventListener('mouseenter', (e) => showCardTooltip(card, e));
    div.addEventListener('mouseleave', hideCardTooltip);
    div.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showCardTooltip(card, e);
    });
    div.addEventListener('touchend', hideCardTooltip);

    return div;
}

// Fonction helper pour obtenir les données de pouvoir
function getPowerData(symbol, card) {
    let icon = '';
    let value = '';

    if (symbol === SYMBOLS.CROWN) {
        icon = '👑';
        value = 'MAX';
    } else if (symbol === SYMBOLS.PAPER) {
        icon = '📄';
        value = 'PAP';
    } else if (symbol === SYMBOLS.ROCK) {
        icon = '🪨';
        value = 'ROC';
    } else if (symbol === SYMBOLS.SCISSORS) {
        icon = '✂️';
        value = 'CIS';
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
        // Vérifier si le slot est occupé
        if (!slot.classList.contains('occupied')) return;

        // Récupérer l'index réel depuis data-index
        const actualIndex = parseInt(slot.dataset.index);

        slot.classList.add('targetable');
        slot.onclick = () => {
            if (gameState.phase === PHASES.LOSER_CHOICE) {
                // Utiliser currentAction pour déterminer l'action
                if (gameState.currentAction === 'replace_loser') {
                    onDefenderReplaced(actualIndex);
                } else if (gameState.currentAction === 'sacrifice') {
                    onDefenderSacrificed(actualIndex);
                }
            } else if (gameState.phase === PHASES.RESOLUTION) {
                // Remplacement avec carte gagnante
                replaceDefenderWithWinningCard(actualIndex);
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

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Bouton retour au menu
    document.getElementById('back-to-menu').addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment quitter la partie en cours ?')) {
            window.location.href = 'chess-cards.html';
        }
    });

    // Bouton d'aide
    document.getElementById('help-button').addEventListener('click', () => {
        document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('close-help').addEventListener('click', () => {
        document.getElementById('help-modal').classList.add('hidden');
    });

    // Boutons de fin de partie
    document.getElementById('new-game-button').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('menu-button').addEventListener('click', () => {
        window.location.href = 'chess-cards.html';
    });

    // Fermer les modals en cliquant à l'extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Rendre les stats de défausse cliquables
    makeGraveyardStatsClickable();
}

// ===== TOOLTIPS DE CARTES =====

let currentTooltip = null;
let tooltipTimeout = null;

function showCardTooltip(card, event) {
    // Nettoyer l'ancien tooltip
    hideCardTooltip();

    // Créer le nouveau tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'card-tooltip';
    tooltip.id = 'card-tooltip';

    const attackSymbol = getAttackSymbol(card);
    const defenseSymbol = getDefenseSymbol(card);
    const attackData = getPowerData(attackSymbol, card);
    const defenseData = getPowerData(defenseSymbol, card);

    // Description de la carte
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

    // Positionner le tooltip
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

    // Ajuster si hors de l'écran à droite
    if (left + tooltipRect.width > viewportWidth) {
        left = mouseX - tooltipRect.width - 15;
    }

    // Ajuster si hors de l'écran en bas
    if (top + tooltipRect.height > viewportHeight) {
        top = mouseY - tooltipRect.height - 15;
    }

    // Limiter aux bords de l'écran
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
    // Stats du joueur
    document.getElementById('player-graveyard').parentElement.classList.add('clickable');
    document.getElementById('player-graveyard').parentElement.addEventListener('click', () => {
        showGraveyardModal('player');
    });

    document.getElementById('player-prison').parentElement.classList.add('clickable');
    document.getElementById('player-prison').parentElement.addEventListener('click', () => {
        showGraveyardModal('player', true);
    });

    // Stats de l'IA
    document.getElementById('ai-graveyard').parentElement.classList.add('clickable');
    document.getElementById('ai-graveyard').parentElement.addEventListener('click', () => {
        showGraveyardModal('ai');
    });

    document.getElementById('ai-prison').parentElement.classList.add('clickable');
    document.getElementById('ai-prison').parentElement.addEventListener('click', () => {
        showGraveyardModal('ai', true);
    });
}

function showGraveyardModal(owner, prisonOnly = false) {
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'graveyard-modal';
    modal.id = 'graveyard-modal-temp';

    const ownerName = owner === 'player' ? 'Vous' : 'IA';

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
        // Section Cimetière
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

    // Section Prison
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

    // Event listeners
    document.getElementById('close-graveyard').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

console.log('♔ Chess & Cards - Game VS AI loaded ♛');
