import { WonderPush } from '@awesome-cordova-plugins/wonderpush/ngx';
import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { Platform } from "@ionic/angular";
import { ActionPerformed, PushNotifications, Token } from "@capacitor/push-notifications";
import { User } from '../models/user.models';
import {  Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
	subscribedToPushNotifications = false;

	private _wonderPushWeb: any = (window as any).WonderPush || [];
	notificationSysPermission!: string;

	private wonderPushInitialized = false;

	private _showNotifications$ = new Subject<boolean>();

	constructor(private platform: Platform,
		private wonderPush: WonderPush) {

	}

	init(user: User) {
		if (this.wonderPushInitialized) {
			console.log("WonderPush already initialized")
			return;
		}
		this.wonderPushInitialized = true;

		this.platform.ready().then(async () => {
			try {
				// Step 1: Request permission for notifications
				const permission = await PushNotifications.checkPermissions();
				console.log('permission', permission);
				if (permission.receive === 'granted') {
					console.log('Push Notification permission granted');

					// Step 2: Register device for push notifications
					// await PushNotifications.register();

					// Step 3: Subscribe to WonderPush notifications
					await this.subscribeToNotifications(user);
					console.log('Subscribed to WonderPush notifications');
					

					// Step 4: Listen for incoming notifications
					this.listenToNotifications();
				} else {
					console.warn('Push Notification permission denied');
					this._showNotifications$.next(true);
				}
			} catch (error) {
				console.error('Error initializing push notifications:', error);
			}
		});
	}

	listenToNotifications() {

		// Listener when a notification is received while the app is in the foreground
		PushNotifications.addListener('pushNotificationReceived', (notification) => {
			console.log('Push notification received:', notification);
		});

		// Listener when the user taps on a notification
		PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
			console.log('Push notification action performed:', notification);
		});

	}

	onChangeEnablePushNotificationsToggle($event: any, user: User) {
		const enablePushNotifications = $event.detail.checked;
		this.subscribedToPushNotifications = enablePushNotifications;
		if (enablePushNotifications) {
			this.subscribeToNotifications(user);
		} else {
			this.unsubscribeFromNotifications();
		}
		// this.toastService.show("Push Notifications " + (enablePushNotifications ? 'enabled' : 'disabled'), 'Push Notifications', 'default');

	}

	async subscribeToNotifications(user: User) {
		if (Capacitor.isNativePlatform()) {
			try {
				const userSessionId = user.userId;
				console.log('session id',userSessionId);
				this.wonderPush.setUserId(userSessionId);
				this.wonderPush.subscribeToNotifications();
				this.subscribedToPushNotifications = true;
				// this.log.debug("Subscribed!")
				console.log('Successfully subscribed to notifications');
			} catch (error) {
				console.error('Failed to subscribe to notifications:', error);
			}

		}
	}

	public async isSubscribedToNotifications(): Promise<boolean> {
		if (Capacitor.getPlatform() === 'web') {
			return new Promise((resolve, reject) => {
				this._wonderPushWeb.ready((wonderPushSDK: any) => {
					wonderPushSDK.isSubscribedToNotifications()
						.then(resolve)
						.catch(reject);
				});
			});
		} else {
			return this.wonderPush.isSubscribedToNotifications();
		}
	}

	unsubscribeFromNotifications() {
		console.log("Unsubscribing notifications for: " + Capacitor.getPlatform())
		if (Capacitor.isNativePlatform()) {
			this.wonderPush.unsubscribeFromNotifications();

		}
	}

	// requestAndSubscribeToPushNotifications() {
	// 	this.notificationSysPermission = "calculating";
	// 	return new Promise((resolve, reject) => {
	// 		if (this.isWebPlatform()) {
	// 			this.notificationSysPermission = Notification.permission;
	// 			if (Notification.permission === 'default') {
	// 				Notification.requestPermission().then(permission => {
	// 					this.notificationSysPermission = permission;
	// 					if (permission === 'granted') {
	// 						console.log('Notification permission granted by user');
	// 						this.subscribeToNotifications();
	// 					} else if (permission === 'denied') {
	// 						console.log('Notification permission denied by user');
	// 					}
	// 					resolve(permission);
	// 				});
	// 			} else {
	// 				console.log('Permission already decided:', Notification.permission);
	// 				resolve(Notification.permission)
	// 			}
	// 		} else {
	// 			this.checkSysNotificationPermission().then(permission => {
	// 				this.log.debug("notificationSysPermission: " + permission)
	// 				this.notificationSysPermission = permission;
	// 				if (permission === 'prompt') {
	// 					this.log.debug("RequestPermissions")
	// 					PushNotifications.requestPermissions().then(permissionStatus => {
	// 						this.notificationSysPermission = permissionStatus.receive;
	// 						if (permissionStatus.receive === 'granted') {
	// 							this.log.debug("Granted")
	// 							console.log('Notification permission granted on mobile - subscribing');
	// 							this.subscribeToNotifications();
	// 						} else {
	// 							this.log.debug("Denied")
	// 							console.log('Notification permission denied on mobile');
	// 						}
	// 						resolve(permissionStatus.receive)
	// 					});
	// 				} else if (permission === 'granted') {
	// 					this.log.debug("Permission already granted - subscribing")
	// 					this.subscribeToNotifications();
	// 				}
	// 				resolve(permission)
	// 			})
	// 		}
	// 	});
	// }

	checkSysNotificationPermission(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (Capacitor.getPlatform() === 'web') {
				console.log("Notification browser permission: ", Notification.permission);
				if (!('Notification' in window)) {
					console.error('Error Notification not in window');
				} else if (Notification.permission === 'granted') {
					console.log('Notification permission granted');
				} else if (Notification.permission === 'denied') {
					console.log('Notification permission denied');
				} else {
					// Default
					console.log('Notification permission default - requesting');
				}
				resolve(Notification.permission);
			} else {
				// Mobile
				PushNotifications.checkPermissions()
					.then(permissionStatus => {
						console.log(permissionStatus);
						if (permissionStatus.receive === 'granted') {
							console.log('Notifications enabled');
						} else if (permissionStatus.receive === 'denied') {
							console.log('Notifications disabled');
						}
						resolve(permissionStatus.receive);
					});
			}

		});
	}

	private async registerPushNotifications() {
		console.log('Initializing push notifications');

		// Richiedi permessi all'utente
		let permStatus = await PushNotifications.requestPermissions();

		if (permStatus.receive === 'granted') {
			console.log('Permission granted');
			// await PushNotifications.register();
		} else {
			console.error('Permission not granted');
			return;
		}

		// Registra i callback
		PushNotifications.addListener('registration', (token: Token) => {
			console.log('Push registration success, token: ', token.value);
		});

		PushNotifications.addListener('registrationError', (error: any) => {
			console.error('Error on registration: ', error);
		});

		PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
			console.log('Push received: ', notification);
		});

		PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
			console.log('Push action performed: ', action);
		});
	}

	private isWebPlatform(): boolean {
		return Capacitor.getPlatform() === 'web';
	}

	get showNotifications$() {
		return this._showNotifications$.asObservable();
	}
}
