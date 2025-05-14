import { Injectable } from '@angular/core';
import { DatePipe } from "@angular/common";
import { NotificationService } from "./notification.service";
import { LoadingBackdropService } from "./loading-backdrop.service";
import { environment } from "../../../environments/environment";
import { EventItem } from "../models/event-item.model";
import { Capacitor } from "@capacitor/core";
import { AuthService } from "ionic-appauth";
import { AlertController, Platform } from "@ionic/angular";
import { User } from "../models/user.models";
import { ToastService } from './toast.service';
import { UserAvatar } from "../models/user-avatar.model";

@Injectable({
	providedIn: 'root'
})
export class SharedService {
	notificationOpen: boolean = false;
	popupOpen: boolean = false;
	removePaddingContainer = false;
	hideFab = false;

	constructor(private datepipe: DatePipe,
		private alertController: AlertController,
		private auth: AuthService,
		private platform: Platform,
		private backdropService: LoadingBackdropService,
		private toastr: ToastService,
		private notificationService: NotificationService) {
	}

	logDebug(msg: string) {
		// this.log.debug(msg);
	}

	openCloseNotification() {
		if (this.notificationOpen) {
			// this.notificationService.unlockNotification();
			this.notificationService.setNotificationsReadAndLoad();
		} else {
			this.notificationService.resetNotificationsNumber();
			// this.notificationService.lockNotification();
		}
		this.notificationOpen = !this.notificationOpen;
	}

	openNotification(open: boolean) {
		this.notificationOpen = open;
	}

	showToast(msg: string) {
		this.toastr.show(msg);
	}

	isNotificationOpen() {
		return this.notificationOpen;
	}

	isPopupOpen() {
		return this.popupOpen;
	}

	async openConfirmDialog(title: string, body: string): Promise<boolean> {
		if (this.isPopupOpen()) {
			return false;
		}
		const notificationAlreadyClosed = !this.notificationOpen;
		if (!notificationAlreadyClosed) {
			this.openNotification(false);
		}
		this.popupOpen = true;
		return new Promise(async (resolve) => {
			const alert = await this.alertController.create({
				header: title,
				message: body,
				buttons: [
					{
						text: 'Cancel',
						role: 'cancel',
						handler: () => {
							this.popupOpen = false;
							if (!notificationAlreadyClosed) {
								this.openNotification(true);
							}
							resolve(false);
						}
					},
					{
						text: 'Confirm',
						handler: () => {
							this.popupOpen = false;
							if (!notificationAlreadyClosed) {
								this.openNotification(true);
							}
							resolve(true);
						}
					}
				]
			})
			await alert.present();

		});
	}

	async openMessageDialog(title: string, body: string, labelButton: string = "Let's do it!"): Promise<boolean> {
		if (this.isPopupOpen()) {
			return false;
		}
		const notificationAlreadyClosed = !this.notificationOpen;
		if (!notificationAlreadyClosed) {
			this.openNotification(false);
		}
		this.popupOpen = true;
		return new Promise(async resolve => {
			const alert = await this.alertController.create({
				message: body,
				header: title,
				buttons: [{
					text: labelButton,
					handler: () => {
						this.popupOpen = false;
						if (!notificationAlreadyClosed) {
							this.openNotification(true);
						}
						return true;
					}
				}]
			})
		});
	}

	showBackdrop() {
		this.backdropService.show()
		setTimeout(() => {
			this.hideBackdrop();
		}, 5000);
	}

	getParticipantName(participant: UserAvatar): string {
		return participant.firstName + " " + participant.lastName;
	}

	public async signOut() {
		await this.auth.signOut();
	}

	hideBackdrop() {
		this.backdropService.hide()
	}


	getFormattedDateTomorrow(): string {
		const minDate = new Date();
		minDate.setDate(minDate.getDate() + 1);
		const formattedDate = <string>this.datepipe.transform(minDate, 'yyyy-MM-dd');
		return formattedDate
	}

	getFormattedDateToday(): string {
		const maxDate = new Date();
		maxDate.setDate(maxDate.getDate());
		const formattedDate = <string>this.datepipe.transform(maxDate, 'yyyy-MM-dd');
		return formattedDate
	}

	getMajorDate(): string {
		const maxDate = new Date();
		maxDate.setDate(maxDate.getDate());
		maxDate.setFullYear(maxDate.getFullYear() - 18);
		return <string>this.datepipe.transform(maxDate, 'yyyy-MM-dd')
	}

	getImageUrl(endpoint: string) {
		return environment.minioHost + (endpoint.startsWith('/') ? '' : '/') + endpoint;
	}

	getImageB64(img: string) {
		return img.includes('data:image') ? img : 'data:image/png;base64,' + img;
	}

	switchRemovePaddingContainer() {
		this.removePaddingContainer = !this.removePaddingContainer;
	}

	scrollTop() {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}

	hideFloatingButtons(hide: boolean) {
		this.hideFab = hide;
	}

	showFloatingButtons() {
		return !this.hideFab;
	}

	getAcceptedParticipants(event: EventItem) {
		return event.participants.filter(p => ['ACCEPTED', 'OWNER'].includes(p.userEventStatus));
	}

	getLastChangeTime(lastChange: Date) {
		const now = new Date();
		const seconds = Math.abs((new Date(lastChange).getTime() - now.getTime()) / 1000);
		if (seconds < 60) {
			return "just " + Math.floor(seconds) + " seconds ago";
		} else if (seconds < 3600) {
			return Math.floor(seconds / 60) + " minutes ago";
		} else if (seconds < 62400) {
			return Math.floor(seconds / 3600) + " hours ago";
		} else {
			const days = Math.floor(seconds / 62400)
			if (days / 7 >= 1 && days / 31 < 1) {
				return Math.floor(days / 7) + " week ago"
			} else if (days / 31 >= 1 && days / 365 < 1) {
				return Math.floor(days / 31) + " month ago";
			} else if (days / 365 >= 1) {
				return Math.floor(days / 365) + " years ago";
			} else {
				return days + " days ago";
			}
		}

	}

	isNativePlatform(): boolean {
		return Capacitor.isNativePlatform();
	}

	isIos(): boolean {
		return this.platform.is('ios');
	}

	isWebPlatform(): boolean {
		return !Capacitor.isNativePlatform();
	}

	getUrlEvent(eventId: string) {
		return environment.host + "/event-detail/" + eventId;
	}

	getInviteFriendsMsg(event: EventItem) {
		const msg = 'Join with me this "" event: ' + this.getUrlEvent(event.eventId);
		return msg;
	}

}
