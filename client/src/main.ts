import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'sweetalert2/src/sweetalert2.scss';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
