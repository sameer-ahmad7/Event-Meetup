import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonChip, IonButton, IonFooter, IonAccordionGroup, IonAccordion, IonPopover, IonProgressBar, IonModal, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, locationOutline, wallet, calendarOutline, lockClosedOutline, personOutline, personCircleOutline, ellipsisVertical, flagOutline } from 'ionicons/icons';
import { NotificationPage } from '../notification/notification.page';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, Subject, take, takeUntil } from 'rxjs';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { EventService } from 'src/app/core/services/event.service';
import { EventApiService } from 'src/app/core/rest/event-api.service';
import { EventItem } from 'src/app/core/models/event-item.model';
import { SharedService } from 'src/app/core/services/shared.service';
import { AvatarModule } from 'ngx-avatars';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';
import { NO_MAX_LIMIT_AGE } from 'src/app/core/common/constant';
import { EventHistoryPage } from "../event-history/event-history.page";
import { EventSuccessPage } from "../../shared/event-success/event-success.page";
import { IonRefresherCustomEvent, OverlayEventDetail, RefresherEventDetail } from '@ionic/core';
import { AlertController, ModalController } from '@ionic/angular';
import { ToastService } from 'src/app/core/services/toast.service';
import { EventSubscriptionApiService } from 'src/app/core/rest/event-subscription-api.service';
import { LeaveFeedbackComponent } from '../leave-feedback/leave-feedback.component';
import { EventParticipantsComponent } from 'src/app/shared/event-participants/event-participants.component';

@Component({
	selector: 'app-event-details',
	templateUrl: './event-details.page.html',
	styleUrls: ['./event-details.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonRefresherContent, IonRefresher, RouterLink, IonModal, IonProgressBar, IonPopover, IonAccordion, AvatarModule,
		IonAccordionGroup, IonFooter, IonButton, IonChip, IonLabel, IonItem,
		IonList, IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonToolbar,
		CommonModule, FormsModule, EventHistoryPage, EventSuccessPage]
})
export class EventDetailsPage implements OnInit {
	refresherEvent!: IonRefresherCustomEvent<RefresherEventDetail>;
	id = '';
	userId = '';
	event!: EventItem;
	participantIds?: string[];
	isLoading = true;
	showEventSuccess = false;

	private destroy$ = new Subject<void>;

	constructor(private route: ActivatedRoute,
		private eventApiService: EventApiService, private modalCtrl: ModalController,
		private eventSubscriptionApiService: EventSubscriptionApiService,
		public sharedService: SharedService, private toastService: ToastService,
		private router: Router, private alertCtrl: AlertController,
		private userAuth: UserAuthService) {
		addIcons({ wallet, ellipsisVertical, locationOutline, calendarOutline, lockClosedOutline, personCircleOutline, flagOutline, chevronBack, personOutline });
	}

	ngOnInit() {
		this.route.paramMap.
			pipe(takeUntil(this.destroy$))
			.subscribe(params => {
				this.id = params.get('id') as string;
				console.log(this.id);
				this.userId = this.userAuth.currentUser().userId;
				this.fetchData();
			})
	}

	handleRefresh(event: IonRefresherCustomEvent<RefresherEventDetail>) {
		this.refresherEvent = event;
		this.fetchData();
	}

	onEventSuccessDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showEventSuccess = false;
		if (event.detail.data) {
			this.router.navigate(['/tabs']);
		}
	}

	async onClickDeleteEvent(popover: IonPopover) {
		const alert = await this.alertCtrl.create({
			header: 'Are you sure you want to delete your event?',
			message: 'We will notify the restaurant owner you cancelled your event',
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
					handler: () => {
						popover.dismiss();
					}
				},
				{
					text: 'Confirm',
					handler: () => {
						popover.dismiss();
						this.eventApiService.deleteEvent(this.event.eventId)
							.pipe(take(1))
							.subscribe(() => {
								this.toastService.show("You cancelled the the event successfully");
								this.event.status.id = "CANCELLED";
							});
					}
				}
			]
		})
		await alert.present();

	}

		async openParticipants(event:EventItem){
			const modal=await this.modalCtrl.create({component:EventParticipantsComponent,
				componentProps:{
					event,
					participants:event.participants,
					userId:this.userId
				},
				initialBreakpoint:1,
				breakpoints:[0,1],
				cssClass:'filter-modal'
			});
			await modal.present();
			modal.onDidDismiss().then(res=>{
				console.log(res);
				if(res.data && res.data.success){
					this.fetchData();
				}
	
			}
			);
		}
	

	onClickBusinessAddress() {
		// window.open('https://maps.google.com/maps?q=' + encodeURIComponent(this.getBusinessClientAddress()), '_blank');
		window.open(this.event.businessClient.mapsUrl, '_blank');
	}


	onClickSubscribe() {
		this.eventSubscriptionApiService
			.createSubscription(this.event.eventId)
			.pipe(catchError(async (err, caught) => {
				if (err.status === 400) {
					const result = await this.sharedService.openConfirmDialog('Event already full', 'Do you want queue for the next available seat?');
					if (result) {
						this.eventSubscriptionApiService
							.createSubscriptionQueue(this.event.eventId)
							.pipe(take(1))
							.subscribe(() => {
								this.toastService.show('You queued to the event. You will get a notification as soon as the next seat is available', 'Subscribed');
								this.fetchData();
								this.showEventSuccess = true;
							})
					}
				}
				return EMPTY;
			}))
			.subscribe(() => {
				this.toastService.show('Subscription request sent', 'Request Subscription');
				this.fetchData();
				this.showEventSuccess = true;
			});

	}

	async onClickUnsubscribe() {
		const currentUserStatus = this.event.currentUserEventStatus;
		let actionForDialog = "";
		let msg = "";
		switch (currentUserStatus) {
			case 'WAITING_APPROVAL':
				msg = 'You cancelled the event request'
				actionForDialog = 'cancel the request to join the event'
				break;
			case 'REGISTERED':
				msg = 'You unsubscribed the event'
				actionForDialog = 'cancel the arrival at the event'
				break;
			case 'WAITING_LIST':
				msg = 'You cancelled the waiting list request'
				actionForDialog = 'cancel the request to the event waiting list'
				break;
			case 'ACCEPTED_WAITING_LIST':
				msg = 'You left the waiting list';
				actionForDialog = 'cancel the subscription to the event waiting list'
				break;
			default:
				msg = 'You unsubscribed the event';
		}
		const result = await this.sharedService.openConfirmDialog('Are you sure ' + actionForDialog + '?'
			, 'We will notify the event owner that you won\'t be able to come');
		if (result) {
			if (result) {
				this.eventSubscriptionApiService
					.deleteSubscription(this.event.eventId)
					.pipe(take(1))
					.subscribe(() => {
						this.toastService.show(msg, '', 'secondary');
						this.fetchData();
						// this.openModal(null);
					});
			}

		}
	}

	async onClickLeaveFeedback() {
		const modal = await this.modalCtrl.create({
			component: LeaveFeedbackComponent,
			componentProps: {
				eventId: this.event.eventId,
				participants: this.event.participants.map(participant => participant.userAvatar),
				owner: this.event.owner
			}
		});
		await modal.present();
		//to be implemented
	}

	openChat(popover: IonPopover) {
		popover.dismiss();
		this.router.navigate(['chats', this.event.eventId]);
	}

	fetchData() {
		this.eventApiService
			.getEvent(this.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe(event => {
				this.event = event;
				console.log(this.event);

				this.participantIds = this.event.participants
					.filter(participant => participant.userEventStatus === 'WAITING_APPROVAL')
					.map(participant => participant.userAvatar.userId)
				this.isLoading = false;
				if (this.refresherEvent) {
					this.refresherEvent.detail.complete();
					this.refresherEvent = null as any;
				}
			});

	}

	getEventParticipants(participants: UserEventAvatar[]) {
		return participants.filter(p => p.userEventStatus === 'OWNER' || p.userEventStatus === 'ACCEPTED');
	}

	getBusinessClientAddress(event: EventItem): string {
		return event.businessClient.street + ', ' + event.businessClient.city + ", " + event.businessClient.country;
	}



	ngOnDestroy() {

		this.destroy$.next();
		this.destroy$.complete();
	}

	protected readonly NO_MAX_LIMIT_AGE = NO_MAX_LIMIT_AGE;


}
