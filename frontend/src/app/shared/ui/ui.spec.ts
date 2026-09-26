import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonDirective } from './button.directive';
import { ControlDirective, FieldComponent } from './field.component';
import { StatusBadgeComponent } from './status-badge.component';
import { AlertComponent } from './alert.component';
import { ModalComponent } from './modal.component';
import { ToastsComponent } from './toast';
import { EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from './states';
import { FilterChipsComponent, QuantityStepperComponent, TabsComponent } from './selectors';

@Component({
  standalone: true,
  imports: [ButtonDirective, FieldComponent, ControlDirective],
  template: `
    <button appButton="purchase" [loading]="loading()" (click)="clics = clics + 1">Payer</button>
    <app-field label="Email" hint="Votre email" [error]="erreur()">
      <input appControl class="input" />
    </app-field>
  `,
})
class HoteComponent {
  loading = signal(false);
  erreur = signal<string | null>(null);
  clics = 0;
}

@Component({
  standalone: true,
  imports: [
    StatusBadgeComponent, AlertComponent, ModalComponent, ToastsComponent, SkeletonComponent,
    EmptyStateComponent, ErrorStateComponent, QuantityStepperComponent, FilterChipsComponent, TabsComponent,
  ],
  template: `
    <app-status-badge code="PAYEE" />
    <app-alert tone="error" titre="Erreur">Détail</app-alert>
    <app-modal titre="Confirmer" [(open)]="ouverte">Corps</app-modal>
    <app-toasts />
    <app-skeleton [lignes]="2" />
    <app-empty-state message="Aucune commande" />
    <app-error-state type="reseau" [reessayable]="true" />
    <app-quantity-stepper [(value)]="quantite" />
    <app-filter-chips label="Catégories" [options]="options" [(selected)]="choix" />
    <app-tabs label="Statut" [options]="options" [(selected)]="choix" />
  `,
})
class VitrineComponent {
  ouverte = signal(false);
  quantite = signal(1);
  choix = signal('a');
  options = [{ valeur: 'a', libelle: 'Tout' }, { valeur: 'b', libelle: 'Bijoux' }];
}

describe('vitrine des composants', () => {
  it('rend chaque composant avec son texte et ses rôles ARIA', () => {
    const fixture = TestBed.createComponent(VitrineComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-status-badge')!.textContent).toContain('Payée');
    expect(el.querySelector('app-alert')!.getAttribute('role')).toBe('alert');
    expect(el.querySelector('app-error-state')!.textContent).toContain('Pas de connexion');

    const chips = el.querySelectorAll('app-filter-chips button');
    (chips[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.choix()).toBe('b');
    expect(el.querySelector('[role="tab"][aria-selected="true"]')!.textContent).toContain('Bijoux');

    const plus = el.querySelector('app-quantity-stepper button[aria-label="Augmenter"]') as HTMLButtonElement;
    plus.click();
    expect(fixture.componentInstance.quantite()).toBe(2);
  });

  it('ouvre la modale via <dialog>', () => {
    const fixture = TestBed.createComponent(VitrineComponent);
    fixture.detectChanges();
    fixture.componentInstance.ouverte.set(true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('dialog') as HTMLDialogElement).open).toBeTrue();
  });
});

describe('composants partagés', () => {
  function creer() {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    return { fixture, hote: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('appButton bloque les clics pendant le chargement (double initiation)', () => {
    const { fixture, hote, el } = creer();
    const bouton = el.querySelector('button')!;

    bouton.click();
    expect(hote.clics).toBe(1);

    hote.loading.set(true);
    fixture.detectChanges();
    bouton.click();
    expect(hote.clics).toBe(1);
    expect(bouton.getAttribute('aria-busy')).toBe('true');
    expect(bouton.classList).toContain('btn--purchase');
  });

  it('app-field relie le label, l\'aide et l\'erreur au champ natif', () => {
    const { fixture, hote, el } = creer();
    const champ = el.querySelector('input')!;
    const label = el.querySelector('label')!;

    expect(label.getAttribute('for')).toBe(champ.id);
    expect(champ.getAttribute('aria-describedby')).toBe(`${champ.id}-aide`);
    expect(champ.hasAttribute('aria-invalid')).toBeFalse();

    hote.erreur.set('Email invalide');
    fixture.detectChanges();
    expect(champ.getAttribute('aria-describedby')).toBe(`${champ.id}-aide ${champ.id}-erreur`);
    expect(champ.getAttribute('aria-invalid')).toBe('true');
  });
});
