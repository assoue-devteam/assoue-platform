import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { messageErreur } from '../../core/http/erreurs';
import { Evenement, EvenementRequest } from '../../shared/models/api';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ImageUploadComponent } from '../../shared/images/image-upload.component';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast';
import { CommunauteService } from '../communaute/communaute.service';

const MAX_CHIFFRES = 6;

@Component({
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonDirective, ImageUploadComponent, FieldComponent, ControlDirective, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page">
      <div class="entete">
        <div><p class="eyebrow">Gestion</p><h1>Communauté</h1></div>
        <button type="button" appButton="primary" (click)="ouvrirCreation()">Nouvel événement</button>
      </div>

      <section>
        <h2>Événements</h2>
        <div class="liste">
          @for (evenement of evenements(); track evenement.id) {
            <div class="ligne">
              <div><strong>{{ evenement.titre }}</strong><span>{{ evenement.dateDebut | date:'d MMM y, HH:mm':'':'fr' }} · {{ evenement.lieu }}</span></div>
              <div class="actions">
                <button type="button" appButton="secondary" (click)="ouvrirModification(evenement)">Modifier</button>
                <button type="button" appButton="ghost" (click)="aSupprimer.set(evenement)">Supprimer</button>
              </div>
            </div>
          } @empty { <p class="text-muted">Aucun événement. Les visiteurs voient « Aucun événement prévu pour le moment ».</p> }
        </div>
      </section>

      <section>
        <h2>Chiffres de la page Communauté</h2>
        <p class="aide">{{ maxChiffres }} au plus, affichés dans cet ordre. Ne saisissez que des chiffres vérifiés.</p>
        <form [formGroup]="formChiffres" (ngSubmit)="enregistrerChiffres()" novalidate class="chiffres">
          <div formArrayName="chiffres" class="chiffres__lignes">
            @for (ligne of chiffres.controls; track ligne; let i = $index) {
              <div class="chiffres__ligne" [formGroupName]="i">
                <input class="input" type="text" formControlName="libelle" placeholder="Artisans soutenus" [attr.aria-label]="'Libellé du chiffre ' + (i + 1)" />
                <input class="input valeur" type="number" min="0" formControlName="valeur" [attr.aria-label]="'Valeur du chiffre ' + (i + 1)" />
                <button type="button" appButton="ghost" (click)="chiffres.removeAt(i)">Retirer</button>
              </div>
            }
          </div>
          @if (chiffresInvalides()) { <p class="erreur">Chaque chiffre a besoin d'un libellé et d'une valeur positive.</p> }
          <div class="chiffres__actions">
            <button type="button" appButton="secondary" [disabled]="chiffres.length >= maxChiffres" (click)="ajouterChiffre()">Ajouter un chiffre</button>
            <button type="submit" appButton="primary" [loading]="envoiChiffres()">Enregistrer les chiffres</button>
          </div>
        </form>
      </section>
    </section>

    <app-modal [titre]="titreFormulaire()" [(open)]="formulaireOuvert">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()" novalidate>
        <app-field label="Titre" [error]="erreur('titre')"><input appControl class="input" type="text" formControlName="titre" maxlength="150" /></app-field>
        <app-field label="Date et heure" [error]="erreur('dateDebut')"><input appControl class="input" type="datetime-local" formControlName="dateDebut" /></app-field>
        <app-field label="Lieu" [error]="erreur('lieu')"><input appControl class="input" type="text" formControlName="lieu" maxlength="200" placeholder="Centre AS'SOUÉ, Ouagadougou" /></app-field>
        <app-field label="Description (facultatif)"><textarea appControl class="input" rows="3" formControlName="description" maxlength="2000"></textarea></app-field>
        <app-image-upload legende="Photo de l'événement" [(cle)]="imageCle" [(apercu)]="imageLegacy" (envoiEnCours)="envoiImage.set($event)" />
        <app-field label="Places restantes (facultatif)" [error]="erreur('placesRestantes')"><input appControl class="input" type="number" min="0" formControlName="placesRestantes" /></app-field>
        <div class="formulaire__actions">
          <button type="button" appButton="ghost" (click)="formulaireOuvert.set(false)">Annuler</button>
          <button type="submit" appButton="primary" [loading]="envoi()" [disabled]="envoi() || envoiImage()">Enregistrer</button>
        </div>
      </form>
    </app-modal>

    <app-modal titre="Supprimer l'événement ?" [open]="aSupprimer() !== null" (openChange)="$event || aSupprimer.set(null)">
      <p>« {{ aSupprimer()?.titre }} » disparaîtra de la page Communauté.</p>
      <div class="formulaire__actions">
        <button type="button" appButton="ghost" (click)="aSupprimer.set(null)">Annuler</button>
        <button type="button" appButton="danger" (click)="supprimer()">Supprimer</button>
      </div>
    </app-modal>
  `,
  styles: `
    .gestion-page { display: grid; gap: var(--space-6); }
    section { display: grid; gap: var(--space-3); }
    .entete { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
    .eyebrow { color: var(--color-primary); font-weight: 600; }
    .aide { color: var(--color-text-muted); font-size: 14px; }
    .liste { border-top: 1px solid var(--color-border); }
    .ligne { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
    .ligne > div:first-child { display: grid; gap: var(--space-1); }
    .ligne span { color: var(--color-text-muted); font-size: 14px; }
    .actions, .chiffres__actions, .formulaire__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .formulaire__actions { justify-content: flex-end; margin-top: var(--space-2); }
    .chiffres { display: grid; gap: var(--space-3); max-width: 640px; }
    .chiffres__lignes { display: grid; gap: var(--space-2); }
    .chiffres__ligne { display: grid; grid-template-columns: minmax(0, 1fr) 110px auto; gap: var(--space-2); align-items: center; }
    .erreur { color: var(--color-error); font-size: 14px; }
    textarea.input { resize: vertical; }
  `,
})
export class GestionCommunautePageComponent {
  private fb = inject(FormBuilder);
  private service = inject(CommunauteService);
  private toasts = inject(ToastService);
  protected readonly maxChiffres = MAX_CHIFFRES;

  protected evenements = signal<Evenement[]>([]);
  protected formulaireOuvert = signal(false);
  protected enEdition = signal<Evenement | null>(null);
  protected aSupprimer = signal<Evenement | null>(null);
  protected envoi = signal(false);
  protected envoiImage = signal(false);
  protected imageCle = signal<string | null>(null);
  protected imageLegacy = signal<string | null>(null);
  protected titreFormulaire(): string {
    return this.enEdition() ? "Modifier l'événement" : 'Nouvel événement';
  }
  protected envoiChiffres = signal(false);
  protected chiffresInvalides = signal(false);

  protected formulaire = this.fb.nonNullable.group({
    titre: ['', [Validators.required, Validators.maxLength(150)]],
    dateDebut: ['', Validators.required],
    lieu: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    placesRestantes: [null as number | null, Validators.min(0)],
  });

  protected formChiffres = this.fb.group({ chiffres: this.fb.array<FormGroup>([]) });
  protected get chiffres(): FormArray<FormGroup> { return this.formChiffres.controls.chiffres; }

  constructor() {
    this.chargerEvenements();
    this.service.chiffres().subscribe({
      next: chiffres => chiffres.forEach(chiffre => this.chiffres.push(this.ligneChiffre(chiffre.libelle, chiffre.valeur))),
      error: err => this.toasts.erreur(messageErreur(err)),
    });
  }

  private ligneChiffre(libelle = '', valeur: number | null = null): FormGroup {
    return this.fb.nonNullable.group({
      libelle: [libelle, [Validators.required, Validators.maxLength(80)]],
      valeur: [valeur, [Validators.required, Validators.min(0)]],
    });
  }

  protected ajouterChiffre(): void {
    if (this.chiffres.length < MAX_CHIFFRES) this.chiffres.push(this.ligneChiffre());
  }

  protected enregistrerChiffres(): void {
    if (this.formChiffres.invalid) { this.chiffresInvalides.set(true); return; }
    this.chiffresInvalides.set(false);
    this.envoiChiffres.set(true);
    const valeurs = this.chiffres.getRawValue() as { libelle: string; valeur: number }[];
    this.service.remplacerChiffres(valeurs.map(({ libelle, valeur }) => ({ libelle, valeur: Number(valeur) }))).subscribe({
      next: () => { this.envoiChiffres.set(false); this.toasts.succes('Chiffres enregistrés.'); },
      error: err => { this.envoiChiffres.set(false); this.toasts.erreur(messageErreur(err)); },
    });
  }

  protected ouvrirCreation(): void {
    this.enEdition.set(null);
    this.formulaire.reset();
    this.imageCle.set(null); this.imageLegacy.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirModification(evenement: Evenement): void {
    this.enEdition.set(evenement);
    this.formulaire.reset({
      titre: evenement.titre,
      // datetime-local attend « 2026-12-15T09:00 », sans secondes ni fuseau.
      dateDebut: evenement.dateDebut.slice(0, 16),
      lieu: evenement.lieu,
      description: evenement.description ?? '',
      placesRestantes: evenement.placesRestantes,
    });
    this.imageCle.set(evenement.imageCle ?? null);
    this.imageLegacy.set(evenement.imageCle ? null : evenement.imageUrl);
    this.formulaireOuvert.set(true);
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid || this.envoi() || this.envoiImage()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true);
    const valeur = this.formulaire.getRawValue();
    const cle = this.imageCle();
    const legacy = this.imageLegacy()?.trim() || null;
    const requete: EvenementRequest = {
      titre: valeur.titre,
      dateDebut: valeur.dateDebut,
      lieu: valeur.lieu,
      description: valeur.description || null,
      imageUrl: cle ? null : legacy,
      imageCle: cle,
      placesRestantes: valeur.placesRestantes === null || (valeur.placesRestantes as unknown) === '' ? null : Number(valeur.placesRestantes),
    };
    const enEdition = this.enEdition();
    const appel = enEdition ? this.service.modifierEvenement(enEdition.id, requete) : this.service.creerEvenement(requete);
    appel.subscribe({
      next: () => {
        this.envoi.set(false);
        this.formulaireOuvert.set(false);
        this.toasts.succes(enEdition ? 'Événement modifié.' : 'Événement publié sur la page Communauté.');
        this.chargerEvenements();
      },
      error: err => { this.envoi.set(false); this.toasts.erreur(messageErreur(err)); },
    });
  }

  protected supprimer(): void {
    const evenement = this.aSupprimer();
    if (!evenement) return;
    this.service.supprimerEvenement(evenement.id).subscribe({
      next: () => { this.aSupprimer.set(null); this.toasts.succes('Événement supprimé.'); this.chargerEvenements(); },
      error: err => { this.aSupprimer.set(null); this.toasts.erreur(messageErreur(err)); },
    });
  }

  protected erreur(champ: 'titre' | 'dateDebut' | 'lieu' | 'placesRestantes'): string | null {
    const controle = this.formulaire.controls[champ];
    if (!controle.touched || !controle.invalid) return null;
    if (champ === 'placesRestantes') return 'Saisissez un nombre positif.';
    return 'Ce champ est obligatoire.';
  }

  private chargerEvenements(): void {
    this.service.evenements().subscribe({
      next: evenements => this.evenements.set(evenements),
      error: err => this.toasts.erreur(messageErreur(err)),
    });
  }
}
