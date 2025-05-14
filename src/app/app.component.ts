import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RadarApiService } from './core/rest/radar-api.service';
import { UserAuthService } from './auth/user-auth.service';
import { combineLatest, filter, lastValueFrom, Subject, Subscription, take, takeUntil, tap } from 'rxjs';
import { ChatApiService } from './core/rest/chat-api.service';
import { ChatLastRead, UpdateChatLastRead } from './core/models/chat/chat-message.model';
import { ChatService } from './core/services/chat.service';
import { EventApiService } from './core/rest/event-api.service';
import { DateTime } from 'luxon';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Router } from '@angular/router';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { StatusBar } from '@capacitor/status-bar';
import { Platform } from "@ionic/angular";
import { AuthService } from 'ionic-appauth';
import { Browser } from '@capacitor/browser';

// SafeArea.enable({
// 	config: {
// 		customColorsForSystemBars:true,
// 		statusBarColor: '#00000000', // transparent
// 		statusBarContent: 'light',
// 		navigationBarColor: '#00000000', // transparent
// 		navigationBarContent: 'light',
// 	}
// });
@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html',
	imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
	private appStateListener: any;
	private isActive = false;

	constructor(private radarMapApiService: RadarApiService, private router: Router, private ngZone: NgZone,
		private authService: AuthService, private chatService: ChatService) {
	}

	async initApp() {
		if (Capacitor.isNativePlatform()) {
			await EdgeToEdge.enable();
			console.log('[AppComponent] ngOnInit: Registering appStateChange listener');
			this.appStateListener = App.addListener('appStateChange', ({ isActive }) => {
				console.log(`[AppComponent] appStateChange: isActive=${isActive}`);
				if (isActive && !this.isActive) {
					console.log('[AppComponent] App moved to foreground → connectToAllRooms');
					this.isActive = true;
					this.chatService.connectToAllRooms();
				} else if (!isActive && this.isActive) {
					console.log('[AppComponent] App moved to background → disconnectAllRooms');
					this.isActive = false;
					this.chatService.disconnectAllRooms();
				}
			});


			App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
				const url = event.url;
				console.log('[AppListener] URL:', url);

				console.log('redirect', this.authService.authConfig.end_session_redirect_url);

				this.ngZone.run(() => {
					// 1. Handle Keycloak login redirect
					if (url.indexOf(this.authService.authConfig.redirect_url) >= 0) {
						console.log('🔐 Handling Keycloak login redirect');
						this.authService.authorizationCallback(url);
						return;
					}

					// 2. Handle Keycloak logout redirect
					if (url.indexOf(this.authService.authConfig.end_session_redirect_url) >= 0) {
						console.log('🔓 Handling Keycloak logout redirect');
						this.authService.endSessionCallback();
						this.router.navigate(['/'], { replaceUrl: true });
						setTimeout(() => location.reload(), 200);
						return;
					}

					// 3. Handle custom deep links (e.g., from WonderPush)
					if (url.includes('""app.com')) {
						const slug = url.split('.com').pop();
						console.log('🌐 Handling deep link', slug);
						if (slug) {
							if (slug.includes('chats')) {
								const eventId = slug.split('/').pop();
								if (eventId) {
									this.router.navigate(['/chats', eventId]);
								}
							} else if (slug.includes('event-detail')) {
								const eventId = slug.split('/').pop();
								if (eventId) {
									this.router.navigate(['/events', eventId]);
								}
							} else if (slug.includes('profile')) {
								const userId = slug.split('/').pop();
								this.router.navigate(['/profile', userId ?? '']);
							} else {
								Browser.open({ url });
							}
						} else {
							Browser.open({ url });
						}
					}
				});
			});

		}
	}

	async ngOnInit() {
		this.initApp();
		this.radarMapApiService.init();

		// Initial connection when app starts
		console.log('[AppComponent] Initial app start → connectToAllRooms');
		this.isActive = true;
		this.chatService.connectToAllRooms();
	}

	ngOnDestroy() {
		console.log('[AppComponent] ngOnDestroy: Removing listener and disconnecting');
		this.appStateListener?.remove();
		this.chatService.disconnectAllRooms();
	}

}
