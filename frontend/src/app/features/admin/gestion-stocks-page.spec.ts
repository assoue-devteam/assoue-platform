import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GestionService } from './gestion.service';
import { GestionStocksPageComponent } from './gestion-stocks-page.component';

describe('gestion des stocks', () => {
  function creer(ajuster: GestionService['ajusterStock']) {
    TestBed.configureTestingModule({
      providers: [{
        provide: GestionService,
        useValue: {
          stocksProduits: () => of([]),
          stocksMatieres: () => of([]),
          produits: () => of([]),
          ajusterStock: ajuster,
        },
      }],
    });
    const fixture = TestBed.createComponent(GestionStocksPageComponent);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as unknown as Record<string, (...args: never[]) => void> };
  }

  it('affiche le message serveur en cas de modification concurrente (409)', () => {
    const { fixture, page } = creer((() => throwError(() => new HttpErrorResponse({
      status: 409,
      error: { message: 'La quantité a changé entre-temps. Rechargez la page.' },
    }))) as GestionService['ajusterStock']);
    (fixture.componentInstance as unknown as { editions: Record<number, number> }).editions = { 3: 7 };
    page['enregistrer']({ produitId: 3, produitNom: 'Tabouret', quantite: 5 } as never);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La quantité a changé entre-temps. Rechargez la page.');
  });
});
