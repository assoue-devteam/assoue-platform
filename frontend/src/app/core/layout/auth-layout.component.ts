import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

// Layout des pages d'authentification : volontairement dépouillé (pas de navigation, ni panier,
// ni recherche) pour concentrer sur la connexion. Le footer tient sur une ligne : les pages
// légales n'existent pas encore, donc du texte désactivé + note [bientôt] plutôt qu'un lien
// vers une 404 (app-gap-note est réservé à la maquette d'après le design system, non implémenté).
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="auth-entete">
      <a routerLink="/" class="logo" aria-label="AS'SOUÉ, retour à la boutique">
        <img src="logo-assoue.png" alt="AS'SOUÉ" width="119" height="44" />
      </a>
    </header>
    <main id="contenu"><router-outlet /></main>
    <footer class="auth-pied">
      <span class="mention" title="Page en préparation">Mentions légales <span class="bientot">[bientôt]</span></span>
      <span class="separateur" aria-hidden="true">|</span>
      <span class="mention" title="Page en préparation">Confidentialité <span class="bientot">[bientôt]</span></span>
      <span class="separateur" aria-hidden="true">|</span>
      <span class="mention" title="Page en préparation">Support <span class="bientot">[bientôt]</span></span>
      <span class="separateur" aria-hidden="true">|</span>
      <span>© 2026 AS'SOUÉ</span>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; background: var(--color-bg); }
    .auth-entete { background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
    .logo { display: inline-flex; align-items: center; min-height: 44px; margin-left: var(--space-4); }
    .logo img { height: 44px; width: auto; }
    main { flex: 1; }
    .auth-pied {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
      gap: var(--space-2) var(--space-3); padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-border); background: var(--color-surface);
      font-size: 13px; color: var(--color-text-muted); text-align: center;
    }
    .mention { color: var(--color-text-muted); }
    .bientot { font-size: 12px; }
    .separateur { color: var(--color-border-strong); }
  `,
})
export class AuthLayoutComponent {}
