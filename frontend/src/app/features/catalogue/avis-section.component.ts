import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { messageErreur } from '../../core/http/erreurs';
import { Avis, AvisProduit, MonAvis } from '../../shared/models/api';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { EtoilesComponent } from '../../shared/ui/etoiles.component';
import { ToastService } from '../../shared/ui/toast';

@Component({
  selector: 'app-avis-section',
  standalone: true,
  imports: [DatePipe, FormsModule, AlertComponent, ButtonDirective, EtoilesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="avis" aria-labelledby="titre-avis">
      <div class="avis__entete">
        <h2 id="titre-avis">Avis clients</h2>
        <app-etoiles [note]="liste()?.moyenne ?? null" [nombre]="liste()?.nombre ?? 0" />
      </div>

      @if (mien()?.peutDonnerAvis) {
        <form class="formulaire" (ngSubmit)="envoyer()">
          <fieldset>
            <legend>{{ mien()?.monAvis ? 'Modifier votre avis' : 'Votre avis' }}</legend>
            <div class="choix-note" role="radiogroup" aria-label="Note sur 5">
              @for (valeur of [1, 2, 3, 4, 5]; track valeur) {
                <label [class.allumee]="valeur <= note()">
                  <input type="radio" name="note" [value]="valeur" [checked]="note() === valeur" (change)="note.set(valeur)" />
                  <span aria-hidden="true">★</span><span class="sr-only">{{ valeur }} sur 5</span>
                </label>
              }
            </div>
            <label for="commentaire-avis">Commentaire (facultatif)</label>
            <textarea id="commentaire-avis" name="commentaire" rows="3" maxlength="1000" [(ngModel)]="commentaire"></textarea>
          </fieldset>
          @if (erreurNote()) { <app-alert tone="error">Choisissez une note de 1 à 5 étoiles.</app-alert> }
          <button type="submit" appButton="primary" [loading]="envoi()">Publier mon avis</button>
        </form>
      } @else if (mien()) {
        <p class="text-muted">Vous pourrez donner votre avis après avoir acheté et payé ce produit.</p>
      }

      @if (liste(); as donnees) {
        @if (donnees.avis.length) {
          <ul class="liste">
            @for (avis of donnees.avis; track $index) {
              <li>
                <div class="liste__tete"><strong>{{ avis.auteur }}</strong><app-etoiles [note]="avis.note" [nombre]="1" [seule]="true" /></div>
                @if (avis.commentaire) { <p>{{ avis.commentaire }}</p> }
                <span class="text-caption">{{ avis.date | date:'d MMMM y':'':'fr' }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="text-muted">Pas encore d'avis sur ce produit.</p>
        }
      }
    </section>
  `,
  styles: `
    .avis { display: grid; gap: var(--space-4); padding-top: var(--space-6); border-top: 1px solid var(--color-border); }
    .avis__entete { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-3); }
    .formulaire { display: grid; gap: var(--space-3); max-width: 560px; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    fieldset { display: grid; gap: var(--space-2); margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: var(--space-2); font-weight: 600; }
    .choix-note { display: flex; gap: var(--space-1); }
    .choix-note label { position: relative; display: grid; place-items: center; width: 44px; height: 44px; font-size: 30px; line-height: 1; color: var(--color-border-strong); cursor: pointer; }
    .choix-note label.allumee { color: var(--color-accent-soft); }
    .choix-note input { position: absolute; opacity: 0; }
    .choix-note label:has(input:focus-visible) { border-radius: var(--radius-sm); box-shadow: var(--focus-ring); }
    textarea { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); font: 400 16px var(--font-text); resize: vertical; }
    .formulaire button { justify-self: start; }
    .liste { display: grid; gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
    .liste li { display: grid; gap: var(--space-1); padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); }
    .liste__tete { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
  `,
})
export class AvisSectionComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toasts = inject(ToastService);

  readonly produitId = input.required<number>();
  protected liste = signal<AvisProduit | null>(null);
  protected mien = signal<MonAvis | null>(null);
  protected note = signal(0);
  protected commentaire = '';
  protected envoi = signal(false);
  protected erreurNote = signal(false);

  constructor() {
    effect(() => {
      const id = this.produitId();
      untracked(() => this.charger(id));
    });
  }

  private url(id: number): string {
    return `${environment.apiUrl}/produits/${id}/avis`;
  }

  private charger(id: number): void {
    this.http.get<AvisProduit>(this.url(id)).subscribe({ next: liste => this.liste.set(liste), error: () => this.liste.set(null) });
    this.mien.set(null);
    if (!this.auth.aRole('CLIENT')) return;
    this.http.get<MonAvis>(`${this.url(id)}/moi`).subscribe({
      next: mien => {
        this.mien.set(mien);
        this.note.set(mien.monAvis?.note ?? 0);
        this.commentaire = mien.monAvis?.commentaire ?? '';
      },
    });
  }

  protected envoyer(): void {
    if (this.note() < 1) { this.erreurNote.set(true); return; }
    this.erreurNote.set(false);
    this.envoi.set(true);
    const id = this.produitId();
    this.http.put<Avis>(this.url(id), { note: this.note(), commentaire: this.commentaire }).subscribe({
      next: () => { this.envoi.set(false); this.toasts.succes('Merci, votre avis est publié.'); this.charger(id); },
      error: err => { this.envoi.set(false); this.toasts.erreur(messageErreur(err)); },
    });
  }
}
