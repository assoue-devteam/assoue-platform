import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Categorie, Produit, ProduitGestionRequest } from '../../shared/models/api';
import { messageErreur } from '../../core/http/erreurs';
import { GestionService } from './gestion.service';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { AlertComponent } from '../../shared/ui/alert.component';
import { ButtonDirective } from '../../shared/ui/button.directive';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ControlDirective, FieldComponent } from '../../shared/ui/field.component';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '../../shared/ui/states';
import { ToastService } from '../../shared/ui/toast';

export interface ValeurProduitForm {
  nom: string;
  categorieId: number | null;
  prix: number | null;
  description: string;
  imageUrl: string;
  stockQuantite: number | null;
  vedette: boolean;
}

/** Prix et stock en FCFA/unités entières : pas de décimales (le backend refuse aussi). */
export function entierNonNegatif(controle: AbstractControl): ValidationErrors | null {
  const valeur = controle.value;
  if (valeur === null || valeur === '') return null;
  return Number.isInteger(Number(valeur)) && Number(valeur) >= 0 ? null : { entier: true };
}

/** Valeur du formulaire vers le corps POST/PUT : '' devient null (même convention que Communauté). */
export function versRequeteProduit(valeur: ValeurProduitForm): ProduitGestionRequest {
  const stock = valeur.stockQuantite as unknown;
  return {
    nom: valeur.nom.trim(),
    categorieId: valeur.categorieId ?? 0,
    prix: valeur.prix ?? 0,
    description: valeur.description.trim() || null,
    imageUrl: valeur.imageUrl.trim() || null,
    stockQuantite: stock === null || stock === '' ? null : Number(stock),
    vedette: valeur.vedette,
  };
}

type ChampProduit = 'nom' | 'categorieId' | 'prix' | 'description' | 'imageUrl' | 'stockQuantite';

/**
 * Rattache un message 400 au bon champ (GAP-11 : le backend renvoie un message global).
 * 404 (produit ou catégorie disparue entre-temps) : alerte haute + rechargement.
 */
export function champErreurProduit(statut: number, message: string): ChampProduit | null {
  if (statut !== 400) return null;
  const texte = message.toLowerCase();
  if (texte.includes('catégorie')) return 'categorieId';
  if (texte.includes('prix')) return 'prix';
  if (texte.includes('image') || texte.includes('http')) return 'imageUrl';
  if (texte.includes('stock')) return 'stockQuantite';
  if (texte.includes('description')) return 'description';
  if (texte.includes('nom')) return 'nom';
  return null;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FcfaPipe, AlertComponent, ButtonDirective, ModalComponent, FieldComponent, ControlDirective, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gestion-page">
      <div class="entete"><div><p class="eyebrow">Gestion</p><h1>Produits</h1></div>
      <button type="button" appButton (click)="ouvrirCreation()">Nouveau produit</button></div>
      @if (message()) { <app-alert tone="error">{{ message() }}</app-alert> }
      @if (chargement()) { <app-skeleton [lignes]="7" /> }
      @else if (erreur()) { <app-error-state type="serveur" titre="Les produits sont indisponibles" texte="Nous ne pouvons pas charger le catalogue pour le moment." [reessayable]="true" (reessayer)="charger()" /> }
      @else if (!produits().length) { <app-empty-state message="Aucun produit au catalogue."><button type="button" appButton="secondary" (click)="ouvrirCreation()">Créer le premier produit</button></app-empty-state> }
      @else {
        <table class="table">
          <thead><tr><th scope="col">Produit</th><th scope="col">Catégorie</th><th scope="col" class="num">Prix</th><th scope="col" class="num">Stock</th><th scope="col">Vedette</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            @for (produit of produits(); track produit.id) {
              <tr>
                <td data-label="Produit"><strong>{{ produit.nom }}</strong></td>
                <td data-label="Catégorie">{{ produit.categorie }}</td>
                <td data-label="Prix" class="num">{{ produit.prix | fcfa }}</td>
                <td data-label="Stock" class="num">@if (stockDe(produit.id) === null) { — } @else { {{ stockDe(produit.id) }} }</td>
                <td data-label="Vedette">@if (produit.vedette) { Oui } @else { Non }</td>
                <td data-label="">
                  <span class="actions">
                    <button type="button" appButton="secondary" [small]="true" (click)="ouvrirEdition(produit)">Modifier</button>
                    <button type="button" appButton="danger" [small]="true" (click)="demanderSuppression(produit)">Supprimer</button>
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
    <app-modal [titre]="edition() ? 'Modifier le produit' : 'Nouveau produit'" [(open)]="formulaireOuvert">
      @if (erreurFormulaire()) { <app-alert tone="error">{{ erreurFormulaire() }}</app-alert> }
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()" novalidate>
        <app-field label="Nom" [error]="erreurChamp('nom')"><input appControl class="input" formControlName="nom" maxlength="200" /></app-field>
        <app-field label="Catégorie" [error]="erreurChamp('categorieId')">
          <select appControl class="input" formControlName="categorieId">
            <option [ngValue]="null">Choisir une catégorie</option>
            @for (categorie of categories(); track categorie.id) { <option [ngValue]="categorie.id">{{ categorie.nom }}</option> }
          </select>
        </app-field>
        <app-field label="Prix (FCFA, sans décimales)" [error]="erreurChamp('prix')"><input appControl class="input" type="number" min="0" step="1" formControlName="prix" /></app-field>
        <app-field label="Description" [error]="erreurChamp('description')"><textarea appControl class="input zone-texte" formControlName="description" maxlength="2000" rows="3"></textarea></app-field>
        <app-field label="Adresse de la photo (facultatif)" hint="Lien https vers une image déjà en ligne." [error]="erreurChamp('imageUrl')"><input appControl class="input" type="url" formControlName="imageUrl" /></app-field>
        <app-field [label]="edition() ? 'Stock (vide = inchangé)' : 'Stock initial (vide = 0)'" hint="Quantité entière, remplace la valeur actuelle." [error]="erreurChamp('stockQuantite')"><input appControl class="input" type="number" min="0" step="1" formControlName="stockQuantite" /></app-field>
        <label class="check"><input type="checkbox" formControlName="vedette" /> Produit vedette (en tête du catalogue)</label>
        <div class="formulaire__actions">
          <button type="button" appButton="secondary" (click)="formulaireOuvert.set(false)">Annuler</button>
          <button type="submit" appButton [loading]="envoi()" [disabled]="envoi()">{{ edition() ? 'Enregistrer' : 'Créer le produit' }}</button>
        </div>
      </form>
    </app-modal>
    <app-modal titre="Supprimer ce produit ?" [(open)]="suppressionOuverte">
      @if (suppression(); as cible) {
        <p>« {{ cible.nom }} » disparaîtra du catalogue. Les commandes, favoris et paniers qui le référencent sont conservés (archivage, pas d'effacement).</p>
      }
      <div class="formulaire__actions" actions>
        <button type="button" appButton="secondary" (click)="suppressionOuverte.set(false)">Annuler</button>
        <button type="button" appButton="danger" [loading]="envoi()" [disabled]="envoi()" (click)="supprimer()">Supprimer</button>
      </div>
    </app-modal>`,
  styles: `.gestion-page { display:grid; gap:var(--space-5); } .entete { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); } .eyebrow { color:var(--color-primary); font-weight:600; }
    .actions { display:inline-flex; gap:var(--space-2); } td strong { font-weight:600; }
    form { display:grid; gap:var(--space-2); } textarea.zone-texte { padding-block:var(--space-2); min-height:88px; resize:vertical; }
    .formulaire__actions { display:flex; justify-content:flex-end; gap:var(--space-3); margin-top:var(--space-2); }
    app-alert { display:block; margin-bottom:var(--space-4); }`,
})
export class GestionProduitsPageComponent {
  private fb = inject(FormBuilder).nonNullable;
  private service = inject(GestionService);
  private toasts = inject(ToastService);
  protected produits = signal<Produit[]>([]);
  protected categories = signal<Categorie[]>([]);
  protected stocks = signal<Record<number, number>>({});
  protected chargement = signal(true);
  protected erreur = signal(false);
  protected message = signal<string | null>(null);
  protected formulaireOuvert = signal(false);
  protected suppressionOuverte = signal(false);
  protected suppression = signal<Produit | null>(null);
  protected edition = signal<Produit | null>(null);
  protected envoi = signal(false);
  protected erreurFormulaire = signal<string | null>(null);
  private erreurServeur = signal<{ champ: ChampProduit; message: string } | null>(null);
  protected formulaire = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(200)]],
    categorieId: [null as number | null, Validators.required],
    prix: [null as number | null, [Validators.required, entierNonNegatif]],
    description: ['', Validators.maxLength(2000)],
    imageUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
    stockQuantite: [null as number | null, entierNonNegatif],
    vedette: [false],
  });

  constructor() { this.charger(); }

  protected stockDe(produitId: number): number | null {
    return this.stocks()[produitId] ?? null;
  }

  protected ouvrirCreation(): void {
    this.edition.set(null);
    this.formulaire.reset({ nom: '', categorieId: null, prix: null, description: '', imageUrl: '', stockQuantite: null, vedette: false });
    this.erreurServeur.set(null); this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(produit: Produit): void {
    this.edition.set(produit);
    this.formulaire.reset({
      nom: produit.nom,
      categorieId: this.categories().find(c => c.nom === produit.categorie)?.id ?? null,
      prix: produit.prix,
      description: produit.description ?? '',
      imageUrl: produit.imageUrl ?? '',
      stockQuantite: null,
      vedette: produit.vedette,
    });
    this.erreurServeur.set(null); this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid || this.envoi()) { this.formulaire.markAllAsTouched(); return; }
    this.envoi.set(true); this.erreurServeur.set(null); this.erreurFormulaire.set(null);
    const requete = versRequeteProduit(this.formulaire.getRawValue());
    const cible = this.edition();
    const appel = cible ? this.service.modifierProduit(cible.id, requete) : this.service.creerProduit(requete);
    appel.subscribe({
      next: produit => {
        this.toasts.succes(cible ? `« ${produit.nom} » a été modifié.` : `« ${produit.nom} » a été créé.`);
        this.envoi.set(false); this.formulaireOuvert.set(false);
        this.charger();
      },
      error: err => {
        const statut = err instanceof HttpErrorResponse ? err.status : 0;
        const messageServeur = err instanceof HttpErrorResponse && typeof err.error?.message === 'string' ? err.error.message : '';
        const champ = champErreurProduit(statut, messageServeur);
        if (champ) {
          this.erreurServeur.set({ champ, message: messageServeur || messageErreur(err) });
          this.formulaire.controls[champ].markAsTouched();
        } else {
          this.erreurFormulaire.set(statut === 404 ? 'Produit ou catégorie introuvable. La liste a été rechargée.' : messageErreur(err));
          if (statut === 404) this.charger();
        }
        this.envoi.set(false);
      },
    });
  }

  protected supprimer(): void {
    const cible = this.suppression();
    if (!cible || this.envoi()) return;
    this.envoi.set(true);
    this.service.supprimerProduit(cible.id).subscribe({
      next: () => {
        this.toasts.succes(`« ${cible.nom} » a été retiré du catalogue.`);
        this.envoi.set(false); this.suppressionOuverte.set(false); this.suppression.set(null);
        this.charger();
      },
      error: err => {
        this.toasts.erreur(messageErreur(err));
        this.envoi.set(false); this.suppressionOuverte.set(false); this.suppression.set(null);
        this.charger();
      },
    });
  }

  protected demanderSuppression(produit: Produit): void {
    this.suppression.set(produit);
    this.suppressionOuverte.set(true);
  }

  protected erreurChamp(nom: ChampProduit): string | null {
    const rattachee = this.erreurServeur();
    if (rattachee?.champ === nom) return rattachee.message;
    const champ = this.formulaire.controls[nom];
    if (!champ.touched || !champ.invalid) return null;
    if (nom === 'categorieId') return 'Choisissez une catégorie.';
    if (nom === 'prix') return 'Saisissez un prix entier à 0 ou plus.';
    if (nom === 'stockQuantite') return 'Saisissez une quantité entière à 0 ou plus.';
    if (nom === 'imageUrl') return 'Saisissez une adresse qui commence par http:// ou https://.';
    if (nom === 'nom' && champ.hasError('maxlength')) return '200 caractères au plus.';
    if (nom === 'description') return '2000 caractères au plus.';
    return 'Ce champ est obligatoire.';
  }

  protected charger(): void {
    this.chargement.set(true); this.erreur.set(false); this.message.set(null);
    this.service.produits().subscribe({
      next: produits => { this.produits.set(produits); this.chargement.set(false); },
      error: () => { this.erreur.set(true); this.chargement.set(false); },
    });
    this.service.categories().subscribe({ next: categories => this.categories.set(categories), error: () => this.message.set('Les catégories sont indisponibles.') });
    this.service.stocksProduits().subscribe({
      next: stocks => this.stocks.set(Object.fromEntries(stocks.map(s => [s.produitId, s.quantite]))),
      error: () => this.message.set('Les stocks sont indisponibles.'),
    });
  }
}
