import { inject, provideAppInitializer, EnvironmentInjector, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Requestor, StorageBackend } from '@openid/appauth';
import { HttpClient } from '@angular/common/http';
import { AuthService, Browser } from 'ionic-appauth';
import { CapacitorBrowser, CapacitorSecureStorage } from 'ionic-appauth/lib/capacitor';
import { authFactory } from './factories';
import { httpFactory } from './factories/http.factory';
import { UserAuthService } from './user-auth.service';
import { ToastService } from '../core/services/toast.service';
import { ToastLogService } from '../core/services/toast-log.service';

// ✅ Correctly use EnvironmentInjector within the initializer
export function initializeUserAuth(): () => Promise<void> {
	return () => {
		const injector = inject(EnvironmentInjector); // ✅ Get injector
		return injector.runInContext(() => {
			const userAuth = injector.get(UserAuthService); // ✅ Properly get service
			return userAuth.loadUserFromStorage(); // Ensure this returns a Promise
		});
	};
}

export function provideAuth(): any[] {
	return [
		{
			provide: StorageBackend,
			useClass: CapacitorSecureStorage
		},
		{
			provide: Requestor,
			useFactory: httpFactory,
			deps: [Platform, HttpClient]
		},
		{
			provide: Browser,
			useClass: CapacitorBrowser
		},
		{
			provide: AuthService,
			useFactory: authFactory,
			deps: [Platform, NgZone, Requestor, Browser, StorageBackend, ToastLogService, ToastService]
		},
		provideAppInitializer(initializeUserAuth()) // ✅ Correct replacement for `APP_INITIALIZER`
	];
}
