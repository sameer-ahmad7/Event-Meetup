import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonCard, IonLabel, IonToggle, IonItem, IonList, IonCardContent, IonBackButton, IonButtons, IonItemDivider, IonItemGroup, IonText } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { UserConfig } from 'src/app/core/models/user-config.models';
import { UserApiService } from 'src/app/core/rest/user-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';
import { PushNotificationService } from 'src/app/core/rest/wonderpush-api.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { User } from 'src/app/core/models/user.models';

@Component({
	selector: 'app-account-settings',
	templateUrl: './account-settings.page.html',
	styleUrls: ['./account-settings.page.scss'],
	standalone: true,
	imports: [IonText, IonItemGroup, IonItemDivider, IonButtons, IonBackButton, IonList, IonItem, IonToggle, IonLabel, IonSpinner, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AccountSettingsPage implements OnInit {

	isLoading = true;
	MESSAGE_TO_INSERT = "DELETE"
	userConfig!: UserConfig;
	// Auxiliar
	submitted = false;
	confirmationMessage = '';
	user!: User;
	destroy$ = new Subject<void>();

	constructor(
		public pushNotificationService: PushNotificationService,
		private toast: ToastService,
		private userServiceApi: UserApiService,
		private userAuthService: UserAuthService,
		private router: Router, private alertCtrl: AlertController,
		private sharedService: SharedService) {
		addIcons({ chevronBack });
	}

	ngOnInit() {
		this.userAuthService.user$.
			pipe(takeUntil(this.destroy$))
			.subscribe(user => {
				this.user = user as any;
			});


		this.fetchData();

	}

	fetchData() {
		this.userServiceApi.getUserConfig()
			.subscribe((userConfig: UserConfig) => {
				this.userConfig = userConfig;
				console.log(this.userConfig);
				this.isLoading = false;
			});
	}

	async onDeleteAccount() {
		const alert = await this.alertCtrl.create({
			header: 'Are you sure you want to delete your account?',
			message: 'All your data will be erased. This action cannot be undone',
			inputs: [
				{
					placeholder: 'To confirm this, type "DELETE"',
					type: 'text',
					value: this.confirmationMessage,
					attributes: {
						maxlength: 6
					},
				}
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					handler: () => {
					}
				},
				{
					text: 'Confirm',
					handler: () => {
						console.log('delete');
						this.deleteSelfAccount();
					},
					cssClass: 'confirm-btn disabled',
					htmlAttributes: {
						disabled: true
					}
				}

			]
		});
		await alert.present();
		const inputEl = alert.querySelector('input');
		const confirmBtn = alert.querySelector('.confirm-btn');
		if (inputEl && confirmBtn) {
			inputEl.addEventListener('input', () => {
				if (inputEl.value.trim() === 'DELETE') {
					confirmBtn.removeAttribute('disabled');
					confirmBtn.classList.remove('disabled')
					confirmBtn.classList.add('enabled'); // ✅ Add custom class dynamically
				} else {
					confirmBtn.setAttribute('disabled', 'true');
					confirmBtn.classList.remove('enabled'); // ✅ Remove class if input is incorrect
					confirmBtn.classList.add('disabled');
				}
			});

		}

	}

	deleteSelfAccount() {
		this.userServiceApi.deleteSelfAccount().subscribe(() => {
			this.sharedService.signOut();
		})
	}

	onViewBlockedUsers(){
		this.router.navigate(['/blocked-users']);
	}

	onClickPrivacyPolicy() {
		console.log('here');
		this.router.navigate(['privacy-policy']);
	}

	onChangePushNotifications($event: any) {
		if (this.userConfig.subscribedToPushNotification === $event.detail.checked) {
			return; // do not trigger during initialization
		}
		this.userConfig.subscribedToPushNotification = $event.detail.checked;
		this.userServiceApi.updateUserConfig(this.userConfig)
			.subscribe(() => {
				this.pushNotificationService.onChangeEnablePushNotificationsToggle($event, this.user)
				this.toast.show(this.userConfig.subscribedToPushNotification
					? "Push Notifications enabled"
					: "Push Notifications disabled");
			});
	}

	onChangeSubscribeNewsletterToggle($event: any) {
		if (this.userConfig.subscribedToNewsletter === $event.detail.checked) {
			return; // do not trigger during initialization
		}
		this.userConfig.subscribedToNewsletter = $event.detail.checked;
		this.userServiceApi.updateUserConfig(this.userConfig)
			.subscribe(() => {
				console.log('here');
				this.toast.show(this.userConfig.subscribedToNewsletter
					? "Subscribed to the newsletter"
					: "Unsubscribed from the newsletter");
			});
	}

	onChangeUserSubscribesEventEmailToggle($event: any) {
		if (this.userConfig.emailNewRequests === $event.detail.checked) {
			return; // do not trigger during initialization
		}
		this.userConfig.emailNewRequests = $event.detail.checked;
		this.userServiceApi.updateUserConfig(this.userConfig)
			.subscribe(() => {
				this.toast.show(this.userConfig.emailNewRequests
					? "You will now receive an email when a user subscribes to your event."
					: "You will no longer receive an email when a user subscribes to your event.");
			});
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

}
