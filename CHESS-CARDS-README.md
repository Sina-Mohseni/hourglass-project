# ♔ Chess & Cards ♛

Un jeu de cartes stratégique dans l'univers des échecs, jouable directement dans votre navigateur.

## 🎮 Description

Chess & Cards est un jeu de cartes innovant qui combine la stratégie des échecs avec des mécaniques de jeu de cartes. Affrontez l'IA ou un autre joueur dans des parties tactiques où chaque pièce d'échecs devient une carte avec ses propres caractéristiques d'attaque et de défense.

## ✨ Fonctionnalités

### Menu Principal
- **Design moderne et responsive** - Fonctionne sur desktop, tablette et mobile
- **Animation fluides** - Interface élégante avec des transitions douces
- **Thème sombre** - Design inspiré du plateau d'échecs avec des couleurs modernes

### Modes de jeu
- **Joueur vs IA**
  - Choix de difficulté (Facile / Normal / Difficile)
  - Sélection de couleur (Blanc / Noir)

- **Joueur vs Joueur**
  - Configuration de deux joueurs avec pseudos personnalisés
  - Sélection de couleur pour chaque joueur
  - Validation pour éviter les doublons

### Paramètres personnalisables
- **HP de départ** : de 3 à 12 points de vie
- **Défenseurs max** : de 1 à 3 défenseurs simultanés
- **Victoire tactique** : de 1 à 12 points requis
- **Nombre de tours max** : de 5 à 20 tours avant fin de partie

### Système de règles
- Règles complètes intégrées et consultables
- Explication des pièces et de leurs valeurs
- Guide du déroulement d'un tour
- Conditions de victoire détaillées

## 🚀 Installation et utilisation

### Méthode simple
1. Ouvrez le fichier `chess-cards.html` dans votre navigateur web
2. Le jeu se charge automatiquement avec tous les styles et scripts

### Structure des fichiers
```
hourglass-project/
├── chess-cards.html        # Page principale du jeu
├── css/
│   └── chess-cards.css     # Styles du jeu
├── js/
│   └── chess-cards.js      # Logique et interactivité
└── CHESS-CARDS-README.md   # Ce fichier
```

## 🎯 Comment jouer

### Configuration de partie
1. **Choisissez votre mode** : Joueur vs IA ou Joueur vs Joueur
2. **Configurez les options** spécifiques au mode choisi
3. **Ajustez les paramètres** de partie selon vos préférences
4. **Consultez les règles** si nécessaire
5. **Cliquez sur "Commencer la partie"** pour lancer le jeu

### Les cartes

| Pièce | Attaque | Défense |
|-------|---------|---------|
| Pion ♟ | 1 | 1 |
| Cavalier ♞ | 3 | 2 |
| Fou ♝ | 3 | 2 |
| Tour ♜ | 5 | 3 |
| Dame ♛ | 8 | 4 |
| Roi ♚ | 0 | 5 |

### Déroulement d'un tour
1. **Piocher** une carte
2. **Jouer** une carte d'attaque ou de défense
3. **Défendre** avec les cartes disponibles
4. **Résolution** des dégâts

### Conditions de victoire
- **Victoire par élimination** : Réduire les HP adverses à 0
- **Victoire tactique** : Atteindre le nombre requis de victoires tactiques
- **Égalité** : En cas de nombre de tours max atteint, le joueur avec le plus de HP gagne

## 🎨 Caractéristiques techniques

### Technologies utilisées
- **HTML5** - Structure sémantique
- **CSS3** - Design moderne avec animations
- **JavaScript (ES6+)** - Logique du jeu et interactivité

### Responsive Design
- **Desktop** : Expérience optimale avec grand écran
- **Tablette** : Interface adaptée pour écrans moyens
- **Mobile** : Layout optimisé pour smartphones
- **Très petits écrans** : Support jusqu'à 360px de largeur

### Fonctionnalités JavaScript
- Gestion d'état du jeu
- Validation des entrées utilisateur
- Sauvegarde locale des paramètres (localStorage)
- Système de notifications
- Easter egg (Konami Code) 🎉

## 🛠️ Développement futur

### Prochaines étapes
- [ ] Interface de jeu principale
- [ ] Système de combat avec les cartes
- [ ] IA avec différents niveaux de difficulté
- [ ] Animations de cartes
- [ ] Effets sonores
- [ ] Système de score et statistiques
- [ ] Mode multijoueur en ligne
- [ ] Deck builder personnalisé

## 📱 Compatibilité

### Navigateurs supportés
- ✅ Chrome (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

### Résolutions testées
- 📱 Mobile : 360px - 767px
- 📱 Tablette : 768px - 1199px
- 💻 Desktop : 1200px et plus

## 🎮 Easter Eggs

Essayez de trouver le code Konami !
Indice : ↑ ↑ ↓ ↓ ← → ← → B A

## 📝 Notes

- Les paramètres de jeu sont sauvegardés localement
- Le jeu fonctionne entièrement côté client (pas de serveur requis)
- Optimisé pour les performances et la fluidité

## 🤝 Contribution

Ce projet est en développement actif. Les suggestions et améliorations sont les bienvenues !

## 📄 Licence

Projet personnel - Libre d'utilisation et de modification

---

**Développé avec ♔ pour les amateurs d'échecs et de jeux de cartes**

Bon jeu ! ⚔️
