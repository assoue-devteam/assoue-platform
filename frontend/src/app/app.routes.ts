import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/guards';
import { BoutiqueLayoutComponent } from './core/layout/boutique-layout.component';

// Routes du design system §7. Les écrans non réalisés restent provisoires jusqu'à leur phase.
const provisoire = () => import('./shared/pages/pages').then(m => m.PageProvisoireComponent);

export const routes: Routes = [
  {
    path: '',
    component: BoutiqueLayoutComponent,
    children: [
      // Piste A — Boutique (public)
      { path: '', loadComponent: () => import('./features/catalogue/catalogue-page.component').then(m => m.CataloguePageComponent), title: "AS'SOUÉ" },
      { path: 'produits/:id', loadComponent: () => import('./features/catalogue/produit-page.component').then(m => m.ProduitPageComponent), title: "Produit — AS'SOUÉ" },
      { path: 'panier', loadComponent: () => import('./features/catalogue/panier-page.component').then(m => m.PanierPageComponent), title: "Panier — AS'SOUÉ" },
      { path: 'connexion', loadComponent: () => import('./features/auth/connexion-page.component').then(m => m.ConnexionPageComponent), title: "Connexion — AS'SOUÉ" },
      { path: 'inscription', loadComponent: () => import('./features/auth/inscription-page.component').then(m => m.InscriptionPageComponent), title: "Inscription — AS'SOUÉ" },

      // Piste B — Commandes et paiement (client)
      {
        path: 'commandes',
        canActivate: [roleGuard('CLIENT')],
        children: [
          { path: '', loadComponent: () => import('./features/commande/mes-commandes-page.component').then(m => m.MesCommandesPageComponent), title: "Mes commandes — AS'SOUÉ" },
          { path: ':id', loadComponent: () => import('./features/commande/commande-detail-page.component').then(m => m.CommandeDetailPageComponent), title: "Commande — AS'SOUÉ" },
          { path: ':id/paiement', loadComponent: () => import('./features/commande/paiement-page.component').then(m => m.PaiementPageComponent), title: "Paiement — AS'SOUÉ" },
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
      { path: '', loadComponent: () => import('./features/collecte/mes-collectes-page.component').then(m => m.MesCollectesPageComponent), title: "Mes collectes — AS'SOUÉ" },
      { path: 'nouvelle', loadComponent: () => import('./features/collecte/collecte-form-page.component').then(m => m.CollecteFormPageComponent), title: "Déclarer — AS'SOUÉ" },
      { path: ':id/modifier', loadComponent: () => import('./features/collecte/collecte-form-page.component').then(m => m.CollecteFormPageComponent), title: "Corriger — AS'SOUÉ" },
    ],
  },

  // Piste D — Gestion (rôle ADMIN, espace unique)
  {
    path: 'gestion',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./core/layout/gestion-layout.component').then(m => m.GestionLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'collectes' },
      { path: 'collectes', loadComponent: () => import('./features/admin/gestion-collectes-page.component').then(m => m.GestionCollectesPageComponent), title: "Collectes — Gestion" },
      { path: 'commandes', loadComponent: () => import('./features/admin/gestion-commandes-page.component').then(m => m.GestionCommandesPageComponent), title: "Commandes — Gestion" },
      { path: 'commandes/:id', loadComponent: () => import('./features/admin/gestion-commande-detail-page.component').then(m => m.GestionCommandeDetailPageComponent), title: "Commande — Gestion" },
      { path: 'stocks', loadComponent: () => import('./features/admin/gestion-stocks-page.component').then(m => m.GestionStocksPageComponent), title: "Stocks — Gestion" },
      { path: 'utilisateurs', loadComponent: () => import('./features/admin/gestion-utilisateurs-page.component').then(m => m.GestionUtilisateursPageComponent), title: "Utilisateurs — Gestion" },
    ],
  },

  {
    path: '**',
    component: BoutiqueLayoutComponent,
    children: [{ path: '', loadComponent: () => import('./shared/pages/pages').then(m => m.PageIntrouvableComponent) }],
    title: "Page introuvable — AS'SOUÉ",
  },
];
