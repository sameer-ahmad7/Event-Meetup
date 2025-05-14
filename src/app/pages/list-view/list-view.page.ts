import { Component, input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonChip, IonCardContent, IonLabel, IonIcon, IonCardHeader, IonCard, ModalController, IonButton } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { locationOutline, lockClosed, wallet, locateOutline, ellipsisHorizontal } from 'ionicons/icons';
import { EventItem } from 'src/app/core/models/event-item.model';
import { AvatarModule } from 'ngx-avatars';
import { SharedService } from 'src/app/core/services/shared.service';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';
import { NO_MAX_LIMIT_AGE } from 'src/app/core/common/constant';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { EventParticipantsComponent } from 'src/app/shared/event-participants/event-participants.component';

@Component({
	selector: 'app-list-view',
	templateUrl: './list-view.page.html',
	styleUrls: ['./list-view.page.scss'],
	standalone: true,
	imports: [ IonCard, IonCardHeader, IonIcon, IonLabel,
		AvatarModule, RouterLink,
		IonCardContent, IonChip, RouterLink, CommonModule, FormsModule]
})
export class ListViewPage implements OnInit {

	events = input.required<EventItem[]>();
	userId = '';
	onRefreshLocation = output<void>();
	onRefreshEvents=output<void>();

	constructor(private router: Router, public sharedService: SharedService,
		private modalCtrl:ModalController,
		private userAuth: UserAuthService) {
		addIcons({locateOutline,ellipsisHorizontal,wallet,locationOutline,lockClosed});
	}

	ngOnInit() {
		this.userId = this.userAuth.currentUser().userId;
		console.log(this.events());
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
				this.onRefreshEvents.emit();
			}

		}
		);
	}

	onCenterMyLocation() {
		this.onRefreshLocation.emit();

	}

	


	onClickBusinessAddress(event:EventItem) {
		// window.open('https://maps.google.com/maps?q=' + encodeURIComponent(this.getBusinessClientAddress()), '_blank');
		window.open(event.businessClient.mapsUrl, '_blank');
	  }


	getEventParticipants(participants: UserEventAvatar[]) {
		return participants.filter(p => p.userEventStatus === 'OWNER' || p.userEventStatus === 'ACCEPTED');
	}

	getBusinessClientAddress(event: EventItem): string {
		return event.businessClient.street + ', ' + event.businessClient.city + ", " + event.businessClient.country;
	}


	onClickEvent(event: EventItem) {
		this.router.navigate(['events', event.eventId]);
	}

	protected readonly NO_MAX_LIMIT_AGE = NO_MAX_LIMIT_AGE;


}
