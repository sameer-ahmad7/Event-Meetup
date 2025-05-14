import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subscription, take } from "rxjs";
import { User } from "../models/user.models";
import { UserNotification } from "../models/user-notification.models";
import { UserNotificationApiService } from "../rest/user-notification-api.service";
import { environment } from "../../../environments/environment";
import { AuthService } from "ionic-appauth";
import { UserAuthService } from 'src/app/auth/user-auth.service';

@Injectable({
	providedIn: 'root'
})
export class NotificationService implements OnDestroy {
	DELAY_NOTIFICATIONS: number = environment.delayNotifications;
	private _notifications$: BehaviorSubject<UserNotification[]> = new BehaviorSubject<UserNotification[]>([]);
	private _notificationSubscription$!: Subscription;
	private _isLoading$ = new BehaviorSubject<boolean>(true);
	private _notifications: UserNotification[] = [];

	showUnread: boolean = false;
	// Username
	username: string = '';
	user!: User;
	private _unreadNotifications$ = new BehaviorSubject<number>(0);
	public numberEventRequest: number = 0;
	public numberNotifications: number = 0;
	public unreadNotifications: number = 0;

	private lockNotificationRefresh: boolean = false;

	constructor(
		private userNotificationApiService: UserNotificationApiService,
		private auth: AuthService,
		private userAuth: UserAuthService) {
		// console.log("DEBUG# NotificationService constructor")
	}

	async loadNotifications() {
		if (this.userAuth.isTokenValid()) {
			if (!this._isLoading$.getValue()) {
				this._isLoading$.next(true);
			}
			this.userNotificationApiService
				.getUserNotifications()
				.pipe(take(1))
				.subscribe(notifications => {
					// Notifications
					console.log(notifications);
					this._notifications = notifications;
					this._notifications$.next(this._notifications);
					this.setNumberEventRequest(notifications);
					this.setNumberNotifications(notifications);
					this.setUnreadNotificationsNumber(notifications);
					this._isLoading$.next(false);
				});
		}
	}

	getNotificationEvents(token: string) {
		this.userNotificationApiService.subscribeToNotifications(token).subscribe(
			data => {
				if (data) {
					const notification: UserNotification = data as any;
					this._notifications.push(notification);
					this._notifications$.next(this._notifications);
					this.setNumberEventRequest(this._notifications);
					this.setNumberNotifications(this._notifications);
					this.setUnreadNotificationsNumber(this._notifications);
				}
			}
		);
	}

	setUnreadNotificationsNumber(notifications: UserNotification[]) {
		this.unreadNotifications = notifications.filter(notification => !notification.isRead).length;
		this._unreadNotifications$.next(this.unreadNotifications);
	}

	setNumberEventRequest(notifications: UserNotification[]) {
		this.numberEventRequest = notifications.filter(notification => notification.notificationType === 'EVENT_REQUEST').length;
	}

	setNumberNotifications(notifications: UserNotification[]) {
		this.numberNotifications = notifications.length;
	}

	lockNotification() {
		this.lockNotificationRefresh = true;
	}

	unlockNotification() {
		this.lockNotificationRefresh = false;
	}

	resetNotificationsNumber() {
		this.numberEventRequest = 0;
	}

	unSubscribeNotifications() {
		this._notificationSubscription$?.unsubscribe();
	}

	//call this to reset notifications
	setNotificationsReadAndLoad() {
		this.userNotificationApiService
			.setNotificationsRead()
			.pipe(take(1))
			.subscribe();
	}

	get loading$() {
		return this._isLoading$.asObservable();
	}

	get notifications$() {
		return this._notifications$.asObservable();
	}

	get unreadNotifications$() {
		return this._unreadNotifications$.asObservable();
	}

	ngOnDestroy(): void {
		this.unSubscribeNotifications();
	}

}
