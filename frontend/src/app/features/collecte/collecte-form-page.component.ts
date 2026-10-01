import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Collecte, Materiau } from '../../shared/models/api';
import { CollecteService } from './collecte.service';
import { NetworkService } from '../../core/network.service';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, AlertComponent, ButtonDirective, FieldComponent, ControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="formulaire"><a routerLink="/collecte" class="retour">Mes collectes</a><p class="eyebrow">Espace terrain</p><h1>{{ edition ? 'Corriger une déclaration' : 'Nouvelle déclaration' }}</h1>
      @if (!reseau.enLigne() && !edition) { <app-alert tone="info">Votre déclaration sera enregistrée sur ce téléphone et synchronisée dès que le réseau revient.</app-alert> }
      @if (message()) { <app-alert [tone]="messageTone()">{{ message() }}</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="soumettre()" novalidate>
        <app-field label="Matériau" [error]="erreurChamp('materiauId')"><select appControl class="input" formControlName="materiauId"><option value="">Choisir un matériau</option>@for (materiau of materiaux(); track materiau.id) { <option [value]="materiau.id">{{ materiau.nom }} ({{ materiau.unite }})</option> }</select></app-field>
        <app-field label="Quantité estimée" [error]="erreurChamp('quantiteEstimee')"><input appControl class="input" type="number" min="0.01" step="0.01" formControlName="quantiteEstimee" /></app-field>
        <div class="gps"><strong>Localisation</strong><span>{{ positionTexte() }}</span><button type="button" appButton="secondary" (click)="localiser()">Utiliser ma position</button>
        @if (!localisation()) { <button type="button" class="texte" (click)="saisieManuelle.set(!saisieManuelle())">{{ saisieManuelle() ? 'Masquer la saisie manuelle' : 'Saisir la position manuellement' }}</button> }
        @if (saisieManuelle() && !localisation()) { <app-field label="Latitude (-90 à 90)"><input appControl class="input" type="number" min="-90" max="90" step="0.0001" formControlName="latManuelle" /></app-field><app-field label="Longitude (-180 à 180)"><input appControl class="input" type="number" min="-180" max="180" step="0.0001" formControlName="lngManuelle" /></app-field> }</div>
        <button type="submit" appButton="purchase" [block]="true" [loading]="envoi()">{{ edition ? 'Enregistrer la correction' : 'Enregistrer la déclaration' }}</button>
      </form>
    </section>` ,
  styles: `.formulaire { display:grid; gap:var(--space-4); } .retour { font-weight:600; } .eyebrow { color:var(--color-primary); font-weight:600; } form { display:grid; gap:var(--space-3); } .gps { display:grid; gap:var(--space-1); padding:var(--space-3); border:1px solid var(--color-border); background:var(--color-surface); } .gps span { color:var(--color-text-muted); } .gps button { justify-self:start; } .texte { border:0; padding:0; background:none; color:inherit; text-decoration:underline; cursor:pointer; font:inherit; }`,
})
export class CollecteFormPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CollecteService);
  protected reseau = inject(NetworkService);
  protected materiaux = signal<Materiau[]>([]);
  protected localisation = signal<{ lat: number; lng: number } | null>(null);
  protected message = signal<string | null>(null);
  protected messageTone = signal<'success' | 'warning' | 'error' | 'info'>('info');
  protected envoi = signal(false);
  protected readonly edition = this.route.snapshot.paramMap.has('id');
  protected readonly collecteId = Number(this.route.snapshot.paramMap.get('id'));
  protected saisieManuelle = signal(false);
  protected formulaire = this.fb.group({ materiauId: ['', Validators.required], quantiteEstimee: [0, [Validators.required, Validators.min(0.01)]], latManuelle: [''], lngManuelle: [''] });

  constructor() {
    this.service.materiaux().subscribe({ next: materiaux => { this.materiaux.set(materiaux); if (this.edition) this.chargerEdition(); }, error: () => this.message.set('Les matériaux ne sont pas disponibles. Réessayez en ligne.') });
  }

  protected positionTexte(): string {
    const auto = this.localisation();
    if (auto) return `${auto.lat}, ${auto.lng}`;
    const manuelle = positionManuelleValide(this.formulaire.controls.latManuelle.value, this.formulaire.controls.lngManuelle.value);
    return manuelle ? `${manuelle.lat}, ${manuelle.lng}` : 'Non récupérée';
  }

  protected localiser(): void {
    if (!navigator.geolocation) { this.messageLocalisation('La géolocalisation n’est pas disponible sur cet appareil.'); return; }
    // Sans délai, la demande peut rester en suspens indéfiniment (souvent hors ligne).
    navigator.geolocation.getCurrentPosition(
      position => this.localisation.set({ lat: position.coords.latitude, lng: position.coords.longitude }),
      erreur => {
        if (erreur.code === erreur.PERMISSION_DENIED) this.messageLocalisation('Localisation refusée : autorisez-la ou saisissez la position manuellement.');
        else if (erreur.code === erreur.TIMEOUT) this.messageLocalisation('Délai dépassé — fréquent hors ligne : saisissez la position manuellement.');
        else this.messageLocalisation('Position indisponible. Réessayez ou saisissez-la manuellement.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  private messageLocalisation(texte: string): void {
    this.message.set(texte); this.messageTone.set('warning'); this.saisieManuelle.set(true);
  }

  protected soumettre(): void {
    const position = this.position();
    if (this.formulaire.invalid || (!this.edition && !position)) { this.formulaire.markAllAsTouched(); if (!position) { this.message.set('La position est nécessaire : utilisez le GPS ou saisissez-la manuellement.'); this.messageTone.set('warning'); } return; }
    this.envoi.set(true); this.message.set(null);
    const value = this.formulaire.getRawValue();
    const localisation = this.position() ?? this.localisation()!;
    if (this.edition) {
      this.service.modifier(this.collecteId, { materiauId: Number(value.materiauId), quantiteEstimee: Number(value.quantiteEstimee), localisation }).subscribe({ next: () => this.router.navigateByUrl('/collecte'), error: () => { this.message.set('La correction n’a pas pu être enregistrée.'); this.messageTone.set('error'); this.envoi.set(false); } });
      return;
    }
    this.service.enregistrer({ referenceClient: crypto.randomUUID(), materiauId: Number(value.materiauId), quantiteEstimee: Number(value.quantiteEstimee), localisation }).subscribe({ next: collecte => { this.message.set(collecte ? 'Déclaration synchronisée.' : 'Déclaration enregistrée sur le téléphone.'); this.messageTone.set(collecte ? 'success' : 'info'); this.envoi.set(false); this.formulaire.reset({ materiauId: '', quantiteEstimee: 0 }); }, error: () => { this.message.set('La déclaration est restée dans la file locale et sera réessayée.'); this.messageTone.set('warning'); this.envoi.set(false); } });
  }

  protected erreurChamp(nom: 'materiauId' | 'quantiteEstimee'): string | null { const champ = this.formulaire.controls[nom]; return champ.touched && champ.invalid ? (nom === 'materiauId' ? 'Choisissez un matériau.' : 'Saisissez une quantité positive.') : null; }

  private position(): { lat: number; lng: number } | null {
    return this.localisation()
      ?? positionManuelleValide(this.formulaire.controls.latManuelle.value, this.formulaire.controls.lngManuelle.value);
  }

  private chargerEdition(): void { this.service.mesCollectes().subscribe(collectes => { const collecte = collectes.find(item => item.id === this.collecteId); const ligne = collecte?.lignes[0]; const materiau = this.materiaux().find(item => item.nom === ligne?.materiau); if (collecte && ligne && materiau) { this.formulaire.patchValue({ materiauId: String(materiau.id), quantiteEstimee: ligne.quantiteEstimee }); this.localisation.set({ lat: collecte.latitude, lng: collecte.longitude }); } }); }
}

export function positionManuelleValide(latitude: string, longitude: string): { lat: number; lng: number } | null {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude.replace(',', '.'));
  const lng = Number(longitude.replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
