# PWA Screenshots

Ce dossier contient les captures d'écran pour la Progressive Web App (PWA) Véridian.

## Tailles requises

### Desktop (wide)
- **home.png**: 1280x720 (16:9)
- Capture de la page d'accueil sur desktop

### Mobile (narrow)
- **mobile.png**: 750x1334 (9:16)
- Capture de la page d'accueil sur mobile

## Comment créer les screenshots

### Option 1: Capture manuelle
1. Ouvrir l'application en mode développement
2. Utiliser les DevTools pour définir la taille exacte
3. Prendre une capture d'écran (F12 > Device Toolbar > Screenshot)

### Option 2: Playwright (automatisé)
```javascript
// scripts/generate-screenshots.js
const { chromium } = require('playwright');

async function generateScreenshots() {
  const browser = await chromium.launch();
  
  // Desktop screenshot
  const desktopPage = await browser.newPage();
  await desktopPage.setViewportSize({ width: 1280, height: 720 });
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.screenshot({ path: 'public/screenshots/home.png' });
  
  // Mobile screenshot
  const mobilePage = await browser.newPage();
  await mobilePage.setViewportSize({ width: 750, height: 1334 });
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.screenshot({ path: 'public/screenshots/mobile.png' });
  
  await browser.close();
}

generateScreenshots();
```

### Option 3: Puppeteer
```javascript
const puppeteer = require('puppeteer');

async function generateScreenshots() {
  const browser = await puppeteer.launch();
  
  // Desktop
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1280, height: 720 });
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.screenshot({ path: 'public/screenshots/home.png' });
  
  // Mobile
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 750, height: 1334 });
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.screenshot({ path: 'public/screenshots/mobile.png' });
  
  await browser.close();
}

generateScreenshots();
```

## Guidelines

### Contenu
- Montrer les fonctionnalités principales
- Utiliser des données réalistes (pas de lorem ipsum)
- Éviter les informations sensibles
- Montrer l'interface dans son meilleur état

### Qualité
- Format: PNG
- Compression: Optimisée (TinyPNG, ImageOptim)
- Pas de barre d'adresse du navigateur
- Pas de DevTools visibles

### Composition
- Centrer le contenu principal
- Utiliser des produits attractifs
- Montrer l'interface complète (header + content)
- Éviter les zones vides

## Temporaire

En attendant les vraies captures, le manifest.json peut fonctionner sans screenshots. Ils sont optionnels mais recommandés pour une meilleure expérience d'installation.

Pour désactiver temporairement :
```json
// Dans manifest.json, commenter ou supprimer la section screenshots
"screenshots": []
```
