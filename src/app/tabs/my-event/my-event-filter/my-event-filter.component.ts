import { Component, inject, input, OnInit } from '@angular/core';
import { DatetimeChangeEventDetail, ModalController } from '@ionic/angular';
import { IonDatetimeCustomEvent } from '@ionic/core';
import { DateTime } from 'luxon';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { Language } from 'src/app/core/models/type/language.model';
import { TypeModel } from 'src/app/core/models/type/type.model';
import { User } from 'src/app/core/models/user.models';
import { TypeApiService } from 'src/app/core/rest/type-api.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonInput, IonIcon, IonPopover, IonDatetime, IonLabel, IonCheckbox, IonButton, IonProgressBar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarClearOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TitleCasePipe } from '@angular/common';
import { isAfter, isBefore } from 'date-fns';

@Component({
	selector: 'app-my-event-filter',
	templateUrl: './my-event-filter.component.html',
	styleUrls: ['./my-event-filter.component.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonProgressBar, IonButton, IonCheckbox, IonLabel, IonDatetime, IonPopover, IonIcon, IonInput, FormsModule, NgSelectModule, TitleCasePipe,
		IonItem, IonList, IonHeader, IonTitle, IonToolbar]
})
export class MyEventFilterComponent implements OnInit {

	private modalCtrl = inject(ModalController);
	user!: User;
	isLoading = true;
	appliedFilters = input.required<any>();
	filters!: any;
	minStartDate = DateTime.now().toISO();
	minEndDate=DateTime.now().toISO();
	eventStatuses: any[] = [];
	languages: Language[] = [];

	startDate = '';
	formattedStartDate = '';
	endDate = '';
	formattedEndDate = '';
	selectedLanguage: string | null = null; // ✅ Use `null` instead of empty string
	selectedEventStatus = '';



	constructor(public sharedService: SharedService, private typeApiService: TypeApiService,
		private userAuth: UserAuthService,
	) {

		addIcons({ calendarClearOutline });
	}

	ngOnInit() {
		this.filters = this.appliedFilters();
		this.fetchData();
	}

	private fetchData() {
		this.user = this.userAuth.currentUser()
		this.typeApiService.getLanguages()
			.subscribe(languages => {
				this.languages = languages
				this.typeApiService.getEventStatuses()
					.subscribe(statuses => {
						this.eventStatuses = statuses.map(status => {
							return {
								name: status.id,
								description: status.description,
								checked: false
							}
						})
						console.log(this.eventStatuses);
						this.initFilters();
					})
			});
	}

	onStartDateChanged(event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
		if (event.target.value) {
			const dateValue = event.target.value as string;
			this.minEndDate=dateValue as string;
			if(this.endDate && isAfter(dateValue,this.endDate)){
				console.log('here');
				this.endDate=this.startDate;
				this.formattedEndDate = DateTime.fromISO(this.endDate).toLocaleString(DateTime.DATE_SHORT);
				this.filters.endDate = DateTime.fromISO(this.endDate).toUTC().toISO();
			}
			this.startDate = dateValue as string;
			this.formattedStartDate = DateTime.fromISO(dateValue as string).toLocaleString(DateTime.DATE_SHORT);
			this.filters.startingDate = DateTime.fromISO(this.startDate).toUTC().toISO();
		}
	}

	onEndDateChanged(event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
		if (event.target.value) {
			const dateValue = event.target.value as string;
			this.endDate = dateValue as string;
			if(this.startDate && isBefore(dateValue,this.startDate)){
				this.startDate=this.endDate;
				this.formattedStartDate = DateTime.fromISO(this.startDate).toLocaleString(DateTime.DATE_SHORT);
				this.filters.startDate = DateTime.fromISO(this.startDate).toUTC().toISO();
			}
			this.minEndDate=this.endDate;
			this.formattedEndDate = DateTime.fromISO(dateValue as string).toLocaleString(DateTime.DATE_SHORT);
			this.filters.endingDate = DateTime.fromISO(this.endDate).toUTC().toISO();
		}
	}


	onChangeEventStatusCheck() {
		this.filters.statusesEvent = this.eventStatuses.filter(status => status.checked).map(status => status.name);
	}

	clearFilters() {
		this.filters = {
			startingDate: null,
			endingDate: null,
			isoCodeLanguage: null,
			eventType: null,
			geoPositionEvent: null,
			statusesEvent: []
		};
		this.startDate = '';
		this.endDate = '';
		this.selectedLanguage = null;
		this.eventStatuses.forEach(status => status.checked = false);
	}

	onLanguageChange() {
		this.filters.isoCodeLanguage = this.selectedLanguage;
	}



	initFilters() {
		if (this.filters.statusesEvent && this.filters.statusesEvent.length > 0) {
			this.eventStatuses.forEach(status => status.checked = this.filters.statusesEvent.includes(status.name));
		}
		if (this.filters.startingDate) {
			this.startDate = this.filters.startingDate;
		}
		if (this.filters.endingDate) {
			this.endDate = this.filters.endingDate;
		}
		if (this.filters.isoCodeLanguage) {
			this.selectedLanguage = this.filters.isoCodeLanguage;
		}
		this.isLoading = false;
	}

	onApplyFilter() {
		console.log(this.filters);
		this.modalCtrl.dismiss(this.filters, 'confirm');
	}




}
