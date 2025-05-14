import { Platform } from '@ionic/angular';
import { Requestor, StorageBackend } from '@openid/appauth';
import { AuthService, Browser } from 'ionic-appauth';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { environment } from 'src/environments/environment';
import { inject, NgZone } from '@angular/core';
import { ToastLogService } from "../../core/services/toast-log.service";
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

export const authFactory = (platform: Platform, ngZone: NgZone,
	requestor: Requestor, browser: Browser, storage: StorageBackend,
	log: ToastLogService) => {
	// log.debug("AuthFactory");

	const authService = new AuthService(browser, storage, requestor);
	authService.authConfig = environment.auth_config;

	console.log('cordova', platform.is('cordova'));
	console.log('capacitor', platform.is('capacitor'));

	const router = inject(Router);


	if (!Capacitor.isNativePlatform()) {
		console.log('url', window.location.origin);
		authService.authConfig.redirect_url = window.location.origin + '/callback';
		authService.authConfig.end_session_redirect_url = window.location.origin + '/login';
	}

	return authService;
};
