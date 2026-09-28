import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/guards';
import { BoutiqueLayoutComponent } from './core/layout/boutique-layout.component';

// Routes du design system §7. Chaque écran pointe vers PageProvisoireComponent tant que
// la piste concernée ne l'a pas réalisé : remplacer loadComponent par le vrai composant.
const provisoire = () => import('./shared/pages/pages').then(m => m.PageProvisoireComponent);

export const routes: Routes = [
  {
    path: '',
    component: BoutiqueLayoutComponent,
    children: [
      // Piste A — Boutique (public)
      { path: '', loadComponent: provisoire, data: { titre: 'Catalogue' }, title: "AS'SOUÉ" },
      { path: 'produits/:id', loadComponent: provisoire, data: { titre: 'Fiche produit' }, title: "Produit — AS'SOUÉ" },
      { path: 'panier', loadComponent: provisoire, data: { titre: 'Panier' }, title: "Panier — AS'SOUÉ" },
      { path: 'connexion', loadComponent: provisoire, data: { titre: 'Connexion' }, title: "Connexion — AS'SOUÉ" },
      { path: 'inscription', loadComponent: provisoire, data: { titre: 'Créer un compte' }, title: "Inscription — AS'SOUÉ" },

      // Piste B — Commandes et paiement (client)
      {
        path: 'commandes',
        canActivate: [roleGuard('CLIENT')],
        children: [
          { path: '', loadComponent: provisoire, data: { titre: 'Mes commandes' }, title: "Mes commandes — AS'SOUÉ" },
          { path: ':id', loadComponent: provisoire, data: { titre: 'Détail de commande' }, title: "Commande — AS'SOUÉ" },
          { path: ':id/paiement', loadComponent: provisoire, data: { titre: 'Paiement' }, title: "Paiement — AS'SOUÉ" },
        ],
      },

      {
        path: 'acces-refuse',
        loadComponent: () => import('./shared/pages/pages').then(m => m.PageAccesRefuseComponent),
        title: "Accès refusé — AS'SOUÉ",
      },
    ],
  },

  // Piste C — Collecteur (mobile, hors ligne)
  {
    path: 'collecte',
    canActivate: [roleGuard('COLLECTEUR')],
    loadComponent: () => import('./core/layout/collecteur-layout.component').then(m => m.CollecteurLayoutComponent),
    children: [
      { path: '', loadComponent: provisoire, data: { titre: 'Mes collectes' }, title: "Mes collectes — AS'SOUÉ" },
      { path: 'nouvelle', loadComponent: provisoire, data: { titre: 'Nouvelle déclaration' }, title: "Déclarer — AS'SOUÉ" },
      { path: ':id/modifier', loadComponent: provisoire, data: { titre: 'Corriger une déclaration' }, title: "Corriger — AS'SOUÉ" },
    ],
  },

  // Piste D — Gestion (rôle ADMIN, espace unique)
  {
    path: 'gestion',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./core/layout/gestion-layout.component').then(m => m.GestionLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'collectes' },
      { path: 'collectes', loadComponent: provisoire, data: { titre: 'Collectes' }, title: "Collectes — Gestion" },
      { path: 'commandes', loadComponent: provisoire, data: { titre: 'Commandes' }, title: "Commandes — Gestion" },
      { path: 'commandes/:id', loadComponent: provisoire, data: { titre: 'Détail de commande' }, title: "Commande — Gestion" },
      { path: 'stocks', loadComponent: provisoire, data: { titre: 'Stocks' }, title: "Stocks — Gestion" },
      { path: 'utilisateurs', loadComponent: provisoire, data: { titre: 'Utilisateurs' }, title: "Utilisateurs — Gestion" },
    ],
  },

  {
    path: '**',
    component: BoutiqueLayoutComponent,
    children: [{ path: '', loadComponent: () => import('./shared/pages/pages').then(m => m.PageIntrouvableComponent) }],
    title: "Page introuvable — AS'SOUÉ",
  },
];
