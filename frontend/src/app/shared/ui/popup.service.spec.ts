import { TestBed } from '@angular/core/testing';
import { PopupService } from './popup.service';

describe('PopupService', () => {
  it('ne garde qu’un seul panneau ouvert : la fermeture ne touche pas aux autres', () => {
    const service = TestBed.inject(PopupService);
    expect(service.ouvert()).toBeNull();

    service.signalerOuverture('compte');
    expect(service.ouvert()).toBe('compte');

    service.signalerOuverture('burger');
    expect(service.ouvert()).toBe('burger');

    service.signalerFermeture('compte');
    expect(service.ouvert()).toBe('burger');

    service.signalerFermeture('burger');
    expect(service.ouvert()).toBeNull();
  });
});
