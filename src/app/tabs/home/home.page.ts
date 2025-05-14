import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonModal, IonButton, IonIcon, IonInput, IonButtons, IonSegmentButton, IonSegment } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notifications, mapOutline, listOutline, filter, location, close, add } from 'ionicons/icons';
import { EventFilterPage } from "../../shared/event-filter/event-filter.page";
import { OverlayEventDetail } from '@ionic/core';
import { MapViewPage } from "../../pages/map-view/map-view.page";
import { ListViewPage } from 'src/app/pages/list-view/list-view.page';
import { SharedService } from 'src/app/core/services/shared.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { EventApiService } from 'src/app/core/rest/event-api.service';
import { TypeApiService } from 'src/app/core/rest/type-api.service';
import { RadarApiService } from 'src/app/core/rest/radar-api.service';
import { combineLatest, filter as filterObs, Subject, Subscription, take, takeUntil } from 'rxjs';
import { EventSearchRequest } from 'src/app/core/dto/request/event-search-request.model';
import { EventItem } from 'src/app/core/models/event-item.model';
import { GeolocationModel } from 'src/app/core/models/geolocation.model';
import { AddressLocationResponse } from 'src/app/core/models/map/address-location-response.model';
import { MarkerModel } from 'src/app/core/models/marker-model';
import { Country } from 'src/app/core/models/type/country.model';
import { Language } from 'src/app/core/models/type/language.model';
import { TypeModel } from 'src/app/core/models/type/type.model';
import { UserPositionModel } from 'src/app/core/models/user-position.model';
import { BusinessClient } from 'src/app/core/models/business-client.model';
import { NO_MAX_LIMIT_AGE } from 'src/app/core/common/constant';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Router, RouterLink } from '@angular/router';
import { AddressService } from 'src/app/services/address.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.page.html',
	styleUrls: ['./home.page.scss'],
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [IonSegmentButton, IonButtons, IonSegment,
		ListViewPage, MapViewPage,
		IonInput, IonIcon, IonButton, IonModal, IonContent, IonHeader, IonTitle, IonToolbar,
		CommonModule, FormsModule, EventFilterPage, MapViewPage]
})
export class HomePage implements OnInit, OnDestroy {

	private destroy$ = new Subject<void>();
	eventsMap: { [key: string]: EventItem[] } = {};
	mapMarkers: MarkerModel[] = [];
	userLocation!: { latitude: number; longitude: number,address:string };
	viewMap = false;
	showFilter = false;
	viewMode: 'map' | 'list' = 'list';

	isActiveSearch = false;
	isRefresh = false;
	isRefreshMyLocation = false;

	FILTER_EVENTS_CACHE_KEY = "FILTER_EVENTS_CACHE";

	events: EventItem[] = [];
	eventMarkers: MarkerModel[] = [];
	eventTypes: TypeModel[] = [];
	languages: Language[] = [];
	countries: Country[] = [];
	genders: TypeModel[] = [];

	filtersNumber: number = 0;
	eventSearchRequest = new EventSearchRequest();
	initEventSearchRequest!: EventSearchRequest;

	searchQuery: string = '';

	isAddressSearchQuery = true;

	// Place Info
	addressLocations: AddressLocationResponse[] = [];
	debounceTime = 300;
	mapReady: boolean = false;
	geolocation?: GeolocationModel
	selfPosition!: UserPositionModel;

	// Auxiliar
	startingDate: Date[] = [];

	userSessionId: string;
	isLoading = true;
	isDataLoading = true;
	isAddressLoading = false;
	notificationCount = 0;
	notifications$!: Subscription;
	refreshEvent!: CustomEvent;

	constructor(private sharedService: SharedService, private storageService: StorageService,
		private userAuthService: UserAuthService, private eventApiService: EventApiService,
		private notificationService: NotificationService, private router: Router, private addressService: AddressService,
		private typeApiService: TypeApiService, private radarMapApiService: RadarApiService,
		private titlePipe: TitleCasePipe, private datePipe: DatePipe

	) {
		addIcons({ notifications, listOutline, mapOutline, location, close, filter });
		if (this.sharedService.isNotificationOpen()) {
			this.sharedService.openCloseNotification();
		}
		this.userSessionId = this.userAuthService.currentUser().userId;
	}

	gotoNotifications() {
		this.router.navigate(['notifications']);
	}

	onChangeSearch(event: any) {
		this.isAddressSearchQuery = false;
		this.isActiveSearch = true;
		this.searchQuery = event.detail.value.trim();
		if (this.searchQuery) {
			this.fetchAddresses(this.searchQuery)
		} else {
			this.isAddressSearchQuery = true;
			this.searchQuery = '';
			this.addressLocations = [];
			this.eventSearchRequest.formattedAddress = '';
			this.eventSearchRequest.geoPositionEvent = undefined;
		}
	}

	fetchAddresses(query: string) {
		this.isAddressLoading = true;
		this.addressLocations = [];
		this.radarMapApiService.searchAutocomplete(query)
			.pipe(take(1))
			.subscribe(addresses => {
				this.addressLocations = [...addresses];
				console.log(addresses);
				this.isAddressLoading = false;
			})
	}


	onClearSearch() {
		this.searchQuery = '';
		this.eventSearchRequest.geoPositionEvent = undefined;
		this.isLoading = true;
		this.searchEvents();
	}

	async ngOnInit() {
		this.notificationService.
			unreadNotifications$.
			pipe(takeUntil(this.destroy$))
			.subscribe(
				count => {
					console.log(count);
					this.notificationCount = count;
				}
			);

		this.addressService.isLoading$.pipe(
			filterObs(loading => !loading)
		).subscribe(_ => {
			const address = this.addressService.address;
			if (address) {
				console.log('pre populated');
				this.userLocation = {
					latitude: address.lat,
					longitude: address.lng,
					address:address.address
				};
				this.eventSearchRequest
					.geoPositionEvent = {
					latitude: address.lat,
					longitude: address.lng,
					distanceKm: 100
				};
				this.mapMarkers = [{ id: 1, geoLocation: { latitude: this.userLocation.latitude, longitude: this.userLocation.longitude }, selfMarker: true }]

				this.searchQuery = address.address;
				this.searchEvents();
				this.listenForLocationUpdates();
			} 
		})

		this.fetchData();

		// const filters = this.storageService.getCache(this.FILTER_EVENTS_CACHE_KEY);
		// console.log(filters);
		// if (filters) {
		// 	this.eventSearchRequest = filters;
		// 	this.searchEvents();
		// }
	}

	listenForLocationUpdates(){
		this.addressService.address$.pipe(
			takeUntil(this.destroy$)
		).subscribe(address=>{
			this.userLocation = {
				latitude: address.lat,
				longitude: address.lng,
				address:address.address
			};
	})
	}

	async onResetMyLocation() {
		this.addressService.getLocation();
		this.isLoading = true;
		if (this.eventSearchRequest.isoCodeLanguage) {
			this.eventSearchRequest.isoCodeLanguage = undefined;
		}
		if (this.eventSearchRequest.startingDate) {
			this.eventSearchRequest.startingDate = undefined;
		}
		if (this.eventSearchRequest.eventType) {
			this.eventSearchRequest.eventType = undefined;
		}
		this.eventSearchRequest
		.geoPositionEvent = {
		latitude: this.userLocation.latitude,
		longitude: this.userLocation.longitude,
		distanceKm: 100
	};
	this.mapMarkers = [{ id: 1, geoLocation: { latitude: this.userLocation.latitude, longitude: this.userLocation.longitude }, selfMarker: true }]

	this.searchQuery = this.userLocation.address;
	this.searchEvents(false,true);

	}



	private fetchData() {

		combineLatest([this.typeApiService.getEventTypes(), this.typeApiService.getLanguages(),
		this.typeApiService.getGenders(),
		this.typeApiService.getCountries()

		]).subscribe(([eventTypes, languages, genders, countries]) => {
			this.eventTypes = eventTypes;
			this.languages = languages;
			this.genders = genders;
			this.countries = countries;
			this.isDataLoading = false;
		})
	}

	getAllEvents() {
		this.eventApiService
			.getAllEvents()
			.subscribe(events => {
				this.events = events;
				this.events.sort((a, b) => new Date(a.startingDate).getTime() - new Date(b.startingDate).getTime());
				this.isLoading = false;
				// this.buildEventMarkers();
			});
	}

	searchByPosition(item: any, updateFilter = false) {
		// do something with selected item
		console.log("Search by position ", item);
		this.isLoading = true;

		this.eventSearchRequest.geoPositionEvent = {
			latitude: item.latitude,
			longitude: item.longitude,
			distanceKm: 100
		}
		this.eventSearchRequest.formattedAddress = item.formattedAddress;
		this.eventSearchRequest.selfPosition = !updateFilter;
		this.searchEvents();
		this.isActiveSearch = false;
		this.searchQuery = item.formattedAddress;
	}


	onFilterDismissed(event: CustomEvent<OverlayEventDetail>) {
		this.showFilter = false;
		if (event.detail.data) {
			const filter = event.detail.data;
			if (filter) {
				this.eventSearchRequest = filter;
				this.searchEvents();
				this.isLoading = true;
			}
		}
	}

	handleRefresh(event: CustomEvent) {
		this.refreshEvent = event;
		this.searchEvents();
	}

	getLanguageTitle(languageName: string) {
		return this.titlePipe.transform(languageName);
	}

	getFormattedDate(date: Date) {
		return this.datePipe.transform(date, 'dd LLLL yyyy') + ' - ' + this.datePipe.transform(date, 'shortTime')
	}


	updateFiltersNumber() {
		const ignoreAttributes = ['selfPosition', 'formattedAddress'];
		this.filtersNumber = 0
		console.log(this.eventSearchRequest);
		Object.keys(this.eventSearchRequest).forEach((key) => {
			const filterValue = (this.eventSearchRequest as any)[key];
			if (key === 'geoPositionEvent') {
				if (filterValue && !this.eventSearchRequest.selfPosition) {
					this.filtersNumber++;
				}
			} else if (!ignoreAttributes.includes(key) && filterValue) {
				this.filtersNumber++;
			}
		});
	}

	refreshEvents(){
		this.searchEvents();
	}

	searchEvents(init: boolean = false, isRefreshMyLocation: boolean = false) {
		this.isRefresh = false;
		this.isRefreshMyLocation = false;
		this.geolocation = this.eventSearchRequest.geoPositionEvent;
		// this.isLoading = true;
		this.mapMarkers = this.mapMarkers.filter(m => m.selfMarker);
		this.updateFiltersNumber();
		this.storageService.setCache(this.FILTER_EVENTS_CACHE_KEY, this.eventSearchRequest);
		this.eventApiService
			.searchEvents(this.eventSearchRequest)
			.pipe(take(1))
			.subscribe(events => {
				this.events = events
				this.events.sort((a, b) => new Date(a.startingDate).getTime() - new Date(b.startingDate).getTime());
				this.getEventLocations();
				setTimeout(() => {
					if (this.refreshEvent) {
						(this.refreshEvent.target as HTMLIonRefresherElement).complete();
						(this.refreshEvent as any) = null;
					}

				}, 500);
				this.isLoading = false;
				if (isRefreshMyLocation) {
					this.isRefreshMyLocation = true;
				}
				if (!init) {
					this.isRefresh = true;
				}
			});
	}


	getEventLocations() {
		const uniqueLocations = Array.from(new Set(this.events.map(e => `${e.businessClient.geolocation.latitude},${e.businessClient.geolocation.longitude}`)));
		if (uniqueLocations.length > 0) {
			uniqueLocations.forEach((location, index) => {
				const coords = location.split(",");
				const lat = parseFloat(coords[0]);
				const lng = parseFloat(coords[1]);
				this.mapMarkers.push({
					geoLocation: {
						latitude: lat,
						longitude: lng,
					},
					id: index + 2,
					selfMarker: false,
				})
			});
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

}

