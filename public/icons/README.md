# PWA Icons

Ce dossier contient les icônes pour la Progressive Web App (PWA) Véridian.

## Tailles requises

- 72x72 (icon-72x72.png)
- 96x96 (icon-96x96.png)
- 128x128 (icon-128x128.png)
- 144x144 (icon-144x144.png)
- 152x152 (icon-152x152.png)
- 192x192 (icon-192x192.png)
- 384x384 (icon-384x384.png)
- 512x512 (icon-512x512.png)

## Génération des icônes

Pour générer les icônes à partir d'une image source (logo.svg ou logo.png) :

### Option 1: Utiliser un service en ligne
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Option 2: Utiliser ImageMagick (CLI)
```bash
# Installer ImageMagick
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: apt-get install imagemagick

# Générer toutes les tailles
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Utiliser sharp (Node.js)
```bash
npm install sharp
node scripts/generate-icons.js
```

## Design Guidelines

- **Format:** PNG avec transparence
- **Forme:** Carré (1:1)
- **Marges:** 10% de padding autour du logo
- **Couleur de fond:** Transparent ou #F9F7F2 (bg)
- **Logo:** Centré, couleur #1C2B21 (ink)
- **Style:** Minimaliste, élégant, premium

## Maskable Icons

Les icônes sont marquées comme "maskable" dans le manifest, ce qui signifie qu'elles peuvent être adaptées à différentes formes (cercle, carré arrondi, etc.) selon le système d'exploitation.

Pour un rendu optimal :
- Gardez les éléments importants dans la "safe zone" (80% du centre)
- Utilisez un fond uni ou un dégradé subtil
- Évitez les détails fins sur les bords
