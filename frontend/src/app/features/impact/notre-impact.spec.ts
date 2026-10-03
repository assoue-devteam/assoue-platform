import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotreImpactPageComponent } from './notre-impact-page.component';

describe('page Notre impact', () => {
  it('affiche les chiffres de la plaquette dès le rendu, avant toute animation', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotreImpactPageComponent);
    fixture.detectChanges();
    const chiffres = [...fixture.nativeElement.querySelectorAll('.chiffre strong')]
      .map((el: HTMLElement) => el.textContent!.replace(/\s/g, ''));
    expect(chiffres).toEqual(['400670', '801', '1857', '5']);
  });
});
