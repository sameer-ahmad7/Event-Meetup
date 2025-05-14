import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonList, IonItem, IonLabel, IonButton, IonContent, IonHeader, IonButtons, IonBackButton, IonToolbar, IonTitle, IonSpinner, IonIcon, IonFooter, LoadingController } from '@ionic/angular/standalone';
import { UserNotificationApiService } from 'src/app/core/rest/user-notification-api.service';
import { combineLatest, filter, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { UserNotification } from 'src/app/core/models/user-notification.models';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { AvatarModule } from 'ngx-avatars';
import { UserSubscription } from 'src/app/core/dto/request/user-subscription';
import { ToastService } from 'src/app/core/services/toast.service';
import { EventSubscriptionApiService } from 'src/app/core/rest/event-subscription-api.service';
import { addIcons } from 'ionicons';
import { chevronBack, checkmarkCircleOutline, ellipse } from 'ionicons/icons';
import { TimeAgoPipe } from 'src/app/pipes/time-ago.pipe';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-notification',
	templateUrl: './notification.page.html',
	styleUrls: ['./notification.page.scss'],
	standalone: true,
	imports: [RouterLink, IonIcon, IonSpinner, IonTitle, IonToolbar, IonBackButton, IonButtons, IonHeader,
		AvatarModule, TimeAgoPipe,
		IonContent, IonButton, IonLabel, IonItem, IonList, CommonModule, FormsModule]
})
export class NotificationPage implements OnInit, OnDestroy {

	RESTAURANT_STATUS = ['EVENT_REMINDER', 'FEEDBACK_REMINDER', 'BUSINESS_EVENT_REJECTED', 'BUSINESS_EVENT_ACCEPTED']
	isLoading = true;
	notifications: UserNotification[] = [];
	notifications$!: Subscription;
	private destroy$ = new Subject<void>();

	constructor(private notificationService: NotificationService,
		private toastService: ToastService, private loadingCtrl:LoadingController, private eventSubscriptionApiService: EventSubscriptionApiService,
		public sharedService: SharedService) {
		addIcons({ ellipse, checkmarkCircleOutline, chevronBack });
	}

	ngOnInit() {
		this.notificationService.loadNotifications();
		this.notificationService.setNotificationsReadAndLoad();
		this.notifications$ = combineLatest([this.notificationService.loading$, this.notificationService.notifications$])
			.pipe(filter(([loading, _]) => !loading),
				takeUntil(this.destroy$)
			)
			.subscribe(([_, notifications]) => {
				console.log(notifications);
				this.notifications = notifications;
				this.isLoading = false;
			});
	}

	async onClickApproveRejectButton(notification: UserNotification, accepted: boolean) {

		const loader=await this.loadingCtrl.create({backdropDismiss:false});

		await loader.present();

		const userSubscription: UserSubscription = {
			userId: notification.userFrom.userId,
			accepted: accepted
		}
		this.eventSubscriptionApiService
			.approveSubscription(notification.eventAvatar.eventId, userSubscription)
			.subscribe(async response => {
				notification.notificationType = accepted ? 'EVENT_REQUEST_ACCEPTED' : 'EVENT_REQUEST_DECLINED';
				if (accepted) {
					this.toastService.show("You approved the user request");
				} else {
					this.toastService.show('You declined the user request', '', 'secondary');
				}
				await loader.dismiss();
				this.notificationService.loadNotifications();
			},async err=>{
				await loader.dismiss();
				this.toastService.show(err.error.message,'','danger');
			});
	}


	ionViewWillLeave() {
		console.log('leave');
		this.notificationService.resetNotificationsNumber();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

}
