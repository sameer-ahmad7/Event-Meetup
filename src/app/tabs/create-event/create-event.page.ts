import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	DatetimeChangeEventDetail, IonContent, IonSelect, IonSelectOption,
	IonLoading, IonModal,
	IonDatetime, IonPopover, IonTextarea,
	IonCheckbox,
	IonInput,
	Platform
} from '@ionic/angular/standalone';
import { CheckboxChangeEventDetail, IonCheckboxCustomEvent, IonDatetimeCustomEvent, OverlayEventDetail } from '@ionic/core';
import { format, parseISO } from 'date-fns';
import { addIcons } from 'ionicons';
import { calendarClearOutline, location, close } from 'ionicons/icons';
import { combineLatest, Subscription, take } from 'rxjs';
import { TypeApiService } from 'src/app/core/rest/type-api.service';
import { Country } from 'src/app/core/models/type/country.model';
import { Language } from 'src/app/core/models/type/language.model';
import { TypeModel } from 'src/app/core/models/type/type.model';
import { GeolocationModel } from 'src/app/core/models/geolocation.model';
import { AddressLocationResponse } from 'src/app/core/models/map/address-location-response.model';
import { RadarApiService } from 'src/app/core/rest/radar-api.service';
import { Capacitor } from '@capacitor/core';
import { MarkerModel } from 'src/app/core/models/marker-model';
import { Geolocation } from '@capacitor/geolocation';
import { NgSelectModule } from '@ng-select/ng-select';
import { ParticipantSize } from 'src/app/core/models/participant-size';
import { LabelType, NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NO_MAX_LIMIT_AGE } from 'src/app/core/common/constant';
import { GeoPositionClient } from 'src/app/core/models/geo-position.client';
import { BusinessClientApiService } from 'src/app/core/rest/business-client-api.service';
import { BusinessClient } from 'src/app/core/models/business-client.model';
import { DateTime } from 'luxon';
import { CreateEventMapPage } from 'src/app/pages/create-event-map/create-event-map.page';
import { LoadingController, ModalController } from '@ionic/angular';
import { EventApiService } from 'src/app/core/rest/event-api.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/core/services/toast.service';
import { CreateEventSuccessPage } from 'src/app/pages/create-event-success/create-event-success.page';
import { User } from 'src/app/core/models/user.models';
import { UserAuthService } from 'src/app/auth/user-auth.service';


@Component({
	selector: 'app-create-event',
	templateUrl: './create-event.page.html',
	styleUrls: ['./create-event.page.scss'],
	standalone: true,
	providers: [ModalController],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [IonContent, IonDatetime, IonPopover, IonSelect, IonTextarea,
		CreateEventSuccessPage, IonModal, IonLoading, IonCheckbox,
		CreateEventMapPage, NgSelectModule, NgxSliderModule, IonInput,
		IonSelectOption, CommonModule, FormsModule, ReactiveFormsModule]
})
export class CreateEventPage implements OnInit {

	businessClients: BusinessClient[] = [];


	mapMarkers: MarkerModel[] = [];
	userLocation!: { latitude: number; longitude: number };

	searchQuery = '';

	geoPositionClient?: GeoPositionClient;

	isActiveSearch = false;
	isCreatingEvent = false;


	eventTypes: TypeModel[] = [];
	languages: Language[] = [];
	countries: Country[] = [];
	genders: TypeModel[] = [];

	isLoading = true;
	isDataLoading = true;
	isAddressLoading = false;
	isMyLocationLoading = true;

	user!: User;


	selectedBusiness = '';
	isRefresh = false;

	minAge: number = 18;
	maxAge: number = NO_MAX_LIMIT_AGE;

	rangeAgeOpt: Options = {
		floor: 18,
		ceil: NO_MAX_LIMIT_AGE,
		translate: (value: number, label: LabelType): string => {
			switch (label) {
				case LabelType.Low:
					return "<b>Min age:</b> " + value;
				case LabelType.High:
					return "<b>Max age:</b> " + value + (value === NO_MAX_LIMIT_AGE ? "+" : "");
				default:
					return "";
			}
		}
	};


	// Place Info
	addressLocations: AddressLocationResponse[] = [];
	debounceTime = 300;
	mapReady: boolean = false;
	geolocation?: GeolocationModel

	showCreateEventSuccess = false;

	filteredGenders: TypeModel[] = [];


	currentSlide = 0;

	defaultDescription = 'This meeting is open to all those who wish to make new friends, have an enjoyable time, and share carefree moments.\n\n' +
		'If you\'re new in town, looking for company, or want to have a pleasant time, join us and you\'ll be welcome!';

	@ViewChild('slides') swiperElement: any;
	currentStep = signal(0);
	steps = ['General', 'Participants', 'Place'];
	defaultDate = DateTime.now().plus({ day: 1 }).set({hour:12,minute:0,second:0,millisecond:0}).toISO();
	minDate = DateTime.fromISO(this.defaultDate).toISODate();
	formattedStartDate=format(parseISO(this.defaultDate as string), "yyyy-MM-dd 'at' hh:mm a");

	participantSizes: ParticipantSize[] = [];

	generalForm = new FormGroup({
		description: new FormControl(this.defaultDescription, [Validators.required]),
		eventType: new FormControl('', [Validators.required]),
		startingDate: new FormControl(this.defaultDate, [Validators.required]),
		avgCostMax: new FormControl(null),
		isOffered: new FormControl(false, [Validators.required])
	});

	participantsForm = new FormGroup({
		participantSizeGroup: new FormControl('', [Validators.required]),
		language: new FormControl(null, [Validators.required]),
		gender: new FormControl('', [Validators.required]),
		minAge: new FormControl(18, [Validators.required, Validators.max(60), Validators.min(18)]),
		maxAge: new FormControl(65, [Validators.max(65), Validators.min(18)])
	});


	backButtonSub!: Subscription;


	constructor(private typeApiService: TypeApiService, private userAuth: UserAuthService, private platform: Platform,
		private businessClientApiService: BusinessClientApiService, private eventApiService: EventApiService,
		private router: Router, private toast: ToastService,
		private radarMapApiService: RadarApiService) {
		addIcons({ calendarClearOutline, location, close });
	}

	async ngOnInit() {
		this.initLocationAndSearch(true);
		this.fetchData();
	}

	ionViewDidEnter() {
		this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
			console.log(this.currentStep());
			const currentSlide = this.currentStep();
			const prevSlide = currentSlide - 1;
			if (prevSlide >= 0) {
				this.gotoStep(prevSlide);
			}
		});
	}


	onOfferChanged(event: IonCheckboxCustomEvent<CheckboxChangeEventDetail<any>>) {
		console.log(event.detail.checked);
		if (!event.detail.checked) {
			this.generalForm.controls.avgCostMax.patchValue(null);
		}
	}

	onCreateEventSuccessDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showCreateEventSuccess = false;
		if (event.detail.data) {
			const data = event.detail.data;
			if (data.home) {
				this.router.navigate(['/tabs'], { replaceUrl: true });
			} else if (data.myEvents) {
				this.router.navigate(['/tabs/my-events'], { replaceUrl: true })
			}
		} else {
			this.router.navigate(['/tabs'], { replaceUrl: true })
		}
	}


	onSlideChanged(event: any) {
		this.currentSlide = event.detail[0].realIndex;
		if (this.currentSlide === 2) {
			// this.initLocationAndSearch(true);
		}
	}

	private fetchData() {
		this.user = this.userAuth.currentUser();

		combineLatest([this.typeApiService.getEventTypes(), this.typeApiService.getLanguages(),
		this.typeApiService.getGenders(),
		this.typeApiService.getCountries(),
		this.typeApiService.getParticipantSize()

		]).subscribe(([eventTypes, languages, genders, countries, participants]) => {
			this.eventTypes = eventTypes;
			this.languages = languages;
			this.genders = genders;
			this.filteredGenders = this.genders;
			this.countries = countries;
			this.participantSizes = participants;
			this.isDataLoading = false;
		})
	}

	fetchAddresses(query: string) {
		this.isAddressLoading = true;
		this.addressLocations = [];
		this.radarMapApiService.searchAutocomplete(query)
			.pipe(take(1))
			.subscribe(addresses => {
				this.addressLocations = [...addresses];
				this.isAddressLoading = false;
			})
	}

	normalizeValues() {
		// General Info
		if (this.generalForm.get('isOffered')?.value && this.generalForm.get('avgCostMax')?.value) {
			// this.generalInformationForm.get('avgCostMax')?.patchValue(this.generalInformationForm.get('avgCostMax')?.value.replace('CHF', '').replace('.00', ''));
		} else {
			this.generalForm.get('avgCostMax')?.patchValue(null);
		}
	}

	selectParticipantSize(event: any) {
		const value = event.target.value;
		this.participantsForm.patchValue({ gender:'' });
		const participantSize = this.participantSizes.find(p => p.id === value);
		if (participantSize) {
			this.participantSizes.forEach(pS => {
				if (pS.id !== participantSize.id) {
					pS.selected = false;
				}
			})
			participantSize.selected = true;
			this.participantsForm.get("participantSizeGroup")?.patchValue(participantSize.id);
			this.filteredGenders = this.genders.filter(gender => this.filterGender(gender));
		}
	}


	async createEvent() {
		try {
			this.isCreatingEvent = true;
			const businessClientId = this.selectedBusiness;
			this.normalizeValues();
			const eventDto = {
				...this.generalForm.value,
				...this.participantsForm.value,
				businessClientId: businessClientId
			}

			const eventType = this.eventTypes.find(e => e.id === this.generalForm.value.eventType);
			if (eventType) {
				eventDto.eventType = eventType as any;

			}

			const selectedLanguage = this.participantsForm.value.language;
			if (selectedLanguage) {
				const language = this.languages.find(l => l.isoCodeLanguage === selectedLanguage);
				if (language) {
					eventDto.language = language as any;
				}
			}

			const genderInfo = this.participantsForm.value.gender;

			if (genderInfo) {
				const gender = this.genders.find(g => g.id === genderInfo);
				if (gender) {
					eventDto.gender = gender as any;
				} else {
					eventDto.gender = null as any;
				}
			}

			if (this.participantsForm.value.participantSizeGroup) {
				const participantSizeGroup = this.participantSizes.find(p => p.id === this.participantsForm.value.participantSizeGroup);
				if (participantSizeGroup) {
					eventDto.participantSizeGroup = participantSizeGroup as any;
				}
			}


			console.log(eventDto);
			this.eventApiService.save(eventDto)
				.pipe(take(1))
				.subscribe(async () => {
					this.isCreatingEvent = false;
					this.toast.show('Your event has been created successfully');
					this.showCreateEventSuccess = true;
				}, async error => {
					this.isCreatingEvent = false;
					console.log('error', error);
					this.toast.show('Failed to create event');
				})

		} catch (error) {
			this.isCreatingEvent = false;
			console.log('error', error);
		}

	}

	onClearSearch() {
		this.isRefresh = false;
		this.selectedBusiness = '';
		this.geoPositionClient = {
			latitude: this.userLocation.latitude,
			longitude: this.userLocation.longitude,
			distanceKm: 200
		}
		this.searchQuery = '';
		this.searchBusinessClients();
	}

	searchByPosition(item: any) {
		console.log('here', item);
		this.geoPositionClient = {
			latitude: item.latitude,
			longitude: item.longitude,
			distanceKm: 100
		}

		this.searchBusinessClients();
		this.isActiveSearch = false;
		this.searchQuery = item.formattedAddress;
	}

	onChangeSearch(event: any) {
		this.isRefresh = false;
		this.selectedBusiness = '';
		this.isActiveSearch = true;
		this.searchQuery = event.detail.value.trim();
		if (this.searchQuery) {
			this.fetchAddresses(this.searchQuery)
		} else {
			this.searchQuery = '';
			this.addressLocations = [];
			this.geoPositionClient = {
				latitude: this.userLocation.latitude,
				longitude: this.userLocation.longitude,
				distanceKm: 200
			}
			this.mapMarkers = this.mapMarkers.filter(m => m.selfMarker);

		}
	}


	getStartingDate() {
		return this.generalForm.get("startingDate")?.value;
	}

	onResetMyLocation() {
		this.selectedBusiness = '';
		this.mapMarkers = [];
		this.initLocationAndSearch();
	}

	onSelectBusinessClient(businessClient: BusinessClient) {
		this.selectedBusiness = businessClient.id;
	}

	searchBusinessClients(init: boolean = false) {
		const eventDate = this.getStartingDate();
		this.mapMarkers = this.mapMarkers.filter(m => m.selfMarker);
		if (!eventDate)
			return;
		this.businessClientApiService.searchBusinessClients(eventDate, this.geoPositionClient)
			.subscribe(businessClients => {
				this.businessClients = businessClients;
				this.initMarkers();
				console.log(init);
				if (!init) {
					this.isRefresh = true;
				}
			});
	}

	initMarkers() {
		for (let i = 0; i < this.businessClients.length; i++) {
			const businessClient = this.businessClients[i];
			this.mapMarkers.push({
				geoLocation: {
					latitude: businessClient.geolocation.latitude,
					longitude: businessClient.geolocation.longitude,
				},
				id: i + 2,
				selfMarker: false,
			})
		}
	}

	async initLocationAndSearch(init: boolean = false) {
		let isLocationAvailable = false;
		this.addressLocations = [];
		if (Capacitor.isNativePlatform()) {
			try {

				const location = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
				if (location) {
					await this.populateSearchRequest(location.coords.latitude, location.coords.longitude);
					isLocationAvailable = true;
				}
			}
			catch (error) {
				console.log('error', error);
			}
		}
		if (!isLocationAvailable) {
			this.fetchLocationFromRadar(init);
		}

	}


	fetchLocationFromRadar(init: boolean = false) {
		this.radarMapApiService.fetchGeolocationAddress().
			pipe(take(1))
			.subscribe(geolocationAddress => {
				console.log('radar', geolocationAddress);
				let address = geolocationAddress.formattedAddress;
				if (!address) {
					address = `${geolocationAddress.city}, ${geolocationAddress.country}`
				}

				this.userLocation = {
					latitude: geolocationAddress.latitude,
					longitude: geolocationAddress.longitude
				}
				this.geoPositionClient = {
					latitude: this.userLocation.latitude,
					longitude: this.userLocation.longitude,
					distanceKm: 200
				}
				this.searchQuery = address;
				this.isMyLocationLoading = false;
				this.mapMarkers = [{ id: 1, geoLocation: { latitude: this.userLocation.latitude, longitude: this.userLocation.longitude }, selfMarker: true }]
				this.searchBusinessClients(init);
			});

	}

	async populateSearchRequest(latitude: number, longitude: number) {
		const address = await this.radarMapApiService.reverseGeocodeLocation(latitude, longitude);
		if (address) {
			this.searchQuery = address;
		}
		this.userLocation = {
			latitude,
			longitude
		}
		this.geoPositionClient = {
			latitude: this.userLocation.latitude,
			longitude: this.userLocation.longitude,
			distanceKm: 200
		}
		this.mapMarkers = [{ id: 1, geoLocation: { latitude: this.userLocation.latitude, longitude: this.userLocation.longitude }, selfMarker: true }]
		this.isMyLocationLoading = false;
		this.searchBusinessClients();

	}


	gotoStep(i: number) {
		console.log(this.currentStep());
		console.log(i);
		if (i > (this.currentStep())) {
			if (i == 0) {
				this.swiperElement?.nativeElement.swiper.slideTo(0);
				this.currentStep.set(i);
			}
			else if (i === 1 && this.generalForm.valid) {
				this.swiperElement?.nativeElement.swiper.slideTo(1);
				this.currentStep.set(i);
			} else if (i === 2 && this.participantsForm.valid && this.generalForm.valid) {
				this.swiperElement?.nativeElement.swiper.slideTo(2);
				this.currentStep.set(i);
			}

		} else {
			this.swiperElement?.nativeElement.swiper.slideTo(i);
			this.currentStep.set(i);
		}
	}

	next() {
		if (this.currentStep() < this.steps.length - 1) {
			this.currentStep.set(this.currentStep() + 1);
			this.swiperElement?.nativeElement.swiper.slideTo(this.currentStep());
		}
	}

	previous() {
		if (this.currentStep() > 0) {
			this.currentStep.set(this.currentStep() - 1);
			this.swiperElement?.nativeElement.swiper.slideTo(this.currentStep());
		}
	}

	filterGender(gender: TypeModel) {
		if (!this.user.gender.id) {
			return gender.id === undefined;
		}
		console.log(this.participantSizes);
		const participantSize = this.participantSizes.filter(pS => pS.selected)[0];
		const isDuo = participantSize.id === 'DUO';
		if (!isDuo) {
			return [this.user.gender.id, undefined].includes(gender.id);
		}
		return true;
	}


	onStartDateChanged(event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
		if (event.target.value) {
			const dateValue = event.target.value;
			const dt = DateTime.fromISO(dateValue as string);
			const formattedISO = dt.toUTC().toISO({ suppressMilliseconds: false });
			this.generalForm.patchValue({ startingDate: formattedISO });
			this.formattedStartDate = format(parseISO(dateValue as string), "yyyy-MM-dd 'at' hh:mm a");
		}
	}


	isLastStep(): boolean {
		return this.currentStep() === this.steps.length - 1;
	}

	ionViewWillLeave() {
		console.log('leave')
		if (this.backButtonSub) {
			this.backButtonSub.unsubscribe();
		}
	}

}
