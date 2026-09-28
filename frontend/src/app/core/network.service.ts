import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly enLigne = signal(navigator.onLine);

  constructor() {
    const maj = () => this.enLigne.set(navigator.onLine);
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', maj);
      window.removeEventListener('offline', maj);
    });
  }
}
