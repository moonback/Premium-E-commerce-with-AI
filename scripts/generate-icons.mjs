// scripts/generate-icons.mjs
// Script pour générer les icônes PWA à partir d'un logo SVG

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Créer un SVG simple pour Véridian si aucun logo n'existe
const createPlaceholderSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#F9F7F2"/>
  
  <!-- Logo Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="#1C2B21"/>
  
  <!-- Letter V -->
  <text 
    x="${size/2}" 
    y="${size/2 + size * 0.12}" 
    font-family="serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="#F9F7F2" 
    text-anchor="middle">V</text>
</svg>`;
};

// Fonction pour convertir SVG en PNG (nécessite sharp)
async function generateIcons() {
  console.log('🎨 Génération des icônes PWA pour Véridian...\n');

  // Vérifier si sharp est installé
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.log('⚠️  Sharp n\'est pas installé.');
    console.log('📦 Installation: npm install sharp\n');
    console.log('💡 Alternative: Générer les SVG placeholders...\n');
    
    // Générer des SVG placeholders
    for (const size of sizes) {
      const svg = createPlaceholderSVG(size);
      const filename = `icon-${size}x${size}.svg`;
      const filepath = path.join(iconsDir, filename);
      
      fs.writeFileSync(filepath, svg);
      console.log(`✅ Créé: ${filename}`);
    }
    
    console.log('\n✨ SVG placeholders créés avec succès!');
    console.log('💡 Pour générer des PNG, installez sharp: npm install sharp');
    console.log('💡 Ou utilisez un service en ligne: https://realfavicongenerator.net/');
    return;
  }

  // Générer les PNG avec sharp
  for (const size of sizes) {
    const svg = createPlaceholderSVG(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);

    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(filepath);
      
      console.log(`✅ Créé: ${filename}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${filename}:`, error.message);
    }
  }

  console.log('\n✨ Icônes PWA générées avec succès!');
  console.log('📁 Emplacement: public/icons/');
  console.log('\n💡 Conseil: Remplacez ces icônes par votre vrai logo pour un rendu professionnel.');
}

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

generateIcons().catch(console.error);
