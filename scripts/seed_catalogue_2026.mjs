#!/usr/bin/env node
// Seed catalogue 2026 : crée les 24 produits du catalogue via l'API admin
// (upload image + POST /api/produits), en réutilisant creerStockInitial.
//
// Contraintes :
// - Pas de SQL brut : tout passe par l'API (POST /api/images, POST /api/produits).
// - Idempotent : un produit dont le nom existe déjà n'est jamais recréé ni écrasé
//   (les modifications admin sont préservées).
// - Purge contrôlée : les produits actifs absents du catalogue 2026 sont archivés
//   (suppression logique, jamais physique).
// - Dev uniquement : refuse de tourner si l'API n'est pas localhost/127.0.0.1.
//
// Usage : node scripts/seed_catalogue_2026.mjs [--api-url http://localhost:8080]

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = join(RACINE, 'seed-assets', 'catalogue-2026');

const args = process.argv.slice(2);
const apiUrl = args.includes('--api-url')
  ? args[args.indexOf('--api-url') + 1]
  : 'http://localhost:8080';

// Garde-fou production : ce script ne doit jamais s'exécuter contre une API distante.
const { hostname } = new URL(apiUrl);
if (!['localhost', '127.0.0.1'].includes(hostname)) {
  console.error(`REFUS : l'API cible '${apiUrl}' n'est pas locale. Ce script est réservé à l'environnement de dev.`);
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@assoue.bf';
const ADMIN_MOT_DE_PASSE = 'Password123!';

// Catégories référencées par nom : leurs ids varient d'une base à l'autre.
const CATALOGUE = [
  { nom: 'Guéridon pagne et bois', categorie: 'Maison et jardin', prix: 25000, stock: 5, image: 'gueridons-pneus-02.jpg', description: 'Guéridon rond avec plateau en pagne et pieds en bois.' },
  { nom: 'Poubelle en pneus', categorie: 'Maison et jardin', prix: 20000, stock: 5, image: 'poubelles-pneus-01.jpg', description: 'Poubelle en pneus empilés avec couvercle et pied métallique.' },
  { nom: 'Pot de culture en pneu', categorie: 'Maison et jardin', prix: 12000, stock: 5, image: 'pots-culture-hors-sol-01.jpg', description: 'Pot de culture en pneu décoré de motifs colorés.' },
  { nom: 'Pot de fleurs en pneu', categorie: 'Maison et jardin', prix: 5000, stock: 5, image: 'pots-fleurs-01.jpg', description: 'Pot de fleurs en pneu peint avec socle.' },
  { nom: 'Pouf en pagne', categorie: 'Maison et jardin', prix: 12000, stock: 5, image: 'poufs-pneus-02.jpg', description: 'Pouf rond recouvert de pagne.' },
  { nom: 'Chaise haute en pneu', categorie: 'Maison et jardin', prix: 18000, stock: 5, image: 'chaises-hautes-pneus-01.jpg', description: 'Chaise haute avec assise en pneu et coussin en pagne.' },
  { nom: 'Pouf deux en un', categorie: 'Maison et jardin', prix: 18000, stock: 5, image: 'pouf-deux-en-un-01.jpg', description: 'Pouf avec plateau en pagne, transformable en table basse.' },
  { nom: 'Mini salon 2 places', categorie: 'Maison et jardin', prix: 85000, stock: 3, image: 'mini-salons-2-places-01.jpg', description: 'Mini salon 2 places en pneus avec coussins en pagne.' },
  { nom: 'Salon 4 places', categorie: 'Maison et jardin', prix: 150000, stock: 3, image: 'salons-4-places-04.jpg', description: 'Salon 4 places en pneus avec coussins en pagne.' },
  { nom: 'Salon 7 places', categorie: 'Maison et jardin', prix: 300000, stock: 3, image: 'salons-7-places-03.jpg', description: 'Salon 7 places en pneus avec coussins et table basse.' },
  { nom: 'Bureau en pneus', categorie: 'Maison et jardin', prix: 120000, stock: 3, image: 'bureaux-pneus-01.jpg', description: 'Bureau en pneus avec plateau bleu.' },
  { nom: 'Sandales lanières pneu', categorie: 'Chaussures', prix: 8000, stock: 8, image: 'chaussures-pneus-05.jpg', description: 'Sandales à lanières avec semelle en pneu.' },
  { nom: 'Bracelet chambre à air', categorie: 'Bijoux', prix: 2500, stock: 10, image: 'colliers-bracelets-chambre-a-air-01.jpg', description: 'Bracelet en chambre à air avec découpes et rivets.' },
  { nom: 'Pull-over pagne', categorie: 'Vêtements', prix: 15000, stock: 8, image: 'pull-over-05.jpg', description: 'Pull-over à manches longues avec motif pagne.' },
  { nom: 'Ensemble enfant pagne', categorie: 'Vêtements', prix: 12000, stock: 8, image: 'ensembles-enfants-03.jpg', description: 'Ensemble enfant en pagne (t-shirt et pantalon).' },
  { nom: 'Sac à main pagne', categorie: 'Accessoires', prix: 15000, stock: 8, image: 'sacs-dos-et-main-02.jpg', description: 'Sac à main en pagne avec anses noires.' },
  { nom: 'Sac à dos pagne', categorie: 'Accessoires', prix: 10000, stock: 8, image: 'sacs-hommes-01.jpg', description: 'Sac à dos en pagne avec bandoulière.' },
  { nom: 'Éventail et ceinture pagne', categorie: 'Accessoires', prix: 6000, stock: 10, image: 'sacs-eventails-ceintures-01.jpg', description: 'Éventail et ceinture en pagne.' },
  { nom: 'Couverture carnet pagne', categorie: 'Accessoires', prix: 3000, stock: 10, image: 'couvres-carnet-passeport-01.jpg', description: 'Couverture de carnet en pagne.' },
  { nom: 'Drap de lit tie-dye', categorie: 'Décoration et maison', prix: 25000, stock: 5, image: 'draps-04.jpg', description: 'Drap de lit avec motifs tie-dye et taies assorties.' },
  { nom: 'Tableaux décoratifs pagne', categorie: 'Décoration et maison', prix: 15000, stock: 5, image: 'tableaux-decoratifs-01.jpg', description: 'Tableaux décoratifs triangulaires en pagne.' },
  { nom: 'Boîtes à mouchoirs pagne', categorie: 'Décoration et maison', prix: 4000, stock: 10, image: 'boites-mouchoir-02.jpg', description: 'Boîtes à mouchoirs en pagne.' },
  { nom: 'Housses sièges voiture pagne', categorie: 'Décoration et maison', prix: 45000, stock: 5, image: 'housses-voitures-04.jpg', description: 'Housses de sièges de voiture en pagne.' },
  { nom: 'Décoration restaurant pagne', categorie: 'Décoration et maison', prix: 20000, stock: 5, image: 'decoration-restaurant-02.jpg', description: 'Décoration de table de restaurant en pagne.' },
];

async function appel(token, chemin, options = {}) {
  const reponse = await fetch(`${apiUrl}${chemin}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!reponse.ok) {
    const corps = await reponse.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${chemin} → ${reponse.status} ${corps}`);
  }
  return reponse.status === 204 ? null : reponse.json();
}

async function uploaderImage(token, cheminFichier) {
  const contenu = readFileSync(cheminFichier);
  const formulaire = new FormData();
  formulaire.append('fichier', new Blob([contenu], { type: 'image/jpeg' }), cheminFichier.split(/[\\/]/).pop());
  const { cle } = await appel(token, '/api/images', { method: 'POST', body: formulaire });
  return cle;
}

const main = async () => {
  const { token } = await appel(null, '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, motDePasse: ADMIN_MOT_DE_PASSE }),
  });

  const categories = await appel(token, '/api/categories');
  const idCategorie = nom => {
    const categorie = categories.find(c => c.nom === nom);
    if (!categorie) throw new Error(`Catégorie absente de la base : ${nom}`);
    return categorie.id;
  };

  const produitsActifs = await appel(token, '/api/produits');
  const nomsCatalogue = new Set(CATALOGUE.map(p => p.nom));

  let crees = 0;
  let ignores = 0;
  for (const produit of CATALOGUE) {
    if (produitsActifs.some(p => p.nom === produit.nom)) {
      console.log(`  skip (existe déjà) : ${produit.nom}`);
      ignores++;
      continue;
    }
    const cheminImage = join(IMAGES, produit.image);
    let cle;
    try {
      cle = await uploaderImage(token, cheminImage);
    } catch (erreur) {
      console.error(`  ÉCHEC upload ${produit.image} : ${erreur.message}`);
      throw new Error(`Image introuvable ou invalide pour « ${produit.nom} » : ${produit.image}`);
    }
    await appel(token, '/api/produits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: produit.nom,
        categorieId: idCategorie(produit.categorie),
        prix: produit.prix,
        description: produit.description,
        imageCle: cle,
        stockQuantite: produit.stock,
      }),
    });
    console.log(`  créé : ${produit.nom} (${cle})`);
    crees++;
  }

  const residus = produitsActifs.filter(p => !nomsCatalogue.has(p.nom));
  for (const residu of residus) {
    await appel(token, `/api/produits/${residu.id}`, { method: 'DELETE' });
    console.log(`  archivé (résidu) : ${residu.nom}`);
  }

  console.log(`\nTerminé : ${crees} créé(s), ${ignores} ignoré(s), ${residus.length} archivé(s).`);
};

main().catch(erreur => {
  console.error(`\nÉCHEC : ${erreur.message}`);
  process.exit(1);
});
