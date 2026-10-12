import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotDePasseOubliePageComponent } from './mot-de-passe-oublie-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('MotDePasseOubliePageComponent code validation', () => {
  let fixture: ComponentFixture<MotDePasseOubliePageComponent>;
  let component: MotDePasseOubliePageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotDePasseOubliePageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MotDePasseOubliePageComponent);
    component = fixture.componentInstance;
    component.etape.set('code');
    fixture.detectChanges();
  });

  it('devrait valider un code à 6 chiffres', () => {
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(inputEl).toBeTruthy();

    inputEl.value = '123764';
    inputEl.dispatchEvent(new Event('input'));
    inputEl.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    console.log('INPUT VALUE:', inputEl.value);
    console.log('FORM CONTROL VALUE:', component.formCode.controls.code.value);
    console.log('FORM CONTROL VALID:', component.formCode.controls.code.valid);
    console.log('FORM CONTROL ERRORS:', component.formCode.controls.code.errors);
    console.log('ERREUR CHAMP:', component.erreurChamp(component.formCode, 'code'));

    expect(component.formCode.controls.code.valid).toBeTrue();
  });
});
