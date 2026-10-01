import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Service worker réservé à la prod (PWA offline COL-01) : en dev, le shell
    // mis en cache fige l'app entre deux rebuilds et affiche une page blanche.
    if (environment.production && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      void navigator.serviceWorker.register('/sw.js');
    }
  })
  .catch((err) => console.error(err));
