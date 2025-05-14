import { Component, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
	IonButton, IonButtons, IonIcon, IonTitle,
	IonToolbar, IonHeader,
	LoadingController,
	ModalController, IonContent, IonCardHeader, IonCard, IonCardContent, IonList, IonLabel, IonItem,
	IonTextarea, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronDown, chevronUp } from 'ionicons/icons';
import { AvatarModule } from 'ngx-avatars';
import { BarRatingModule } from 'ngx-bar-rating';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { UserAvatar } from 'src/app/core/models/user-avatar.model';
import { UserFeedback } from 'src/app/core/models/user-feedback.model';
import { UserFeedbackApiService } from 'src/app/core/rest/user-feedback-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
	selector: 'app-leave-feedback',
	templateUrl: './leave-feedback.component.html',
	styleUrls: ['./leave-feedback.component.scss'],
	standalone: true,
	providers: [LoadingController, ModalController],
	imports: [IonText, IonSpinner, IonItem, IonLabel, IonList, IonCardContent, IonCard, IonCardHeader,
		IonContent, FormsModule, ReactiveFormsModule, AvatarModule, RouterLink, BarRatingModule, IonHeader, IonToolbar,
		IonTitle, IonTextarea,
		IonButtons, IonButton, IonIcon]
})
export class LeaveFeedbackComponent implements OnInit {

	isLoading = true;
	eventId = '';
	userSession!: UserAvatar;
	participants: UserAvatar[] = [];
	filteredParticipants: UserAvatar[] = [];
	eventFeedbacks: UserFeedback[] = [];
	owner!: UserAvatar;
	feedbackFormsMap: Map<string, FormGroup> = new Map();
	accordionIconsMap: Map<string, string> = new Map();

	expandFeedback: { [key: string]: boolean } = {};

	constructor(public sharedService: SharedService, private userAuth: UserAuthService,private router:Router,
		private toast: ToastService, private loadingController: LoadingController, private modalCtrl: ModalController,
		private feedbackApiService: UserFeedbackApiService,) {
		addIcons({ chevronBack, chevronUp, chevronDown });
	}

	ngOnInit() {
		this.fetchData();
	}

	gotoProfile(userId: string) {
		this.modalCtrl.dismiss();
		this.router.navigate([userId === this.userSession.userId
                ? '/profile'
                : '/profile/' + userId]);
	}

	private fetchData() {
		this.userSession = this.userAuth.currentUser();
		this.feedbackApiService.getEventFeedbacks(this.eventId).subscribe(userFeedbacks => {
			this.eventFeedbacks = userFeedbacks;
			this.filteredParticipants = [];

			// if (this.owner.userId !== this.userSession.userId) {
			// 	this.filteredParticipants.push(this.owner);
			// }
			this.filteredParticipants.push(
				...this.participants.filter((participant: any) => participant.userId !== this.userSession.userId));
			for (const participant of this.filteredParticipants) {
				this.expandFeedback[participant.userId] = true;
			}
			this.feedbackFormsMap = new Map(this.participants.map((user) => [user.userId,
			this.buildUserFeedbackForm(user)]));
			this.isLoading = false;
		});
	}

	buildUserFeedbackForm(user: UserAvatar) {
		const userFeedbackDatas = this.eventFeedbacks.filter(eventFeedback => eventFeedback.userFeedback.userId === user.userId);
		const userFeedbackData = userFeedbackDatas.length ? userFeedbackDatas[0] : null;
		const userFeedbackForm = new FormGroup<any>({
			userFeedback: new FormControl({ value: userFeedbackData ? userFeedbackData.userFeedback : user, disabled: true }),
			rate: new FormControl(userFeedbackData?.rate, [Validators.required]),
			content: new FormControl(userFeedbackData?.content, [Validators.required]),
			sent: new FormControl({ value: userFeedbackData !== null, disabled: true }),
		});
		if (userFeedbackData) {
			userFeedbackForm.disable();
		}
		return userFeedbackForm;
	}

	async onClickSendFeedback(userId: string) {
		const loader = await this.loadingController.create({ backdropDismiss: false });
		await loader.present();
		this.feedbackFormsMap.get(userId)?.disable();
		const feedback = this.feedbackFormsMap.get(userId)?.value;
		this.feedbackFormsMap.get(userId)?.get('sent')?.patchValue(true);

		const feedbackRequest = {
			userFeedbackId: feedback.userFeedback.userId,
			content: feedback.content,
			rate: feedback.rate,
			eventId: this.eventId
		}
		this.feedbackApiService.createFeedback(feedbackRequest)
			.subscribe(async () => {
				await loader.dismiss();
				this.toast.show('Feedback sent successfully', 'Send Feedback');
			})
	}

	isFeedbackSent(userId: string) {
		return this.feedbackFormsMap.get(userId)?.get('sent')?.value
	}

	onRatingChanged(event:any,id:string){
		console.log(event);
		console.log(this.feedbackFormsMap.get(id)?.value);
	
	}


	togglePanel(userId: string) {
		this.expandFeedback[userId] = !this.expandFeedback[userId];
	}

	dismiss() {
		this.modalCtrl.dismiss();
	}


}
