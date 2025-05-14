import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonProgressBar, IonBackButton, IonButtons, IonButton, IonIcon, IonCardTitle, IonCard, IonCardHeader, IonCardContent, IonPopover, IonSegment, IonSegmentButton, IonLabel, IonList, IonInput, IonItem, IonText, DatetimeChangeEventDetail, IonDatetime, IonSelect, IonSelectOption, IonTextarea, IonFooter, IonSpinner, IonChip } from '@ionic/angular/standalone';
import { Interest } from 'src/app/core/models/type/interest.model';
import { Country } from 'src/app/core/models/type/country.model';
import { TypeModel } from 'src/app/core/models/type/type.model';
import { Language } from 'src/app/core/models/type/language.model';
import { LanguageLevel } from 'src/app/core/models/type/language-level.model';
import { UserLanguage } from 'src/app/core/models/type/user-language.model';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { TypeApiService } from 'src/app/core/rest/type-api.service';
import { UserApiService } from 'src/app/core/rest/user-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { User } from 'src/app/core/models/user.models';
import {combineLatest, lastValueFrom, take, throwError} from 'rxjs';
import { DateTime } from 'luxon';
import { AvatarModule } from 'ngx-avatars';
import { addIcons } from 'ionicons';
import { chevronBack, camera, helpCircle, lockClosed, eye, logoFacebook, logoInstagram, logoTiktok, calendarClearOutline, close, closeOutline, chevronDown, chevronUp, ellipse, ellipsisVertical } from 'ionicons/icons';
import { IonDatetimeCustomEvent } from '@ionic/core';
import { format, parseISO } from 'date-fns';
import { NgSelectModule } from '@ng-select/ng-select';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {catchError} from "rxjs/operators";
import {HttpErrorResponse} from "@angular/common/http";


@Component({
	selector: 'app-edit-profile',
	templateUrl: './edit-profile.page.html',
	styleUrls: ['./edit-profile.page.scss'],
	standalone: true,
	imports: [IonChip, IonSpinner, IonFooter, IonTextarea, IonText, IonItem, IonInput, IonList, IonLabel, NgSelectModule,
		IonSegmentButton, IonSegment, IonPopover, IonCardContent,
		IonCardHeader, IonCard, IonCardTitle, IonIcon, IonButton, IonButtons,
		IonBackButton, IonProgressBar, AvatarModule, IonDatetime, IonSelect, IonSelectOption,
		IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule]
})
export class EditProfilePage implements OnInit {

	@ViewChild('content') content!:IonContent;
	maxDate = DateTime.now().minus({ year: 18 }).toISO();
	isLoading = true;
	selectedSegment: 'personal' | 'interests' = 'personal';
	imageURL?: string;
	user!: User;


	addLanguage?: boolean;

	profileForm!: FormGroup;
	userLanguageForm!: FormGroup;
	interestForm!: FormGroup;

	formattedBirthdate = '';

	userInterests: Interest[] = [];
	countries: Country[] = [];
	interests: Interest[] = [];
	genders: TypeModel[] = [];
	languages: Language[] = [];
	userLanguages: UserLanguage[] = [];
	levels: LanguageLevel[] = [];
	isUpdating = false;
	isSocialsOpen = true;
	isCompleteProfile=false;

	validationErrors:{[key:string]:string}={
		"birthday": "Birthday is mandatory",
        "fromCountry": "From Country is mandatory",
        "livingCountry": "Living Country is mandatory",
        "languages": "Languages are mandatory"
	}

	constructor(public sharedService: SharedService,
		private router: Router,
		private userAuth: UserAuthService,
		private userApiService: UserApiService,
		private typeApiService: TypeApiService,
		private route: ActivatedRoute,
		private toast: ToastService,
		public datepipe: DatePipe) {
		addIcons({ camera, helpCircle, chevronUp, chevronDown, logoFacebook, logoInstagram, logoTiktok, calendarClearOutline, close, eye, chevronBack,ellipsisVertical });
	}

	ngOnInit() {
		this.user = this.userAuth.currentUser();

		this.route.url
        .pipe(take(1))
        .subscribe(segments => {
          const routePath = segments.map(segment => segment.path).join('/');
          if (routePath.includes('complete')) {
			this.isCompleteProfile=true;
		  }
		});

		this.buildUserLanguageForm();
		this.buildInterestForm();
		this.buildProfileForm();
		this.fetchData();
		this.patchProfileForm();

	}

	onLogout(){
		this.sharedService.signOut();
	}

	async openFilePicker(){
			const image = await Camera.getPhoto({
			  quality: 70,
			  source:CameraSource.Prompt,
			  resultType: CameraResultType.Base64
			});
			const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
			this.imageURL=dataUrl;
			this.profileForm.patchValue({
				imageProfileB64: dataUrl
			});  
}



	compareWithGender(o1: TypeModel | null, o2: TypeModel | null): boolean {
		return o1 && o2 ? o1.id === o2.id : o1 === o2;
	}

	compareWithInterest(o1: Interest | null, o2: Interest | null): boolean {
		return o1 && o2 ? o1.interestId === o2.interestId : o1 === o2;
	}


	fetchData() {
		this.imageURL = this.user.imageProfileB64;
		console.log(this.imageURL);
		this.userLanguages = this.user.languages;
		this.userInterests = this.user.interests;
		combineLatest([this.typeApiService.getCountries(), this.typeApiService.getInterests(), this.typeApiService.getGenders(), this.typeApiService.getLanguages(), this.typeApiService.getLanguageLevels()])
			.pipe(take(1))
			.subscribe(([countries, interests, genders, languages, languageLevels]) => {
				this.countries = countries;
				this.interests = interests;
				console.log(this.interests);
				this.genders = genders;
				this.genders.push(new TypeModel(undefined, "Not specified"));
				this.languages = languages;
				this.levels = languageLevels;
				this.isLoading = false;
			});

	}

	isInterestsAndLanguageValid(): boolean {
		let languages = this.profileForm.get('languages');
		if (languages) {
			return languages.valid;
		}
		return false;
	}

	async onUpdateProfile() {
		this.isUpdating = true;
		console.log(this.profileForm.value);
		let birthday = '';
		if (this.profileForm.get('birthday')?.value) {
			birthday = DateTime.fromISO(this.profileForm.get('birthday')?.value).toFormat('yyyy-MM-dd');
		}
		// this.profileForm.get('birthday')?.patchValue(birthday);

		if (this.imageURL && this.imageURL !== this.user.imageProfileB64) {
		const res=	await this.saveImageProfileB64();
		console.log(res);
		}
		this.userApiService
			.updateUser({ ...this.profileForm.value, birthday } as User)
			.pipe(catchError((err) => {
				this.isUpdating = false;
				return throwError(err)
			}))
			.subscribe(async () => {
				this.toast.show('Profile updated successfully', 'User Profile');
				this.userAuth.fetchUserAuth().then(() => {
					this.isUpdating = false;
					this.router.navigate(['/profile']);
				})
			},err=>{
		console.log('err',err);
		if(err.error.validationErrors){
			const validationErrors:any=err.error.validationErrors;
			if(Object.keys(validationErrors).length>0){
				for(const key in validationErrors){
					console.log('key',key);
					const formControl=this.profileForm.get(key);
					if(formControl){
						console.log(formControl);
						formControl.setErrors({required:true});
						formControl.markAsDirty();
						formControl.updateValueAndValidity();	
					}
				}
				if(Object.keys(validationErrors).length===1 && validationErrors['languages']){
					this.selectedSegment='interests';
				}	
				this.content.scrollToBottom(20);
			}
		}
		/* 
		{
    "message": null,
    "validationErrors": {
        "birthday": "Birthday is mandatory",
        "fromCountry": "From Country is mandatory",
        "livingCountry": "Living Country is mandatory",
        "languages": "Languages are mandatory"
    }
}
		*/
			});
	}



	showPreview(event: any) {
		// @ts-ignore
		const file = (event.target as HTMLInputElement).files[0];

		// File Preview
		const reader = new FileReader();
		reader.onload = () => {
			this.imageURL = reader.result as string;
			console.log(this.imageURL);
			this.profileForm.patchValue({
				imageProfileB64: this.imageURL
			});
			//   this.saveImageProfileB64();
			// @ts-ignore
			this.profileForm.get('imageProfileB64').updateValueAndValidity()
		}
		reader.readAsDataURL(file)
	}


	onClickConfirmLanguage() {
		this.userLanguages.push(this.userLanguageForm.value);
		this.profileForm.get('languages')?.patchValue(this.userLanguages);
		this.buildUserLanguageForm();
		this.addLanguage = false;
	}

	onSelectionLevelChange() {
		this.onClickConfirmLanguage();
	}

	onSelectionLanguageChange() {
		if (this.userLanguageForm.get('language')?.value && !this.userLanguages.some(uL => uL.language.isoCodeLanguage === this.userLanguageForm.get('language')?.value.isoCodeLanguage)) {
			const levelControl = this.userLanguageForm.get('level');
			levelControl?.enable();
			levelControl?.setValidators([Validators.required]);
			levelControl?.updateValueAndValidity(); // <-- this is the crucial part
		}
	}

	compareWithCountries(item1: Country, item2: Country) {
		return item1 && item2 && item1.isoCodeCountry === item2.isoCodeCountry;	// or item1.id === item2.id
	}

	compareWithLanguages(item1: Language, item2: Language) {
		return item1 && item2 && item1.isoCodeLanguage === item2.isoCodeLanguage;
	}

	onClickDeleteUserLanguage(i: number) {
		this.userLanguages.splice(i, 1)
		this.profileForm.get("languages")?.patchValue(this.userLanguages);
	}

	onSelectionInterestChange() {
		if (!this.userInterests.some(interest => interest.interestId === this.interestForm.get('interest')?.value.interestId)) {
			this.userInterests.push(this.interestForm.get('interest')?.value);
			this.profileForm.get('interests')?.patchValue(this.userInterests);
			console.log(this.userInterests);
			this.buildInterestForm();
		}
	}

	onClickDeleteInterest(i: number) {
		this.userInterests.splice(i, 1)
		this.profileForm.get("interests")?.patchValue(this.userInterests);
	}
	getImageUrlOrB64() {
		return this.imageURL?.startsWith('/profile') ?
			this.sharedService.getImageUrl(this.imageURL) :
			this.imageURL;
	}

	private saveImageProfileB64() {
		return new Promise(async resolve=>{
		if(this.imageURL){
			try {
				await lastValueFrom(this.userApiService.saveImageAvatar(this.imageURL));
				resolve(true);							
			} catch (error) {
				resolve(false);
			}
		}
		resolve(false);
	
	});
	}



	getMissingData() {
		let data = '';
		this.user?.openProfileActions.forEach(action => data += action + "\n");
		return data;
	}


	patchProfileForm(): void {
		if (this.user.birthday) {
			this.profileForm.get("birthday")?.patchValue(this.user.birthday);
			this.formattedBirthdate = format(parseISO(this.profileForm.get("birthday")?.value as string), "yyyy-MM-dd");
		}

		this.profileForm.get('facebookNickname')?.patchValue(this.user.facebookNickname);
		this.profileForm.get('instagramNickname')?.patchValue(this.user.instagramNickname);
		this.profileForm.get('tiktokNickname')?.patchValue(this.user.tiktokUsername);
		this.profileForm.get("userId")?.patchValue(this.user?.userId);
		this.profileForm.get("firstName")?.patchValue(this.user?.firstName);
		this.profileForm.get("lastName")?.patchValue(this.user?.lastName);
		this.profileForm.get("email")?.patchValue(this.user?.email);
		this.profileForm.get("phoneNumber")?.patchValue(this.user?.phoneNumber);
		this.profileForm.get("nationality")?.patchValue(this.user?.nationality);
		this.profileForm.get("livingCountry")?.patchValue(this.user?.livingCountry);
		this.profileForm.get("fromCountry")?.patchValue(this.user?.fromCountry);
		this.profileForm.get("gender")?.patchValue(this.user?.gender);
		this.profileForm.get("languages")?.patchValue(this.user?.languages);
		this.profileForm.get("interests")?.patchValue(this.user?.interests);
		this.profileForm.get("age")?.patchValue(this.user?.age);
		this.profileForm.get("descProfile")?.patchValue(this.user?.descProfile);
		this.profileForm.get("imageProfileB64")?.patchValue(this.user?.imageProfileB64);
		this.profileForm.get("facebookNickname")?.patchValue(this.user?.facebookNickname);
		this.profileForm.get("instagramNickname")?.patchValue(this.user?.instagramNickname);
		this.profileForm.get("tiktokNickname")?.patchValue(this.user?.tiktokUsername);
	}

	onBirthDateChanged(event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
		if (event.target.value) {
			const dateValue = event.target.value;
			const dt = DateTime.fromISO(dateValue as string);
			const formattedISO = dt.toUTC().toISO({ suppressMilliseconds: false });
			this.profileForm.patchValue({ birthday: formattedISO });
			this.formattedBirthdate = format(parseISO(dateValue as string), "yyyy-MM-dd");
		}
	}


	buildProfileForm(): void {
		this.profileForm = new FormGroup({
			userId: new FormControl(this.user?.userId, []),
			firstName: new FormControl(this.user?.firstName, [
				Validators.required,
				Validators.minLength(2)]),
			lastName: new FormControl(this.user?.lastName, [
				Validators.required,
				Validators.minLength(2)]),
			email: new FormControl({ value: this.user?.email, disabled: true }),
			phoneNumber: new FormControl(this.user?.phoneNumber),
			birthday: new FormControl(null, [
				Validators.required]),
			nationality: new FormControl(this.user?.nationality),
			livingCountry: new FormControl(this.user?.livingCountry, [
				Validators.required]),
			fromCountry: new FormControl(this.user?.fromCountry, [
				Validators.required]),
			gender: new FormControl(this.user?.gender, [
				Validators.required]),
			languages: new FormControl(this.user?.languages, [
				Validators.required]),
			interests: new FormControl(this.user?.interests, []),
			age: new FormControl(this.user?.age),
			descProfile: new FormControl(this.user?.descProfile),
			imageProfileB64: new FormControl(this.user?.imageProfileB64),
			facebookNickname: new FormControl(this.user?.facebookNickname),
			instagramNickname: new FormControl(this.user?.instagramNickname),
			tiktokNickname: new FormControl(this.user?.tiktokUsername),
		});
	}

	compareWithLevel(o1: LanguageLevel | null, o2: LanguageLevel | null): boolean {
		return o1 && o2 ? o1.levelName === o2.description : o1 === o2;
	}

	buildUserLanguageForm() {
		this.userLanguageForm = new FormGroup({
			language: new FormControl(null),
			level: new FormControl({ value: null, disabled: true }),
		});
	}

	private buildInterestForm() {
		this.interestForm = new FormGroup({
			interest: new FormControl(null),
		});
	}



}
