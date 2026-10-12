import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SignalementService } from './signalement.service';
import { Zone } from '../../shared/models/api';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { messageErreur } from '../../core/http/erreurs';

interface PhotoApercu {
  fichier: File;
  urlApercu: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container signalement-form">
      <a routerLink="/signalements" class="lien-retour">← Mes signalements</a>
      
      <header class="entete">
        <div class="badge-recompense">
          <app-icon name="check" [size]="16" /> +10 points (1 000 FCFA) par signalement validé
        </div>
        <h1>Signaler un dépôt de pneus</h1>
        <p class="description-aide">
          Participez à la dépollution de votre quartier en signalant des pneus abandonnés. Dès validation par notre équipe, vos points sont automatiquement crédités sur votre compte.
        </p>
      </header>

      @if (succes()) {
        <div class="succes-carte">
          <div class="succes-icone"><app-icon name="check" [size]="24" /></div>
          <h2>Signalement enregistré !</h2>
          <p>Merci pour votre contribution citoyenne. Votre signalement est en cours d'examen par notre équipe. Dès validation, 10 points seront crédités sur votre compte.</p>
          <div class="actions">
            <a routerLink="/signalements" appButton="primary">Voir mes signalements</a>
            <button type="button" appButton="secondary" (click)="reinitialiser()">Faire un autre signalement</button>
          </div>
        </div>
      } @else {
        @if (erreur()) {
          <app-alert tone="error">{{ erreur() }}</app-alert>
        }

        <form [formGroup]="form" (ngSubmit)="soumettre()" class="formulaire" novalidate>
          <app-field label="Zone géographique" [error]="erreurChamp('zoneId')">
            <select appControl formControlName="zoneId" class="input">
              <option value="">Sélectionnez une zone</option>
              @for (zone of zones(); track zone.id) {
                <option [value]="zone.id">{{ zone.nom }}</option>
              }
            </select>
          </app-field>

          <app-field label="Description et repères" hint="Indiquez l'emplacement précis (rue, carrefour, bâtiment proche) et une estimation du nombre de pneus." [error]="erreurChamp('description')">
            <textarea appControl formControlName="description" class="input zone-texte" rows="4" maxlength="500" placeholder="Ex: Environ 15 pneus usés entassés derrière la pharmacie du carrefour..."></textarea>
          </app-field>

          <!-- Géolocalisation -->
          <div class="bloc-gps">
            <div class="gps-info">
              <strong><app-icon name="map-pin" [size]="16" /> Localisation GPS</strong>
              <span>{{ positionTexte() }}</span>
            </div>
            <button type="button" appButton="secondary" (click)="geolocaliser()" [loading]="geoEnCours()">
              <app-icon name="smartphone" [size]="16" /> Obtenir ma position actuelle
            </button>
          </div>

          <!-- Upload Photos -->
          <div class="bloc-photos">
            <label class="photos-label" for="photos-signalement">
              <strong>Photos du dépôt (1 à 5 photos) <span class="requis">*</span></strong>
              <span class="photos-aide">Prenez des photos claires montrant les pneus et l'environnement alentour.</span>
            </label>

            <input #fileInput id="photos-signalement" type="file" accept="image/*" multiple (change)="surSelectionPhotos($event)" style="display:none" />
            <button type="button" class="zone-depot" (click)="fileInput.click()">
              <app-icon name="plus" [size]="24" />
              <span>Cliquez pour ajouter des photos ({{ photos().length }}/5)</span>
            </button>

            @if (photos().length > 0) {
              <div class="grille-apercus">
                @for (photo of photos(); track photo.urlApercu; let index = $index) {
                  <div class="vignette">
                    <img [src]="photo.urlApercu" alt="Aperçu photo signalement" />
                    <button type="button" class="btn-supprimer" (click)="supprimerPhoto(index)" title="Supprimer la photo">✕</button>
                  </div>
                }
              </div>
            }
          </div>

          <button type="submit" appButton="purchase" [block]="true" [loading]="envoiEnCours()" [disabled]="photos().length === 0">
            Envoyer le signalement
          </button>
        </form>
      }
    </section>
  `,
  styles: `
    .signalement-form { max-width: 680px; margin: 0 auto; padding-block: var(--space-6); display: grid; gap: var(--space-5); }
    .lien-retour { color: var(--color-text-muted); text-decoration: none; font-size: 14px; font-weight: 600; }
    .lien-retour:hover { color: var(--color-primary); }
    .entete { display: grid; gap: var(--space-2); }
    .badge-recompense {
      display: inline-flex; align-items: center; gap: var(--space-1);
      width: max-content; padding: 4px var(--space-3); border-radius: var(--radius-full);
      background: #ecfdf5; color: #065f46; font-size: 13px; font-weight: 600;
    }
    .entete h1 { margin: 0; font-size: 26px; }
    .description-aide { color: var(--color-text-muted); font-size: 15px; margin: 0; }
    .formulaire { display: grid; gap: var(--space-4); background: var(--color-surface); padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .zone-texte { resize: vertical; min-height: 100px; font-family: inherit; }
    .bloc-gps {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);
      padding: var(--space-4); background: var(--color-surface-alt); border-radius: var(--radius-sm); border: 1px dashed var(--color-border);
    }
    .gps-info { display: grid; gap: 2px; }
    .gps-info strong { display: flex; align-items: center; gap: var(--space-1); font-size: 15px; }
    .gps-info span { color: var(--color-text-muted); font-size: 13px; }
    .bloc-photos { display: grid; gap: var(--space-2); }
    .photos-label { display: grid; gap: 2px; }
    .requis { color: var(--color-error); }
    .photos-aide { color: var(--color-text-muted); font-size: 13px; }
    .zone-depot {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2);
      padding: var(--space-5); border: 2px dashed var(--color-border-strong); border-radius: var(--radius-md);
      width: 100%; font: inherit; color: inherit;
      cursor: pointer; background: var(--color-surface); transition: background 0.2s;
    }
    .zone-depot:hover { background: var(--color-surface-alt); border-color: var(--color-primary); }
    .zone-depot:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .grille-apercus { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: var(--space-3); margin-top: var(--space-2); }
    .vignette { position: relative; aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--color-border); }
    .vignette img { width: 100%; height: 100%; object-fit: cover; }
    .btn-supprimer {
      position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: var(--radius-full);
      background: rgba(0,0,0,0.7); color: #fff; border: 0; cursor: pointer; font-size: 12px; display: grid; place-items: center;
    }
    .succes-carte {
      display: grid; gap: var(--space-4); justify-items: center; text-align: center;
      padding: var(--space-6); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
    }
    .succes-icone { width: 56px; height: 56px; border-radius: var(--radius-full); background: #ecfdf5; color: #065f46; display: grid; place-items: center; }
    .succes-carte h2 { margin: 0; font-size: 22px; }
    .succes-carte p { color: var(--color-text-muted); margin: 0; max-width: 480px; }
    .actions { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; }
  `
})
export class SignalementFormPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private signalementService = inject(SignalementService);
  private router = inject(Router);

  protected zones = signal<Zone[]>([]);
  protected photos = signal<PhotoApercu[]>([]);
  protected latitude = signal<number | null>(null);
  protected longitude = signal<number | null>(null);
  protected geoEnCours = signal(false);
  protected envoiEnCours = signal(false);
  protected erreur = signal<string | null>(null);
  protected succes = signal(false);

  protected form = this.fb.group({
    zoneId: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]]
  });

  constructor() {
    this.signalementService.getZones().subscribe({
      next: res => this.zones.set(res.content || []),
      error: err => this.erreur.set(messageErreur(err))
    });
  }

  protected positionTexte(): string {
    const lat = this.latitude();
    const lng = this.longitude();
    return (lat != null && lng != null) ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Non renseignée (facultative)';
  }

  protected geolocaliser(): void {
    if (!navigator.geolocation) {
      this.erreur.set('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }
    this.geoEnCours.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
        this.geoEnCours.set(false);
      },
      () => {
        this.erreur.set('Impossible de récupérer votre position GPS. Vous pouvez continuer sans GPS.');
        this.geoEnCours.set(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  protected surSelectionPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const existants = [...this.photos()];
    const restants = 5 - existants.length;

    const ajouts = Array.from(input.files).slice(0, restants).map(fichier => ({
      fichier,
      urlApercu: URL.createObjectURL(fichier)
    }));

    this.photos.set([...existants, ...ajouts]);
    input.value = '';
  }

  protected supprimerPhoto(index: number): void {
    const list = [...this.photos()];
    URL.revokeObjectURL(list[index].urlApercu);
    list.splice(index, 1);
    this.photos.set(list);
  }

  protected erreurChamp(nom: string): string {
    const champ = this.form.get(nom);
    if (!champ || !champ.touched || !champ.invalid) return '';
    if (champ.hasError('required')) return 'Ce champ est requis.';
    if (champ.hasError('maxlength')) return '500 caractères maximum.';
    return 'Valeur invalide.';
  }

  protected soumettre(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const photosFichiers = this.photos().map(p => p.fichier);
    if (photosFichiers.length === 0) {
      this.erreur.set('Veuillez ajouter au moins une photo du dépôt de pneus.');
      return;
    }

    this.envoiEnCours.set(true);
    this.erreur.set(null);

    const zoneId = Number(this.form.controls.zoneId.value);
    const description = this.form.controls.description.value;

    this.signalementService.creer(zoneId, description, photosFichiers, this.latitude(), this.longitude()).subscribe({
      next: () => {
        this.envoiEnCours.set(false);
        this.succes.set(true);
      },
      error: err => {
        this.envoiEnCours.set(false);
        this.erreur.set(messageErreur(err));
      }
    });
  }

  protected reinitialiser(): void {
    this.succes.set(false);
    this.form.reset();
    for (const p of this.photos()) {
      URL.revokeObjectURL(p.urlApercu);
    }
    this.photos.set([]);
    this.latitude.set(null);
    this.longitude.set(null);
  }
}
