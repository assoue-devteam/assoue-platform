import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';

// Coordonnées et réseaux repris de la plaquette AS'SOUÉ 2026.
const RESEAUX = [
  { nom: 'Facebook', url: 'https://www.facebook.com/AssoueAfricanStyle' },
  { nom: 'Instagram', url: 'https://www.instagram.com/assoue226' },
  { nom: 'TikTok', url: 'https://www.tiktok.com/@assoue226' },
  { nom: 'LinkedIn', url: 'https://www.linkedin.com/company/as-sou%C3%A9-group/' },
];

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container footer__grille">
        <div class="footer__marque">
          <a routerLink="/" class="footer__logo"><img src="logo-assoue.png" alt="AS'SOUÉ, retour à la boutique" width="160" height="59" loading="lazy" /></a>
          <p>L'art du recyclage pour un avenir durable</p>
        </div>

        <div>
          <h2>Boutique</h2>
          <ul>
            <li><a routerLink="/">Catalogue</a></li>
            <li><a routerLink="/notre-impact">Notre impact</a></li>
            <li><a routerLink="/communaute">Communauté</a></li>
            <li><a routerLink="/panier">Panier</a></li>
            <li><a routerLink="/commandes">Mes commandes</a></li>
          </ul>
        </div>

        <div>
          <h2>Nous trouver</h2>
          <ul>
            <li><strong>Siège</strong><br />Ouagadougou, Zone 1</li>
            <li><strong>Boutique vitrine</strong><br />ZAD, avenue de la Jeunesse, Ouagadougou</li>
          </ul>
        </div>

        <div>
          <h2>Contact</h2>
          <ul>
            <li><a href="tel:+22672480002"><app-icon name="phone" [size]="16" /> +226 72 48 00 02</a></li>
            <li><a href="https://wa.me/22654958282" target="_blank" rel="noopener noreferrer"><app-icon name="message-circle" [size]="16" /> WhatsApp 54 95 82 82</a></li>
            <li><a href="mailto:assouegroup@gmail.com"><app-icon name="mail" [size]="16" /> assouegroup&#64;gmail.com</a></li>
          </ul>
        </div>

        <div>
          <h2>Suivez-nous</h2>
          <ul>
            @for (reseau of reseaux; track reseau.nom) {
              <!-- Liens texte : le registre d'icônes (Lucide, hors ligne) ne fournit pas d'icônes de marques. -->
              <li><a [href]="reseau.url" target="_blank" rel="noopener noreferrer">{{ reseau.nom }}<span class="sr-only"> (nouvel onglet)</span></a></li>
            }
          </ul>
        </div>
      </div>
      <div class="container"><p class="footer__bas">© {{ annee }} AS'SOUÉ Group · Ouagadougou, Burkina Faso · <span class="mention" title="Page en préparation">Mentions légales [bientôt]</span> · <span class="mention" title="Page en préparation">CGV [bientôt]</span></p></div>
    </footer>
  `,
  styles: `
    .footer {
      margin-top: var(--space-8); padding-block: 24px 16px;
      background: var(--color-surface-dark); color: var(--color-text-on-dark);
      border-top: 4px solid var(--color-logo);
    }
    /* Colonnes : 1 par défaut, 2 dès 640px, 5 dès 1024px. min-width:0 : aucun lien coupé. */
    .footer__grille { display: grid; gap: var(--space-4) var(--space-5); grid-template-columns: 1fr; }
    .footer__grille > div { min-width: 0; }
    @media (min-width: 640px) { .footer__grille { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .footer__grille { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
    .footer__marque { display: grid; gap: var(--space-2); align-content: start; }
    .footer__logo { justify-self: start; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); background: var(--color-surface); }
    .footer__logo img { width: 140px; height: auto; }
    .footer__marque p { color: rgba(255, 255, 255, .78); font-style: italic; font-size: 14px; }
    h2 { margin-bottom: var(--space-2); font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: rgba(255, 255, 255, .7); }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-1); }
    li { overflow-wrap: anywhere; font-size: 14px; }
    li strong { color: var(--color-text-on-dark); }
    a { display: inline-flex; align-items: center; gap: var(--space-2); min-height: 32px; color: inherit; font-size: 14px; text-decoration: none; text-underline-offset: 3px; }
    a:hover { color: var(--color-primary-tint); text-decoration: underline; }
    a:focus-visible { outline: 2px solid var(--color-surface); outline-offset: 2px; text-decoration: underline; }
    .footer__logo:focus-visible { outline-color: var(--color-vif); }
    .footer__bas { margin-top: var(--space-4); padding-top: var(--space-3); padding-bottom: var(--space-2); border-top: 1px solid rgba(255, 255, 255, .16); font-size: 13px; color: rgba(255, 255, 255, .7); }
    .mention { white-space: nowrap; }
  `,
})
export class SiteFooterComponent {
  protected readonly reseaux = RESEAUX;
  protected readonly annee = new Date().getFullYear();
}
