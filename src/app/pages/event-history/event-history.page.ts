import { Component, input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonButton, IonItem, IonList } from '@ionic/angular/standalone';
import { EventItem } from 'src/app/core/models/event-item.model';
import { SharedService } from 'src/app/core/services/shared.service';
import { AvatarModule } from 'ngx-avatars';
import { TimeAgoPipe } from "../../pipes/time-ago.pipe";
import { ToastService } from 'src/app/core/services/toast.service';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';
import { UserSubscription } from 'src/app/core/dto/request/user-subscription';
import { EventSubscriptionApiService } from 'src/app/core/rest/event-subscription-api.service';
import { take } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-event-history',
	templateUrl: './event-history.page.html',
	styleUrls: ['./event-history.page.scss'],
	standalone: true,
	imports: [IonList, IonItem, IonButton, IonLabel, CommonModule, FormsModule, AvatarModule, TimeAgoPipe, RouterLink]
})
export class EventHistoryPage implements OnInit {
	userId!: string;
	event = input.required<EventItem>();
	refreshData = output<void>;

	constructor(public sharedService: SharedService, private toastService: ToastService, private userAuth: UserAuthService,
		private eventSubscriptionApiService: EventSubscriptionApiService
	) { }

	ngOnInit() {
		this.userId = this.userAuth.currentUser().userId;
	}

	onClickApproveRejectButton(participant: UserEventAvatar, accepted: boolean) {
		const userSubscription: UserSubscription = {
			userId: participant.userAvatar.userId,
			accepted: accepted
		}
		this.eventSubscriptionApiService
			.approveSubscription(this.event().eventId, userSubscription)
			.pipe(take(1))
			.subscribe(response => {
				if (accepted) {
					this.toastService.show("You approved the user request");
				} else {
					this.toastService.show('You declined the user request', '', 'secondary');
				}
				participant.userEventStatus = 'ACCEPTED';
				this.refreshData().emit();
			},(err=>{
				console.log('error');
				this.toastService.show(err.error.message,'','danger');
			}));
	}


}
