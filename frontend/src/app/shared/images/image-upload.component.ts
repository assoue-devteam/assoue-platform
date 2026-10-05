import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, model, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { messageErreur } from '../../core/http/erreurs';
import { ImageService, cheminImageCle, resoudreUrlImage, validerImageClient } from './image.service';
import { IconComponent } from '../ui/icon/icon.component';
import { SrcImagePipe } from './src-image.pipe';

type Etat = 'vide' | 'glissement' | 'envoi' | 'succes' | 'erreur';

let compteur = 0;

/**
 * Envoi d'image par glisser-déposer (produits et événements, un seul fichier).
 * Le glisser-déposer n'est jamais la seule méthode : l'input natif reste la voie
 * clavier et lecteur d'écran. La validation cliente (type, taille) n'est qu'un
 * confort, la vraie validation est serveur. Pour une galerie future : accepter
 * plusieurs fichiers et émettre une liste de clés au lieu d'une seule.
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [IconComponent, SrcImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="televersement">
      <span class="televersement__legende" [id]="idLegende">{{ legende() }} (facultatif)</span>
      <div class="depot" [class.depot--survol]="etat() === 'glissement'"
           (dragover)="survoler($event)" (dragleave)="quitterSurvol()" (drop)="deposer($event)"
           [attr.aria-describedby]="idLegende">
        @if (affichage()) {
          <img [src]="affichage()! | srcImage" [alt]="'Aperçu : ' + (nomFichier() ?? legende())"
               width="320" height="240" />
        } @else {
          <app-icon name="image" [size]="24" aria-hidden="true" />
          <p>Glissez une image ici</p>
        }
        <p class="aide">JPEG ou PNG, 5 Mo au plus.</p>
        <input #choix class="sr-only" type="file" [id]="idChamp" accept="image/jpeg,image/png"
               (change)="choisir(choix.files); choix.value = ''" [disabled]="etat() === 'envoi'" />
        <div class="actions">
          @if (etat() === 'envoi') {
            <progress [value]="progression()" max="100">{{ progression() }} %</progress>
            <button type="button" class="bouton" (click)="annuler()">Annuler</button>
          } @else {
            <label class="bouton" [for]="idChamp">
              @if (affichage()) { Remplacer } @else { Choisir une image }
            </label>
            @if (affichage()) {
              <button type="button" class="bouton bouton--danger" (click)="supprimer()">Supprimer</button>
            }
          }
        </div>
        @if (etat() === 'erreur' && erreur()) {
          <p class="erreur" role="alert"><app-icon name="alert-triangle" [size]="16" /> {{ erreur() }}
            <label class="lien" [for]="idChamp">Réessayer</label>
          </p>
        }
      </div>
      <p class="sr-only" aria-live="polite">{{ annonce() }}</p>
    </div>
  `,
  styles: `
    .televersement { display: grid; gap: var(--space-2); }
    .televersement__legende { font-size: 14px; font-weight: 600; }
    .depot {
      display: grid; gap: var(--space-2); justify-items: center; text-align: center;
      padding: var(--space-5) var(--space-4); border: 1px dashed var(--color-border-strong);
      border-radius: var(--radius-md); background: var(--color-surface-alt);
    }
    .depot--survol { border-style: solid; border-color: var(--color-primary); background: var(--color-primary-tint); }
    .depot img { width: min(100%, 320px); height: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius-sm); }
    .depot p { margin: 0; }
    .aide { color: var(--color-text-muted); font-size: 14px; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); }
    .bouton {
      display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 var(--space-4);
      border: 1px solid var(--color-primary); border-radius: var(--radius-sm); background: var(--color-surface);
      color: var(--color-primary-strong); font: 600 15px var(--font-text); cursor: pointer;
    }
    .bouton--danger { border-color: var(--color-error); color: var(--color-error); background: none; }
    .bouton:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    input.sr-only:focus-visible + .actions .bouton { box-shadow: var(--focus-ring); }
    progress { width: min(100%, 280px); height: 12px; }
    .erreur { display: flex; align-items: center; gap: var(--space-2); color: var(--color-error); font-size: 14px; }
    .lien { text-decoration: underline; cursor: pointer; min-height: 44px; display: inline-flex; align-items: center; }
    .lien:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  `,
})
export class ImageUploadComponent {
  /** Clé renvoyée par le serveur, null si aucune image téléversée. */
  cle = model<string | null>(null);
  /** URL de l'image déjà enregistrée, affichée tant qu'on ne touche à rien, null après suppression. */
  apercu = model<string | null>(null);
  legende = input('Photo');
  /** Le formulaire parent désactive son bouton tant que c'est vrai. */
  envoiEnCours = output<boolean>();

  protected etat = signal<Etat>('vide');
  protected progression = signal(0);
  protected erreur = signal<string | null>(null);
  protected annonce = signal('');
  protected nomFichier = signal<string | null>(null);
  protected readonly idChamp = `image-fichier-${++compteur}`;
  protected readonly idLegende = `image-legende-${compteur}`;
  protected affichage = computed(() => {
    if (this.apercuLocal()) return this.apercuLocal();
    if (this.cle()) return resoudreUrlImage(cheminImageCle(this.cle()!));
    return this.apercu();
  });

  private service = inject(ImageService);
  private apercuLocal = signal<string | null>(null);
  private objetUrl: string | null = null;
  private abonnement: Subscription | null = null;
  private clePrecedente: string | null = null;

  private gardeFichiers = (event: DragEvent) => event.preventDefault();

  constructor() {
    const destroyRef = inject(DestroyRef);
    document.addEventListener('dragover', this.gardeFichiers);
    document.addEventListener('drop', this.gardeFichiers);
    destroyRef.onDestroy(() => {
      document.removeEventListener('dragover', this.gardeFichiers);
      document.removeEventListener('drop', this.gardeFichiers);
      this.abonnement?.unsubscribe();
      this.libererApercuLocal();
    });
  }

  protected survoler(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.types.includes('Files')) this.etat.set('glissement');
  }

  protected quitterSurvol(): void {
    if (this.etat() === 'glissement') this.etat.set(this.etatRepos());
  }

  protected deposer(event: DragEvent): void {
    event.preventDefault();
    this.etat.set(this.etatRepos());
    this.choisir(event.dataTransfer?.files ?? null);
  }

  protected choisir(fichiers: FileList | null): void {
    const fichier = fichiers?.[0];
    if (!fichier || this.etat() === 'envoi') return;
    const refus = validerImageClient(fichier);
    if (refus) {
      this.etat.set('erreur');
      this.erreur.set(refus);
      this.annonce.set(`Image refusée. ${refus}`);
      return;
    }
    this.clePrecedente = this.cle();
    this.nomFichier.set(fichier.name);
    this.libererApercuLocal();
    this.objetUrl = URL.createObjectURL(fichier);
    this.apercuLocal.set(this.objetUrl);
    this.etat.set('envoi');
    this.progression.set(0);
    this.erreur.set(null);
    this.envoiEnCours.emit(true);
    this.annonce.set(`Envoi de ${fichier.name} en cours.`);
    this.abonnement?.unsubscribe();
    this.abonnement = this.service.envoyer(fichier).subscribe({
      next: etape => {
        if ('pourcentage' in etape) {
          this.progression.set(etape.pourcentage);
        } else {
          this.cle.set(etape.cle);
          this.etat.set('succes');
          this.envoiEnCours.emit(false);
          this.annonce.set('Image envoyée.');
        }
      },
      error: err => {
        this.abonnement = null;
        this.cle.set(this.clePrecedente);
        this.etat.set('erreur');
        const message = messageErreur(err);
        this.erreur.set(message);
        this.envoiEnCours.emit(false);
        this.annonce.set(`Échec de l’envoi. ${message}`);
      },
    });
  }

  protected annuler(): void {
    this.abonnement?.unsubscribe();
    this.abonnement = null;
    this.cle.set(this.clePrecedente);
    this.etat.set(this.etatRepos());
    this.envoiEnCours.emit(false);
    this.annonce.set('Envoi annulé.');
  }

  protected supprimer(): void {
    this.abonnement?.unsubscribe();
    this.abonnement = null;
    this.cle.set(null);
    this.apercu.set(null);
    this.libererApercuLocal();
    this.nomFichier.set(null);
    this.etat.set('vide');
    this.erreur.set(null);
    this.envoiEnCours.emit(false);
    this.annonce.set('Photo supprimée.');
  }

  private etatRepos(): Etat {
    return this.cle() || this.apercu() || this.apercuLocal() ? 'succes' : 'vide';
  }

  private libererApercuLocal(): void {
    if (this.objetUrl) {
      URL.revokeObjectURL(this.objetUrl);
      this.objetUrl = null;
    }
    this.apercuLocal.set(null);
  }
}
