import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChiffreCommunaute, Evenement } from '../../shared/models/api';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SrcImagePipe } from '../../shared/images/src-image.pipe';
import { ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { CompteurDirective } from '../impact/notre-impact-page.component';
import { CommunauteService, estAVenir, lienParticipation } from './communaute.service';

@Component({
  standalone: true,
  imports: [DatePipe, IconComponent, SrcImagePipe, ErrorStateComponent, SkeletonComponent, CompteurDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="communaute container">
      <header class="intro">
        <h1 class="display">Communauté</h1>
        <p class="text-muted">Ateliers, rencontres et actualités d'AS'SOUÉ.</p>
      </header>

      @if (chiffres().length) {
        <div class="chiffres">
          @for (chiffre of chiffres(); track chiffre.libelle) {
            <div class="chiffre"><strong class="num" [appCompteur]="chiffre.valeur"></strong><span>{{ chiffre.libelle }}</span></div>
          }
        </div>
      }

      @if (chargement()) {
        <app-skeleton [lignes]="6" />
      } @else if (erreur()) {
        <app-error-state type="reseau" titre="Les événements ne sont pas disponibles" [reessayable]="true" (reessayer)="charger()" />
      } @else {
        <section class="bloc" aria-labelledby="titre-a-venir">
          <h2 id="titre-a-venir">Événements à venir</h2>
          @if (aVenir().length) {
            <div class="evenements">
              @for (evenement of aVenir(); track evenement.id) {
                <article class="evenement">
                  <div class="evenement__image">
                    @if (evenement.imageUrl) { <img [src]="evenement.imageUrl | srcImage" [alt]="evenement.titre" loading="lazy" /> }
                    @else { <app-icon name="users" [size]="24" /> }
                  </div>
                  <div class="evenement__contenu">
                    <h3>{{ evenement.titre }}</h3>
                    <p class="meta">
                      <span><app-icon name="clock" [size]="16" /> {{ evenement.dateDebut | date:'EEEE d MMMM y, HH:mm':'':'fr' }}</span>
                      <span><app-icon name="map-pin" [size]="16" /> {{ evenement.lieu }}</span>
                    </p>
                    @if (evenement.description) { <p class="text-muted description">{{ evenement.description }}</p> }
                    <div class="evenement__actions">
                      <a class="participer" [href]="lien(evenement)" target="_blank" rel="noopener">
                        <app-icon name="message-circle" [size]="20" /> Participer
                        @if (evenement.placesRestantes !== null) { <span>({{ evenement.placesRestantes }} places restantes)</span> }
                      </a>
                    </div>
                  </div>
                </article>
              }
            </div>
          } @else {
            <p class="vide text-muted">Aucun événement prévu pour le moment. Suivez-nous sur les réseaux sociaux pour être prévenu du prochain atelier.</p>
          }
        </section>

        @if (passes().length) {
          <section class="bloc" aria-labelledby="titre-passes">
            <h2 id="titre-passes">Événements passés</h2>
            <ul class="passes">
              @for (evenement of passes(); track evenement.id) {
                <li><strong>{{ evenement.titre }}</strong><span class="text-muted">{{ evenement.dateDebut | date:'d MMMM y':'':'fr' }} · {{ evenement.lieu }}</span></li>
              }
            </ul>
          </section>
        }
      }
    </section>
  `,
  styles: `
    .communaute { display: grid; gap: var(--space-6); padding-block: var(--space-7); }
    .intro { display: grid; gap: var(--space-2); }
    .chiffres { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); }
    .chiffre { display: grid; gap: var(--space-1); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); text-align: center; }
    .chiffre strong { font-size: 32px; line-height: 1.1; color: var(--color-chiffre); }
    .chiffre span { color: var(--color-text-muted); font-size: 14px; }
    .bloc { display: grid; gap: var(--space-4); }
    .evenements { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); }
    .evenement { display: grid; grid-template-rows: auto 1fr; overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .evenement__image { aspect-ratio: 16 / 9; display: grid; place-items: center; background: var(--color-primary-tint); color: var(--color-primary-strong); }
    .evenement__image img { width: 100%; height: 100%; object-fit: cover; }
    .evenement__contenu { display: grid; gap: var(--space-3); align-content: start; padding: var(--space-4); }
    .meta { display: grid; gap: var(--space-1); font-size: 14px; color: var(--color-text-muted); }
    .meta span { display: inline-flex; align-items: center; gap: var(--space-2); }
    .meta span:first-child::first-letter { text-transform: uppercase; }
    .description { white-space: pre-line; }
    .participer {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-4);
      border-radius: var(--radius-sm); background: var(--color-primary); color: var(--color-text-on-dark); font-weight: 600; text-decoration: none;
    }
    .participer:hover { background: var(--color-primary-strong); }
    .participer:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .participer span { font-weight: 400; opacity: .9; }
    .vide { padding: var(--space-5); border: 1px dashed var(--color-border-strong); border-radius: var(--radius-md); }
    .passes { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
    .passes li { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-border); }
  `,
})
export class CommunautePageComponent {
  private service = inject(CommunauteService);
  protected evenements = signal<Evenement[]>([]);
  protected chiffres = signal<ChiffreCommunaute[]>([]);
  protected chargement = signal(true);
  protected erreur = signal(false);
  protected aVenir = computed(() => this.evenements().filter(evenement => estAVenir(evenement)));
  protected passes = computed(() => this.evenements().filter(evenement => !estAVenir(evenement)).reverse());
  protected readonly lien = lienParticipation;

  constructor() {
    this.charger();
    // Sans chiffres, la page reste utile : leur échec ne bloque pas les événements.
    this.service.chiffres().subscribe({ next: chiffres => this.chiffres.set(chiffres), error: () => {} });
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.service.evenements().subscribe({
      next: evenements => { this.evenements.set(evenements); this.chargement.set(false); },
      error: () => { this.erreur.set(true); this.chargement.set(false); },
    });
  }
}
