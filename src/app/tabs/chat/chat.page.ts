import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonCard, IonChip, IonCardContent, IonRefresher, IonRefresherContent, RefresherEventDetail, IonBadge } from '@ionic/angular/standalone';
import { EventItem } from 'src/app/core/models/event-item.model';
import { EventApiService } from 'src/app/core/rest/event-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { Router } from '@angular/router';
import { IonRefresherCustomEvent } from '@ionic/core';
import { addIcons } from 'ionicons';
import { chevronDownCircleOutline } from 'ionicons/icons';
import { ChatService } from 'src/app/core/services/chat.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.page.html',
	styleUrls: ['./chat.page.scss'],
	standalone: true,
	imports: [IonBadge, IonRefresherContent, IonRefresher, IonCardContent, IonChip, IonCard, IonSpinner, IonContent,
		IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ChatPage implements OnInit,OnDestroy {

	chatCountMap:{[key:string]:number}={};
	isLoading = true;
	events: EventItem[] = [];
	event!: IonRefresherCustomEvent<RefresherEventDetail>;
	private destroy$=new Subject<void>();

	constructor(private eventApiService: EventApiService, private router: Router,private chatService:ChatService,
		public sharedService: SharedService) {
		addIcons({ chevronDownCircleOutline });
	}

	ngOnInit() {
				this.chatService.chatCountMap$.pipe(takeUntil(this.destroy$))
				.subscribe(chatCountMap=>{
					this.chatCountMap=chatCountMap;
				});
		
		this.fetchData();
	}

	fetchData() {
		this.getAllEvents();
	}

	handleRefresh(event: IonRefresherCustomEvent<RefresherEventDetail>) {
		this.event = event;
		this.fetchData();
	}

	gotoDetails(event: EventItem) {
		this.router.navigate(['/chats', event.eventId], {
			state: {
				event
			}
		})
	}

	getAllEvents() {
		this.eventApiService
			.getEventsForChat()
			.subscribe(events => {
				this.events = events.sort((a, b) => new Date(a.startingDate).getTime() - new Date(b.startingDate).getTime());;
				if (this.event) {
					this.event.target.complete();
					this.event = null as any;
				}
				this.isLoading = false;
			});
	}

	ngOnDestroy(){
		this.destroy$.next();
		this.destroy$.complete();
	}

}
