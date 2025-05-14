import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { register } from 'swiper/element/bundle';
import { appConfig } from './app/app.config';

register();

bootstrapApplication(AppComponent, appConfig);
