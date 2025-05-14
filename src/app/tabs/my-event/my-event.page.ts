import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
	IonContent,
	IonHeader,
	IonTitle,
	IonToolbar,
	IonSpinner,
	IonCard,
	IonCardHeader,
	IonChip,
	IonLabel,
	IonCardContent,
	IonIcon,
	IonButtons,
	IonButton,
	IonBadge,
	IonModal,
	IonRefresher,
	IonRefresherContent,
	IonAccordionGroup,
	IonAccordion,
	IonItem,
	IonText,
	IonToggle
} from '@ionic/angular/standalone';
import { EventItem } from 'src/app/core/models/event-item.model';
import { User } from 'src/app/core/models/user.models';
import { Router, RouterLink } from '@angular/router';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { EventApiService } from 'src/app/core/rest/event-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';
import { OverlayEventDetail } from '@ionic/core';
import { Subscription, take } from 'rxjs';
import { AvatarModule } from 'ngx-avatars';
import { addIcons } from 'ionicons';
import { chevronDownCircleOutline, filter, locationOutline, notifications } from 'ionicons/icons';
import { NotificationService } from 'src/app/core/services/notification.service';
import { MyEventFilterComponent } from "./my-event-filter/my-event-filter.component";
import { EventSuccessPage } from "../../shared/event-success/event-success.page";
import { isAfter, isBefore } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { LeaveFeedbackComponent } from 'src/app/pages/leave-feedback/leave-feedback.component';
import { UserFeedbackApiService } from 'src/app/core/rest/user-feedback-api.service';
import { UserFeedback } from 'src/app/core/models/user-feedback.model';
import { EventParticipantsComponent } from 'src/app/shared/event-participants/event-participants.component';

@Component({
	selector: 'app-my-event',
	templateUrl: './my-event.page.html',
	styleUrls: ['./my-event.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonText, IonItem, IonAccordion, IonAccordionGroup, IonRefresherContent, IonRefresher, IonModal, IonBadge, IonButton, IonButtons, IonIcon, IonCardContent, IonLabel, IonChip, IonCardHeader, IonCard, IonSpinner, IonContent,
		AvatarModule, RouterLink, MyEventFilterComponent,
		IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, MyEventFilterComponent, IonToggle]
})
export class MyEventPage implements OnInit, OnDestroy {

	user!: User;
	events: EventItem[] = [];

	upcomingEvents: EventItem[] = [];
	pastEvents: EventItem[] = [];

	showFilter = false;
	isLoading = true;


	notificationCount = 0;
	notifications$!: Subscription;

	eventFeedback: { [key: string]: { userFeedback: UserFeedback[]; allFeedback: boolean } } = {};


	// Filter
	filters: any = {
		startingDate: null,
		endingDate: null,
		isoCodeLanguage: null,
		eventType: null,
		geoPositionEvent: null,
		statusesEvent: []
	};
	filtersNumber = 0;

	refreshEvent: any = null;
	hideRejectedCancelled = false;


	constructor(public sharedService: SharedService, private notificationService: NotificationService,
		private eventApiService: EventApiService, private modalCtrl: ModalController,
		private userAuth: UserAuthService, private feedbackApiService: UserFeedbackApiService,
		private router: Router) {

		addIcons({ notifications, filter, locationOutline, chevronDownCircleOutline });
	}

	gotoNotifications() {
		this.router.navigate(['notifications']);
	}

	handleRefresh(event: any) {
		this.refreshEvent = event;
		this.fetchData();
	}



	ngOnInit(): void {
		this.notifications$ = this.notificationService.unreadNotifications$.subscribe(
			count => {
				console.log(count);
				this.notificationCount = count;
			}
		);

		this.user = this.userAuth.currentUser();
		this.fetchData();

	}


	private fetchData() {
		this.getAllEventsHistory();
	}

	getFeedbacks() {
		const events = this.events.filter(event => event.status.id === 'ENDED' && (event.currentUserEventStatus
			=== 'ACCEPTED' || event.owner.userId === this.user.userId));
		console.log(events);
		if (events.length > 0) {
			for (const event of events) {
				this.feedbackApiService.getEventFeedbacks(event.eventId).subscribe(userFeedbacks => {
					this.eventFeedback[event.eventId] = {
						allFeedback: false,
						userFeedback: userFeedbacks
					}
					const filteredParticipants = event.participants.filter(participant => participant.userAvatar.userId !== this.user.userId);
					for (const participant of filteredParticipants) {
						const feedback = userFeedbacks.filter(userFeedback => userFeedback.userFeedback.userId === participant.userAvatar.userId);
						if (feedback.length > 0) {
							this.eventFeedback[event.eventId].allFeedback = true;
						}
					}
				});
			}
		}
	}


	getAllEventsHistory() {
		this.eventApiService.searchEventsHistory(this.filters)
			.subscribe(events => {
				this.events = events;
				this.getFeedbacks();
				this.upcomingEvents = this.events.filter(e => isAfter(new Date(e.startingDate), new Date()));
				this.pastEvents = this.events.filter(e => isBefore(new Date(e.startingDate), new Date()));
				this.upcomingEvents.sort((a, b) => new Date(a.startingDate).getTime() - new Date(b.startingDate).getTime());
				if (this.refreshEvent) {
					(this.refreshEvent.target as HTMLIonRefresherElement).complete();
					(this.refreshEvent as any) = null;
				}
				this.isLoading = false;
			});
	}

	async openParticipants(event: EventItem) {
		const modal = await this.modalCtrl.create({
			component: EventParticipantsComponent,
			componentProps: {
				event,
				participants: event.participants,
				userId: this.user.userId
			},
			initialBreakpoint: 1,
			breakpoints: [0, 1],
			cssClass: 'filter-modal'
		});
		await modal.present();
		modal.onDidDismiss().then(res => {
			console.log(res);
			if (res.data && res.data.success) {
				this.fetchData();
			}

		}
		);
	}


	async onClickLeaveFeedback(event: EventItem) {
		const modal = await this.modalCtrl.create({
			component: LeaveFeedbackComponent,
			componentProps: {
				eventId: event.eventId,
				participants: event.participants.map(participant => participant.userAvatar),
				owner: event.owner
			}
		});
		await modal.present();
		//to be implemented
	}

	geUserSessionName() {
		return this.user.firstName + " " + this.user.lastName;
	}

	getName(participant: UserEventAvatar): string {
		return participant.userAvatar?.firstName + " " + participant.userAvatar?.lastName;
	}

	getOwnerName(event: EventItem): string {
		return event.owner.firstName + " " + event.owner.lastName;
	}

	getBusinessClientAddress(event: EventItem): string {
		return event.businessClient.name + ", " + event.businessClient.country + ", " + event.businessClient.city;
	}

	getParticipantInitials(participant: UserEventAvatar) {
		return participant.userAvatar?.firstName?.charAt(0) + "" + participant.userAvatar?.lastName?.charAt(0);
	}

	onClickEvent(event: EventItem) {
		this.router.navigate(['events', event.eventId]);
	}

	onFilterDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showFilter = false;
		if (event.detail.data) {
			const filters = event.detail.data;
			if (filters) {
				this.filters = filters;
				this.calculateFiltersNumber();
				this.eventApiService.searchEventsHistory(this.filters)
					.pipe(take(1))
					.subscribe(events => this.events = events)
			}
		}
	}

	calculateFiltersNumber() {
		let count = 0;
		for (let attribute in this.filters) {
			const attrValue = this.filters[attribute];
			console.log(attrValue);
			if (Array.isArray(attrValue) && attrValue.length || (attrValue && !Array.isArray(attrValue))) {
				count++;
			}
		}
		this.filtersNumber = count;
	}


	getBadgeStatusObject(status?: string) {
		const badgeObject = {
			class: 'bg-secondary',
			text: status ? status.charAt(0) + status.substring(1)
				.toLowerCase()
				.replaceAll('_', ' ') : ''
		}
		switch (status) {
			case 'OPEN':
				badgeObject.class = 'bg-""';
				break;
			case 'IN_PROGRESS':
				badgeObject.class = 'bg-warning';
				badgeObject.text = "In Progress";
				break;
			case 'WAITING_LIST':
				badgeObject.class = 'bg-warning';
				break;
			case 'WAITING_APPROVAL':
				badgeObject.class = 'bg-warning';
				break;
			case 'OWNER':
				badgeObject.class = 'bg-success';
				badgeObject.text = "Created by you";
				break;
			case 'COMPLETED':
				badgeObject.class = 'bg-success';
				break;
			case 'ENDED':
				badgeObject.class = 'bg-secondary';
				break;
			case 'REJECTED':
				badgeObject.class = 'bg-danger';
				break;
			case 'ACCEPTED':
				badgeObject.class = 'bg-success'
				break;
			case 'CANCELLED':
				badgeObject.class = 'bg-danger'
				break;
			case 'NOT_COMPLETED':
				badgeObject.class = 'bg-danger'
				break;
			case 'ACCEPTED_WAITING_LIST':
				badgeObject.text = 'Queue';
				badgeObject.class = 'bg-warning';
				break;
			default:
				badgeObject.class = 'bg-secondary';
				break;
		}
		return badgeObject;
	}

	getUserEventStatusBadgeText(currentUserEventStatus: string) {
		if (currentUserEventStatus === 'OWNER') {
			return
		}
		return currentUserEventStatus.charAt(0) + currentUserEventStatus.substring(1).toLowerCase();
	}

	ngOnDestroy(): void {
		this.notifications$.unsubscribe();
	}


	onChangeHideRejectedCancelled(event: any): void {
		this.hideRejectedCancelled = event.detail.checked;
	}
	get filteredIncomingEvents(): EventItem[] {
		if (!this.upcomingEvents) {
			return [];
		}
		return this.upcomingEvents.filter(event => this.filterEventByHideRejectedCancelled(event));
	}

	get filteredPastEvents(): EventItem[] {
		if (!this.pastEvents) {
			return [];
		}
		return this.pastEvents.filter(event => this.filterEventByHideRejectedCancelled(event));
	}

	filterEventByHideRejectedCancelled(event: EventItem) {
		const isCancelledOrRejected = ['CANCELLED'].includes(event.status.id) || event.currentUserEventStatus === 'REJECTED';
		if (this.hideRejectedCancelled) {
			return !isCancelledOrRejected;
		}
		return true;
	}
}
