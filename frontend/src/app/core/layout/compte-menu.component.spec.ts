import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CompteMenuComponent } from './compte-menu.component';

describe('CompteMenuComponent', () => {
  const evenements = new Subject<unknown>();
  const deconnecter = jasmine.createSpy('deconnecter');
  const naviguer = jasmine.createSpy('navigateByUrl');

  function creer() {
    TestBed.configureTestingModule({
      // RouterLink réel exigerait ActivatedRoute : on le retire, les liens restent
      // des ancres inertes et la fermeture est testée via la délégation (click).
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: AuthService,
          useValue: {
            email: () => 'awa.ouedraogo@example.com',
            aRole: (role: string) => role === 'CLIENT',
            deconnecter,
          },
        },
        {
          provide: Router,
          useValue: { events: evenements.asObservable(), navigateByUrl: naviguer },
        },
      ],
    });
    TestBed.overrideComponent(CompteMenuComponent, { remove: { imports: [RouterLink] } });
    const fixture = TestBed.createComponent(CompteMenuComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const declencheur = () => el.querySelector<HTMLButtonElement>('.compte__bouton')!;
    const ouvrir = () => {
      declencheur().click();
      fixture.detectChanges();
    };
    return { fixture, el, declencheur, ouvrir };
  }

  beforeEach(() => {
    deconnecter.calls.reset();
    naviguer.calls.reset();
  });

  it('expose un bouton disclosure lié au panneau (aria-expanded, aria-controls)', () => {
    const { el, declencheur, ouvrir } = creer();
    expect(declencheur().getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('.compte__menu')).toBeNull();

    ouvrir();
    const panneau = el.querySelector('.compte__menu') as HTMLElement;
    expect(declencheur().getAttribute('aria-expanded')).toBe('true');
    expect(declencheur().getAttribute('aria-controls')).toBe(panneau.id);
    expect(panneau.querySelector('a')).toBeTruthy();
  });

  it('ferme au clic extérieur, pas au clic à l’intérieur', () => {
    const { fixture, el, ouvrir } = creer();
    ouvrir();
    el.querySelector('.compte__menu')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeTruthy();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
  });

  it('ferme sur Échap et rend le focus au déclencheur', () => {
    const { fixture, el, declencheur, ouvrir } = creer();
    ouvrir();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
    expect(document.activeElement).toBe(declencheur());
  });

  it('ferme quand le focus quitte le panneau au clavier (Tab)', () => {
    const { fixture, el, ouvrir } = creer();
    ouvrir();
    const panneau = el.querySelector('.compte__menu')!;
    panneau.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
  });

  it('ferme après le clic sur un lien ou sur « Se déconnecter »', () => {
    const { fixture, el, ouvrir } = creer();
    ouvrir();
    (el.querySelector('.compte__menu a') as HTMLAnchorElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();

    ouvrir();
    (el.querySelector('.compte__menu button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
    expect(deconnecter).toHaveBeenCalled();
    expect(naviguer).toHaveBeenCalledWith('/');
  });

  it('ferme à chaque changement de route', () => {
    const { fixture, el, ouvrir } = creer();
    ouvrir();
    evenements.next(new NavigationStart(1, '/commandes'));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
  });

  it('ne ferme pas au scroll interne ni quand le focus est dans le menu', () => {
    const { fixture, el, ouvrir } = creer();
    ouvrir();
    const panneau = el.querySelector('.compte__menu') as HTMLElement;
    // Sans RouterLink (retiré, voir creer()), l'ancre n'a pas de href donc pas
    // focusable : on le pose à la main comme le ferait le routeur en production.
    const lien = panneau.querySelector('a') as HTMLAnchorElement;
    lien.setAttribute('href', '/commandes');
    lien.focus();
    document.dispatchEvent(new Event('scroll', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeTruthy();

    (document.activeElement as HTMLElement).blur();
    document.dispatchEvent(new Event('scroll', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.compte__menu')).toBeNull();
  });
});
