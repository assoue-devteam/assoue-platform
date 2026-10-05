import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NetworkService } from '../network.service';
import { CompteMenuComponent } from './compte-menu.component';
import { SiteFooterComponent } from './site-footer.component';
import { AlertComponent } from '../../shared/ui/alert.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ClickOutsideDirective, estDefilementFermant } from '../../shared/ui/click-outside.directive';
import { PopupService } from '../../shared/ui/popup.service';
import { PanierService } from '../../features/catalogue/panier.service';
import { FavorisService } from '../../features/catalogue/favoris.service';
import { RechercheProduitComponent } from '../../features/catalogue/recherche-produit.component';

@Component({
  selector: 'app-boutique-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CompteMenuComponent, AlertComponent, IconComponent, SiteFooterComponent, RechercheProduitComponent, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header #entete class="entete" [class.entete--repliee]="repliee()">
      <div class="container entete__ligne">
        <a routerLink="/" class="logo"><img src="logo-assoue.png" alt="AS'SOUÉ, accueil de la boutique" width="119" height="44" /></a>

        <div class="entete__recherche entete__recherche--bureau">
          <app-recherche-produit />
        </div>

        <div class="entete__actions">
          <a routerLink="/favoris" routerLinkActive="actif" class="entete__icone" aria-label="Mes favoris">
            <app-icon name="heart" /> <span class="entete__libelle">Favoris</span>
            @if (favoris.produits().length) { <span class="entete__compteur">{{ favoris.produits().length }}</span> }
          </a>
          <a routerLink="/panier" routerLinkActive="actif" class="entete__icone" aria-label="Panier">
            <app-icon name="shopping-bag" /> <span class="entete__libelle">Panier</span>
            @if (panier.nombreArticles()) { <span class="entete__compteur">{{ panier.nombreArticles() }}</span> }
          </a>
          @if (auth.connecte()) {
            <app-compte-menu />
          } @else {
            <a routerLink="/connexion" class="entete__connexion">Se connecter</a>
          }
          <button type="button" #boutonRecherche class="entete__recherche-bouton" [attr.aria-expanded]="rechercheOuverte()"
                  aria-controls="recherche-mobile" (click)="basculerRecherche()" aria-label="Rechercher un produit">
            <app-icon name="search" />
          </button>
          <button type="button" #boutonBurger class="entete__menu" [attr.aria-expanded]="menuOuvert()"
                  aria-controls="menu-burger" (click)="basculerBurger()">
            <app-icon name="menu" /> Menu
          </button>
        </div>
      </div>

      <div class="container entete__recherche entete__recherche--tablette">
        <app-recherche-produit />
      </div>
      @if (rechercheOuverte()) {
        <div class="container entete__recherche entete__recherche--mobile" id="recherche-mobile"
             [appClickOutsideEnabled]="rechercheOuverte()" (appClickOutside)="fermerRechercheDepuisExterieur($event)"
             (focusout)="fermerRechercheSiFocusSorti($event)">
          <app-recherche-produit />
        </div>
      }

      <div class="entete__secondaire">
        <nav class="container entete__nav" aria-label="Navigation principale">
          <a routerLink="/" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }">Catalogue</a>
          <a routerLink="/notre-impact" routerLinkActive="actif">Notre impact</a>
          <a routerLink="/communaute" routerLinkActive="actif">Communauté</a>
        </nav>
      </div>

      @if (menuOuvert()) {
        <nav id="menu-burger" class="container entete__panneau" aria-label="Menu"
             [appClickOutsideEnabled]="menuOuvert()" (appClickOutside)="fermerBurgerDepuisExterieur($event)"
             (focusout)="fermerBurgerSiFocusSorti($event)">
          <a routerLink="/" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }" (click)="fermerBurger()">Catalogue</a>
          <a routerLink="/notre-impact" routerLinkActive="actif" (click)="fermerBurger()">Notre impact</a>
          <a routerLink="/communaute" routerLinkActive="actif" (click)="fermerBurger()">Communauté</a>
          @if (!auth.connecte()) {
            <a routerLink="/connexion" (click)="fermerBurger()">Se connecter</a>
          }
        </nav>
      }
    </header>

    @if (!reseau.enLigne()) {
      <app-alert tone="warning" [banner]="true">Pas de connexion. Le catalogue affiché peut être ancien.</app-alert>
    }

    <main id="contenu"><router-outlet /></main>
    <app-site-footer />
  `,
  styles: `
    .entete {
      position: sticky; top: 0; z-index: 30;
      background: var(--color-surface); border-bottom: 1px solid var(--color-border);
    }
    .entete__ligne { display: flex; align-items: center; gap: var(--space-4); min-height: 64px; }
    .logo { display: inline-flex; align-items: center; min-height: 44px; flex: none; }
    .logo img { height: 44px; width: auto; }
    .entete__recherche--bureau { flex: 1; max-width: 640px; margin-inline: auto; }
    .entete__recherche--tablette, .entete__recherche--mobile { display: none; padding-bottom: var(--space-3); }
    .entete__actions { display: flex; align-items: center; gap: var(--space-1); margin-left: auto; flex: none; }
    .entete__icone, .entete__connexion {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; padding-inline: var(--space-2);
      color: var(--color-text); text-decoration: none; font-weight: 600; border-radius: var(--radius-sm);
    }
    .entete__icone.actif { color: var(--color-primary); box-shadow: inset 0 -2px var(--color-primary); }
    .entete__compteur { display:inline-grid; place-items:center; min-width:20px; height:20px; padding-inline:4px; border-radius:var(--radius-sm); background:var(--color-primary-strong); color:var(--color-text-on-dark); font-size:13px; font-variant-numeric:tabular-nums; }
    .entete__recherche-bouton, .entete__menu {
      display: none; align-items: center; gap: var(--space-1); min-height: 44px; min-width: 44px; justify-content: center; padding: 0 var(--space-2);
      border: 0; background: none; color: var(--color-text); font: 600 15px var(--font-text); cursor: pointer; border-radius: var(--radius-sm);
    }
    /* Rangée secondaire : repliée au scroll (seule la rangée ~64px reste), sans transition si réduite. */
    .entete__secondaire { display: grid; grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows .2s ease, opacity .2s ease; }
    .entete__secondaire > nav { overflow: hidden; }
    .entete--repliee .entete__secondaire { grid-template-rows: 0fr; opacity: 0; }
    .entete__nav { display: flex; gap: var(--space-4); padding-bottom: var(--space-2); }
    .entete__nav a { color: var(--color-text); text-decoration: none; font-weight: 600; min-height: 32px; display: inline-flex; align-items: center; }
    .entete__nav a.actif { color: var(--color-primary); box-shadow: inset 0 -2px var(--color-primary); }
    .entete__panneau { display: none; }
    .entete__recherche-bouton:focus-visible, .entete__menu:focus-visible, .entete__panneau a:focus-visible {
      outline: none; box-shadow: var(--focus-ring);
    }
    @media (prefers-reduced-motion: reduce) { .entete__secondaire { transition: none; } }
    @media (max-width: 1023px) {
      .entete__recherche--bureau, .entete__secondaire { display: none; }
      .entete__recherche--tablette { display: block; }
      .entete__menu { display: inline-flex; }
      .entete__panneau { display: flex; flex-direction: column; padding-bottom: var(--space-2); }
      .entete__panneau a { display: inline-flex; align-items: center; min-height: 44px; color: var(--color-text); text-decoration: none; font-weight: 600; }
    }
    @media (max-width: 767px) {
      .logo img { height: 36px; }
      .entete__libelle { display: none; }
      .entete__connexion { display: none; }
      .entete__recherche--tablette { display: none; }
      .entete__recherche-bouton { display: inline-flex; }
      .entete__recherche--mobile { display: block; }
    }
  `,
})
export class BoutiqueLayoutComponent {
  protected auth = inject(AuthService);
  protected reseau = inject(NetworkService);
  protected panier = inject(PanierService);
  protected favoris = inject(FavorisService);
  private router = inject(Router);
  private popups = inject(PopupService);
  private boutonBurger = viewChild<ElementRef<HTMLButtonElement>>('boutonBurger');
  private boutonRecherche = viewChild<ElementRef<HTMLButtonElement>>('boutonRecherche');
  private entete = viewChild<ElementRef<HTMLElement>>('entete');
  protected menuOuvert = signal(false);
  protected rechercheOuverte = signal(false);
  protected repliee = signal(false);

  constructor() {
    // Un seul panneau ouvert à la fois : le menu compte signale son ouverture.
    effect(() => {
      const courant = this.popups.ouvert();
      if (courant === null) return;
      if (courant !== 'burger' && this.menuOuvert()) this.fermerBurger();
      if (courant !== 'recherche-mobile' && this.rechercheOuverte()) this.fermerRecherche();
    });
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => {
        this.fermerBurger();
        this.fermerRecherche();
      });
  }

  protected basculerBurger(): void {
    if (this.menuOuvert()) this.fermerBurger();
    else {
      this.fermerRecherche();
      this.menuOuvert.set(true);
      this.popups.signalerOuverture('burger');
    }
  }

  protected fermerBurger(): void {
    if (!this.menuOuvert()) return;
    this.menuOuvert.set(false);
    this.popups.signalerFermeture('burger');
  }

  /** Le bouton burger est hors du panneau : on l’ignore, c’est lui qui bascule. */
  protected fermerBurgerDepuisExterieur(event: PointerEvent | KeyboardEvent): void {
    if (!this.menuOuvert()) return;
    if (event instanceof PointerEvent && this.boutonBurger()?.nativeElement.contains(event.target as Node)) return;
    this.fermerBurger();
    if (event instanceof KeyboardEvent) this.boutonBurger()?.nativeElement.focus();
  }

  protected fermerBurgerSiFocusSorti(event: FocusEvent): void {
    const cible = event.relatedTarget as Node | null;
    if (!cible || !(event.currentTarget as HTMLElement).contains(cible)) this.fermerBurger();
  }

  protected basculerRecherche(): void {
    if (this.rechercheOuverte()) this.fermerRecherche();
    else {
      this.fermerBurger();
      this.rechercheOuverte.set(true);
      this.popups.signalerOuverture('recherche-mobile');
    }
  }

  protected fermerRecherche(): void {
    if (!this.rechercheOuverte()) return;
    this.rechercheOuverte.set(false);
    this.popups.signalerFermeture('recherche-mobile');
  }

  protected fermerRechercheDepuisExterieur(event: PointerEvent | KeyboardEvent): void {
    if (!this.rechercheOuverte()) return;
    if (event instanceof PointerEvent && this.boutonRecherche()?.nativeElement.contains(event.target as Node)) return;
    this.fermerRecherche();
    if (event instanceof KeyboardEvent) this.boutonRecherche()?.nativeElement.focus();
  }

  protected fermerRechercheSiFocusSorti(event: FocusEvent): void {
    const cible = event.relatedTarget as Node | null;
    if (!cible || !(event.currentTarget as HTMLElement).contains(cible)) this.fermerRecherche();
  }

  @HostListener('window:scroll', ['$event'])
  surDefilement(event: Event): void {
    this.repliee.set(window.scrollY > 120);
    // Le header se replie : les panneaux ouverts se ferment avec lui, sauf si le
    // scroll vient de l'intérieur ou que le focus y est (clavier mobile dans la recherche).
    const zone = this.entete()?.nativeElement;
    if (zone && !estDefilementFermant(event, zone)) return;
    this.fermerBurger();
    this.fermerRecherche();
  }
}
