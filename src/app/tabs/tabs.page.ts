import { Component, EnvironmentInjector, inject, OnDestroy, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonModal, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, chatbubbles, calendar, notifications, add } from 'ionicons/icons';
import { ProfileMenuPage } from '../shared/profile-menu/profile-menu.page';
import { User } from '../core/models/user.models';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { UserAuthService } from '../auth/user-auth.service';
import { SharedService } from '../core/services/shared.service';
import { AvatarModule } from 'ngx-avatars';
import { OverlayEventDetail } from '@ionic/core';
import { NotificationService } from '../core/services/notification.service';
import { PushNotificationService } from '../core/rest/wonderpush-api.service';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { NotificationPermissionComponent } from '../shared/notification-permission/notification-permission.component';
import { LocationPermissionComponent } from '../shared/location-permission/location-permission.component';
import { App } from '@capacitor/app';
import { ModalController } from '@ionic/angular/standalone';
import { RadarApiService } from '../core/rest/radar-api.service';
import { AddressService } from '../services/address.service';
import { ChatApiService } from '../core/rest/chat-api.service';
import { ChatLastRead } from '../core/models/chat/chat-message.model';
import { ChatService } from '../core/services/chat.service';
import { XmppService } from '../core/services/xmpp.service';
import { EventApiService } from '../core/rest/event-api.service';
import { DateTime } from 'luxon';

@Component({
	selector: 'app-tabs',
	templateUrl: 'tabs.page.html',
	styleUrls: ['tabs.page.scss'],
	providers: [ModalController],
	imports: [IonBadge, IonTabs, IonTabBar, IonTabButton, IonIcon, IonModal,
		AvatarModule, NotificationPermissionComponent, LocationPermissionComponent,
		ProfileMenuPage],
})
export class TabsPage implements OnInit, OnDestroy {
	wasInBackground = false;
	user!: User;
	user$!: Subscription;
	openMenu = false;
	showNotifications = false;
	showLocations = false;
	notificationDenied = true;
	locationDenied = true;
	private destroy$ = new Subject<void>();
	isInit = true;
	isNotificationShown = false;
	isLocationShown = false;
	unreadChatCount=0;
	isTryPermission=true;

	constructor(private userAuthService: UserAuthService, public sharedService: SharedService, private modalCtrl: ModalController,
		private notificationService: NotificationService, private pushNotificationService: PushNotificationService,private eventApiService:EventApiService,
		private chatApiService: ChatApiService, private addressService: AddressService,private chatService:ChatService
	) {
		addIcons({ home, chatbubbles, calendar, notifications, add });
	}
	ngOnInit() {

		this.chatService.chatCountMap$.pipe(takeUntil(this.destroy$))
		.subscribe(chatCountMap=>{
			let unreadCount=0;
			if(chatCountMap && Object.keys(chatCountMap).length>0){
				for(const count in chatCountMap){
				unreadCount+=chatCountMap[count];
				}
				this.unreadChatCount=unreadCount;
			}
			console.log(this.unreadChatCount);
		});



		this.subscribeNotifications();

		if (Capacitor.isNativePlatform()) {
			this.addAppListener();
		}

		this.pushNotificationService.showNotifications$
			.pipe(takeUntil(this.destroy$))
			.subscribe(showNotifications => {
				if (showNotifications) {
					this.showNotifications = true;
					this.notificationDenied = true;
				}
			});

		this.user = this.userAuthService.currentUser();
		if (this.user) {
			if (this.isInit) {
					this.checkNotificationsAndLocation();
				this.isInit = false;
			}
		}


		this.notificationService.loadNotifications();
	}



	addAppListener() {

		App.addListener('pause', () => {
			console.log('App moved to the background');
			this.wasInBackground = true; // Set flag that app lost focus
		});

		App.addListener('resume', async () => {
			console.log('App resumed');

			if (this.wasInBackground) {
				console.log('App regained focus after background');

				// Reset flag
				this.wasInBackground = false;

				const notificationStatus = await PushNotifications.checkPermissions();

				console.log(notificationStatus.receive);
				console.log(this.isNotificationShown);
				console.log(this.locationDenied);

				if(this.isTryPermission){

				if (!this.isNotificationShown && !this.locationDenied && notificationStatus.receive !== 'denied') {
					const permissionStatus = await PushNotifications.requestPermissions();
					this.isTryPermission=false;
					console.log('Notification permission status:', permissionStatus);

					if (permissionStatus.receive === 'granted') {
						console.log('User has enabled notifications, subscribing to Wonderpush...');
						this.notificationDenied = false;
						this.pushNotificationService.init(this.user);
					} else {
						console.log('Notifications are still disabled.');
					}

				}

				else if (this.notificationDenied && this.isNotificationShown) {
					// Check notification permission status
					const permissionStatus = await PushNotifications.requestPermissions();
					console.log('Notification permission status:', permissionStatus);
					this.isTryPermission=false;;

					if (permissionStatus.receive === 'granted') {
						console.log('User has enabled notifications, subscribing to Wonderpush...');
						this.notificationDenied = false;
						this.pushNotificationService.init(this.user);
					} else {
						console.log('Notifications are still disabled.');
					}
				}
			}
			}
		});
	}

	async checkNotificationsAndLocation() {
		this.addressService.getLocation();
		if(Capacitor.isNativePlatform()){
		const locationStatus = await Geolocation.checkPermissions();
		const notificationStatus = await PushNotifications.checkPermissions();

		if (locationStatus.location === 'denied' && locationStatus.coarseLocation === 'denied' && notificationStatus.receive === 'denied') {
			this.showNotifications = true;
			this.isNotificationShown = true;
		} else {
			if (locationStatus.location === 'denied' && locationStatus.coarseLocation === 'denied') {
				this.showLocations = true;
			}
			else  {
				this.locationDenied = false;
			}
			if (notificationStatus.receive === 'denied') {
				this.showNotifications = true;
				this.isNotificationShown = true;
			}
			else if (notificationStatus.receive === 'prompt' || notificationStatus.receive === 'prompt-with-rationale') {
				console.log('prompt');
				this.notificationDenied = false;
				if (locationStatus.location === 'granted' || locationStatus.coarseLocation === 'granted' && Capacitor.getPlatform() === 'android') {
					setTimeout(async () => {
						try {
							await PushNotifications.requestPermissions();
							this.pushNotificationService.init(this.user);
						} catch (error) {
							// setTimeout(async () => {
							// 	await PushNotifications.requestPermissions();
							// }, 200);
							// this.pushNotificationService.init(this.user);
						}

					}, 200);
				}
				else {
					try {
						await PushNotifications.requestPermissions();
						this.pushNotificationService.init(this.user);
					} catch (error) {
						// setTimeout(async () => {
						// 	await PushNotifications.requestPermissions();
						// }, 200);
						// this.pushNotificationService.init(this.user);
					}

				}
			}
			else if(notificationStatus.receive==='granted') {
				this.notificationDenied = false;
				this.pushNotificationService.init(this.user);
			}
		}

	}
	}

	onNotificationDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showNotifications = false;
		if (this.locationDenied) {
			this.showLocations = true;
		}
	}

	onLocationDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showLocations = false;

	}


	async subscribeNotifications() {
		const token = this.userAuthService.getAccessToken();
		if (token) {
			this.notificationService.getNotificationEvents(token.accessToken);
		}
	}

	toggleMenu() {
		this.openMenu = !this.openMenu;
	}

	onMenuDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.openMenu = false;
	}


	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.notificationService.unSubscribeNotifications();
	}
}
