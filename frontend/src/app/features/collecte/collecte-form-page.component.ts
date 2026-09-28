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
        <div class="gps"><strong>Localisation</strong><span>{{ localisation() ? (localisation()!.lat | number:'1.4-4') + ', ' + (localisation()!.lng | number:'1.4-4') : 'Non récupérée' }}</span><button type="button" appButton="secondary" (click)="localiser()">Utiliser ma position</button></div>
        <button type="submit" appButton="purchase" [block]="true" [loading]="envoi()">{{ edition ? 'Enregistrer la correction' : 'Enregistrer la déclaration' }}</button>
      </form>
    </section>` ,
  styles: `.formulaire { display:grid; gap:var(--space-4); } .retour { font-weight:600; } .eyebrow { color:var(--color-primary); font-weight:600; } form { display:grid; gap:var(--space-3); } .gps { display:grid; gap:var(--space-1); padding:var(--space-3); border:1px solid var(--color-border); background:var(--color-surface); } .gps span { color:var(--color-text-muted); } .gps button { justify-self:start; }`,
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
  protected formulaire = this.fb.group({ materiauId: ['', Validators.required], quantiteEstimee: [0, [Validators.required, Validators.min(0.01)]] });

  constructor() {
    this.service.materiaux().subscribe({ next: materiaux => { this.materiaux.set(materiaux); if (this.edition) this.chargerEdition(); }, error: () => this.message.set('Les matériaux ne sont pas disponibles. Réessayez en ligne.') });
  }

  protected localiser(): void {
    if (!navigator.geolocation) { this.message.set('La géolocalisation n’est pas disponible sur cet appareil.'); this.messageTone.set('warning'); return; }
    navigator.geolocation.getCurrentPosition(position => this.localisation.set({ lat: position.coords.latitude, lng: position.coords.longitude }), () => { this.message.set('Position indisponible. Autorisez la localisation puis réessayez.'); this.messageTone.set('warning'); });
  }

  protected soumettre(): void {
    if (this.formulaire.invalid || (!this.edition && !this.localisation())) { this.formulaire.markAllAsTouched(); if (!this.localisation()) { this.message.set('La position est nécessaire pour déclarer une collecte.'); this.messageTone.set('warning'); } return; }
    this.envoi.set(true); this.message.set(null);
    const value = this.formulaire.getRawValue();
    if (this.edition) {
      this.service.modifier(this.collecteId, { materiauId: Number(value.materiauId), quantiteEstimee: Number(value.quantiteEstimee), localisation: this.localisation()! }).subscribe({ next: () => this.router.navigateByUrl('/collecte'), error: () => { this.message.set('La correction n’a pas pu être enregistrée.'); this.messageTone.set('error'); this.envoi.set(false); } });
      return;
    }
    this.service.enregistrer({ referenceClient: crypto.randomUUID(), materiauId: Number(value.materiauId), quantiteEstimee: Number(value.quantiteEstimee), localisation: this.localisation()! }).subscribe({ next: collecte => { this.message.set(collecte ? 'Déclaration synchronisée.' : 'Déclaration enregistrée sur le téléphone.'); this.messageTone.set(collecte ? 'success' : 'info'); this.envoi.set(false); this.formulaire.reset({ materiauId: '', quantiteEstimee: 0 }); }, error: () => { this.message.set('La déclaration est restée dans la file locale et sera réessayée.'); this.messageTone.set('warning'); this.envoi.set(false); } });
  }

  protected erreurChamp(nom: 'materiauId' | 'quantiteEstimee'): string | null { const champ = this.formulaire.controls[nom]; return champ.touched && champ.invalid ? (nom === 'materiauId' ? 'Choisissez un matériau.' : 'Saisissez une quantité positive.') : null; }

  private chargerEdition(): void { this.service.mesCollectes().subscribe(collectes => { const collecte = collectes.find(item => item.id === this.collecteId); const ligne = collecte?.lignes[0]; const materiau = this.materiaux().find(item => item.nom === ligne?.materiau); if (collecte && ligne && materiau) { this.formulaire.patchValue({ materiauId: String(materiau.id), quantiteEstimee: ligne.quantiteEstimee }); this.localisation.set({ lat: collecte.latitude, lng: collecte.longitude }); } }); }
}
