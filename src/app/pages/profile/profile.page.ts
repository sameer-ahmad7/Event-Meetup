import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSpinner, IonChip, IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonProgressBar, IonList, IonItem, IonText, IonPopover, IonItemDivider, ActionSheetButton, LoadingController, AlertController, ActionSheetController } from '@ionic/angular/standalone';
import { UserNotification } from 'src/app/core/models/user-notification.models';
import { Country } from 'src/app/core/models/type/country.model';
import { Language } from 'src/app/core/models/type/language.model';
import { UserFeedback } from 'src/app/core/models/user-feedback.model';
import { User } from 'src/app/core/models/user.models';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { RadarApiService } from 'src/app/core/rest/radar-api.service';
import { TypeApiService } from 'src/app/core/rest/type-api.service';
import { UserApiService } from 'src/app/core/rest/user-api.service';
import { UserFeedbackApiService } from 'src/app/core/rest/user-feedback-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { combineLatest, take } from 'rxjs';
import { addIcons } from 'ionicons';
import { chevronBack, logoFacebook, logoInstagram, logoTiktok, pencil, helpCircle, ellipsisVertical } from 'ionicons/icons';
import { AvatarModule } from 'ngx-avatars';
import { BarRating } from 'ngx-bar-rating';
import { TimeAgoPipe } from "../../pipes/time-ago.pipe";
import { BlockService } from 'src/app/core/rest/block.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.page.html',
	styleUrls: ['./profile.page.scss'],
	standalone: true,
	imports: [IonText, IonItem, IonList, IonProgressBar,
		IonIcon, IonButton, IonLabel, IonChip, IonSpinner, IonButtons, IonBackButton, IonContent, IonHeader,
		AvatarModule, RouterLink,IonPopover,
		BarRating, IonToolbar, CommonModule, FormsModule, TimeAgoPipe]
})
export class ProfilePage implements OnInit {

	stars = [1, 2, 3, 4, 5];

	userId!: string;
	userSessionId!: string;
	user!: User;
	isBlocked=false;

	userFeedbacks: UserFeedback[] = [];
	averageFeedbackValue!: number;
	notifications: UserNotification[] = [];
	languages: Language[] = [];

	countries: Country[] = [];

	isLoading = true;

	

	constructor(public sharedService: SharedService,
		private userApiService: UserApiService,private blockService:BlockService,
		private userAuthService: UserAuthService,private alertCtrl:AlertController,
		private toast:ToastService,private loadingCtrl:LoadingController,
		private userFeedbackApiService: UserFeedbackApiService,private actionSheetCtrl:ActionSheetController,
		private typeApiService: TypeApiService,
		private route: ActivatedRoute) {
		addIcons({ pencil, logoFacebook, logoInstagram, logoTiktok, helpCircle, chevronBack,ellipsisVertical });
	}

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.userSessionId = this.userAuthService.currentUser().userId;
			const userId = params['id'];
			if (userId != null) {
				if (userId === 'self') {
				} else {
					this.userId = userId;
				}
			} else {
				this.userId = this.userSessionId;
			}
			/**
			 * Fetches the data
			 */
			this.fetchData();
		});
	}

	  async onUnBlockUser(){
		const loader=await this.loadingCtrl.create({backdropDismiss:false});
		await loader.present();
		this.blockService.unBlockUser(this.user.userId).subscribe(async res=>{
			await loader.dismiss();
			this.toast.show(`${this.user.firstName} has been unblocked`);
			this.isBlocked=false;
		},async err=>{
			await loader.dismiss();
			this.toast.show(`Failed to unblock ${this.user.firstName}`,'Error','danger');
		})
	
	  }
	
	  async unBlockUser(popover:IonPopover){
		await popover.dismiss();
		const alert=await this.alertCtrl.create({
			header:'Unblock',
			message:`Are you sure you want to unblock ${this.user.firstName}?`,
			buttons:[
				{
					text:'Cancel',
					role:'cancel'
				},
				{
					text:'Confirm',
					handler:()=>{
						this.onUnBlockUser();
					}
				}
			]
			});
			await alert.present();
		
	  }


			async onBlockUser(){
				const loader=await this.loadingCtrl.create({backdropDismiss:false});
				await loader.present();
				this.blockService.blockUser(this.user.userId).subscribe(async res=>{
					await loader.dismiss();
					this.toast.show(`${this.user.firstName} has been blocked`);
					this.isBlocked=true;
				},async err=>{
					await loader.dismiss();
					this.toast.show(`Failed to block ${this.user.firstName}`,'Error','danger');
				})
			  }
			
			async  blockUser(popover:IonPopover){
				await popover.dismiss();
				const alert=await this.alertCtrl.create({
				header:'Block',
				message:`Are you sure you want to block ${this.user.firstName}?`,
				buttons:[
					{
						text:'Cancel',
						role:'cancel'
					},
					{
						text:'Confirm',
						handler:()=>{
							this.onBlockUser();
						}
					}
				]
				});
				await alert.present();
			
			  }
			
	

	fetchData() {
		combineLatest([this.typeApiService.getCountries(), this.userFeedbackApiService.getUserFeedbacks(this.userId),
		this.typeApiService.getLanguages(), this.userApiService.getUser(this.userId)
		]).pipe(take(1))
			.subscribe(([countries, userFeedbacks, languages, user]) => {
				this.countries = countries;
				this.userFeedbacks = userFeedbacks;
				this.languages = languages;
				this.user = user;
				console.log(this.user);
				this.user.geolocation = this.userAuthService.currentUser().geolocation;
				const sum = this.userFeedbacks
					.map(userFeedback => userFeedback.rate)
					.reduce((a, b) => Number(a) + Number(b), 0);
				this.averageFeedbackValue = (sum / this.userFeedbacks.length) || 0;
				this.user.geolocation = this.userAuthService.currentUser().geolocation;
				this.isLoading = false;
			});

	}

	getCountryName(isoCodeCountry: string) {
		if (isoCodeCountry) {
			return this.countries.filter(country => country.isoCodeCountry == isoCodeCountry)[0].name;
		}
		return null;
	}

	getName() {
		return this.user.firstName + " " + this.user.lastName;
	}

}