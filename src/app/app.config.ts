import { ApplicationConfig } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAuth } from './auth/auth.provider';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { WonderPush } from '@awesome-cordova-plugins/wonderpush/ngx';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
		provideIonicAngular(),
		WonderPush,
		provideHttpClient(
			withInterceptors([ ErrorInterceptor]) // ✅ Provide interceptors properly
		),
		provideRouter(routes, withPreloading(PreloadAllModules)),
		...provideAuth(), // ✅ AuthService, APP_INITIALIZER, and related services
		DatePipe,
		CurrencyPipe,
		TitleCasePipe
	]
};
