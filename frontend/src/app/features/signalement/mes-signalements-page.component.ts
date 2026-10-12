import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SignalementService } from './signalement.service';
import { MouvementPoints, Signalement, SoldePoints } from '../../shared/models/api';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent, StatusBadgeComponent, IconComponent, FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container signalements-page">
      <header class="entete">
        <div>
          <p class="eyebrow">Engagement citoyen</p>
          <h1>Mes signalements & Points</h1>
        </div>
        <a routerLink="/signalements/nouveau" appButton>
          <app-icon name="plus" [size]="20" />
          <span>Signaler un dépôt</span>
        </a>
      </header>

      <!-- Cartes compteurs / Solde -->
      <div class="grille-compteurs">
        <div class="carte-points">
          <div class="points-valeur">
            <span class="icone-piece">🪙</span>
            <strong class="num">{{ solde().solde }}</strong>
            <span class="label">points cumulés</span>
          </div>
          <div class="points-reduction">
            Soit <strong>{{ solde().solde * 100 | fcfa }}</strong> de réduction sur vos commandes
          </div>
        </div>

        <div class="carte-stat">
          <strong class="num">{{ signalements().length }}</strong>
          <span>Signalement(s) déclaré(s)</span>
        </div>

        <div class="carte-stat">
          <strong class="num">{{ nbValides() }}</strong>
          <span>Validé(s) (+{{ nbValides() * 10 }} pts)</span>
        </div>
      </div>

      <!-- Navigation onglets -->
      <div class="onglets">
        <button type="button" class="onglet" [class.actif]="ongletActif() === 'signalements'" (click)="ongletActif.set('signalements')">
          Mes signalements ({{ signalements().length }})
        </button>
        <button type="button" class="onglet" [class.actif]="ongletActif() === 'points'" (click)="ongletActif.set('points')">
          Historique des points
        </button>
      </div>

      <!-- Contenu Onglet Signalements -->
      @if (ongletActif() === 'signalements') {
        @if (chargement()) {
          <app-skeleton [lignes]="4" />
        } @else if (erreur()) {
          <app-error-state type="reseau" [reessayable]="true" (reessayer)="charger()" />
        } @else if (!signalements().length) {
          <app-empty-state message="Vous n'avez pas encore effectué de signalement de dépôt de pneus.">
            <a routerLink="/signalements/nouveau" appButton="secondary">Faire mon premier signalement</a>
          </app-empty-state>
        } @else {
          <div class="liste-signalements">
            @for (item of signalements(); track item.id) {
              <article class="carte-signalement">
                <div class="signalement-photos">
                  @if (item.photos && item.photos.length > 0) {
                    <img [src]="urlImage(item.photos[0].cle)" alt="Photo signalement" class="photo-principale" />
                    @if (item.photos.length > 1) {
                      <span class="badge-nb-photos">+{{ item.photos.length - 1 }}</span>
                    }
                  } @else {
                    <div class="sans-photo"><app-icon name="image" [size]="24" /></div>
                  }
                </div>

                <div class="signalement-corps">
                  <div class="signalement-haut">
                    <span class="zone-badge"><app-icon name="map-pin" [size]="16" /> {{ item.zoneNom }}</span>
                    <app-status-badge [code]="item.statut" />
                  </div>

                  <p class="description">{{ item.description }}</p>

                  @if (item.statut === 'REJETE' && item.motifRejet) {
                    <div class="motif-rejet">
                      <app-icon name="alert-circle" [size]="16" /> Motif du rejet : {{ item.motifRejet }}
                    </div>
                  }

                  <div class="signalement-bas">
                    <span class="date">{{ item.dateCreation | date:'d MMMM y à HH:mm':'':'fr' }}</span>
                    @if (item.latitude !== null && item.longitude !== null) {
                      <span class="coordonnees">{{ item.latitude.toFixed(4) }}, {{ item.longitude.toFixed(4) }}</span>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      }

      <!-- Contenu Onglet Historique Points -->
      @if (ongletActif() === 'points') {
        @if (chargement()) {
          <app-skeleton [lignes]="4" />
        } @else if (!mouvements().length) {
          <app-empty-state message="Aucun mouvement de points pour le moment." />
        } @else {
          <div class="table-responsive">
            <table class="table-mouvements">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opération</th>
                  <th>Points</th>
                  <th>Nouveau solde</th>
                </tr>
              </thead>
              <tbody>
                @for (mvt of mouvements(); track mvt.id) {
                  <tr>
                    <td>{{ mvt.dateCreation | date:'d MMM y à HH:mm':'':'fr' }}</td>
                    <td>
                      <span class="type-mvt" [class]="'type--' + mvt.type.toLowerCase()">
                        {{ libelleMouvement(mvt.type) }}
                      </span>
                    </td>
                    <td>
                      <strong [class.gain]="mvt.points > 0" [class.perte]="mvt.points < 0">
                        {{ mvt.points > 0 ? '+' : '' }}{{ mvt.points }} pts
                      </strong>
                    </td>
                    <td>{{ mvt.soldeApres }} pts</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .signalements-page { padding-block: var(--space-6); display: grid; gap: var(--space-5); }
    .entete { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; }
    .eyebrow { color: var(--color-primary); font-weight: 600; font-size: 14px; margin: 0; }
    .entete h1 { margin: 4px 0 0; font-size: 26px; }

    .grille-compteurs { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--space-3); }
    @media (max-width: 640px) { .grille-compteurs { grid-template-columns: 1fr; } }
    .carte-points {
      display: grid; gap: var(--space-2); padding: var(--space-4);
      background: linear-gradient(135deg, var(--color-primary-strong) 0%, var(--color-primary-muted) 100%); color: var(--color-text-on-dark); border-radius: var(--radius-md);
    }
    .points-valeur { display: flex; align-items: baseline; gap: var(--space-2); }
    .icone-piece { font-size: 24px; }
    .carte-points .num { font-size: 32px; line-height: 1; }
    .carte-points .label { font-size: 15px; opacity: 0.9; }
    .points-reduction { font-size: 14px; opacity: 0.95; }
    .carte-stat {
      display: grid; gap: var(--space-1); align-content: center; text-align: center;
      padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
    }
    .carte-stat .num { font-size: 28px; color: var(--color-chiffre); line-height: 1; }
    .carte-stat span { font-size: 13px; color: var(--color-text-muted); }
    .onglets { display: flex; gap: var(--space-2); border-bottom: 2px solid var(--color-border); }
    .onglet {
      padding: var(--space-3) var(--space-4); background: none; border: none; font: inherit; font-weight: 600;
      color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
    }
    .onglet.actif { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    .liste-signalements { display: grid; gap: var(--space-3); }
    .carte-signalement {
      display: grid; grid-template-columns: 140px 1fr; gap: var(--space-4);
      padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
    }
    @media (max-width: 480px) { .carte-signalement { grid-template-columns: 1fr; } }
    .signalement-photos { position: relative; aspect-ratio: 4/3; border-radius: var(--radius-sm); overflow: hidden; background: var(--color-surface-alt); }
    .photo-principale { width: 100%; height: 100%; object-fit: cover; }
    .badge-nb-photos {
      position: absolute; bottom: 6px; right: 6px; padding: 2px 6px;
      background: rgba(0,0,0,0.7); color: var(--color-text-on-dark); font-size: 11px; font-weight: 600; border-radius: 4px;
    }
    .sans-photo { display: grid; place-items: center; width: 100%; height: 100%; color: var(--color-text-muted); }
    .signalement-corps { display: grid; gap: var(--space-2); align-content: start; }
    .signalement-haut { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .zone-badge { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 14px; }
    .description { margin: 0; font-size: 14px; color: var(--color-text); line-height: 1.5; }
    .motif-rejet {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3); background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius-sm); font-size: 13px;
    }
    .signalement-bas { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-muted); }
    .table-responsive { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .table-mouvements { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; background: var(--color-surface); }
    .table-mouvements th, .table-mouvements td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
    .table-mouvements th { background: var(--color-surface-alt); font-weight: 600; }
    .type-mvt { font-weight: 600; }
    .gain { color: var(--color-success); }
    .perte { color: var(--color-error); }
  `
})
export class MesSignalementsPageComponent {
  private signalementService = inject(SignalementService);

  protected signalements = signal<Signalement[]>([]);
  protected mouvements = signal<MouvementPoints[]>([]);
  protected solde = signal<SoldePoints>({ solde: 0 });
  protected chargement = signal(true);
  protected erreur = signal(false);
  protected ongletActif = signal<'signalements' | 'points'>('signalements');

  constructor() {
    this.charger();
  }

  protected nbValides(): number {
    return this.signalements().filter(s => s.statut === 'VALIDE').length;
  }

  protected urlImage(cle: string): string {
    return `${environment.apiUrl}/images/${cle}`;
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(false);

    this.signalementService.getSoldePoints().subscribe({
      next: res => this.solde.set(res),
      error: () => {}
    });

    this.signalementService.mesSignalements().subscribe({
      next: res => {
        this.signalements.set(res.content || []);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      }
    });

    this.signalementService.getMouvementsPoints().subscribe({
      next: res => this.mouvements.set(res.content || []),
      error: () => {}
    });
  }

  protected libelleMouvement(type: string): string {
    switch (type) {
      case 'GAIN': return 'Gain (Signalement validé)';
      case 'UTILISATION': return 'Utilisé sur commande';
      case 'ANNULATION': return 'Annulation';
      default: return type;
    }
  }
}
