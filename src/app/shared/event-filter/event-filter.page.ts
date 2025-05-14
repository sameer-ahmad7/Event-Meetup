import { Component, inject, input, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonDatetime, IonPopover, IonIcon, IonButton, DatetimeChangeEventDetail, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarClearOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { EventSearchRequest } from 'src/app/core/dto/request/event-search-request.model';
import { Language } from 'src/app/core/models/type/language.model';
import { DateTime } from 'luxon';
import { IonDatetimeCustomEvent } from '@ionic/core';
import { TypeModel } from 'src/app/core/models/type/type.model';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
	selector: 'app-event-filter',
	templateUrl: './event-filter.page.html',
	styleUrls: ['./event-filter.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonLabel, IonButton, IonIcon, IonPopover, IonDatetime, IonInput, IonSelect, IonSelectOption,
		TitleCasePipe, NgSelectModule,
		IonItem, IonList, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class EventFilterPage implements OnInit {

	private modalCtrl = inject(ModalController);
	filter!: EventSearchRequest;
	eventSearchRequest = input.required<EventSearchRequest>();

	minDate = DateTime.now().toISO();

	startDate = '';
	formattedDate = '';
	selectedLanguage: string | null = null; // ✅ Use `null` instead of empty string
	selectedEventType: string = '';

	languages = input.required<Language[]>();
	eventTypes = input.required<TypeModel[]>();


	constructor() {
		addIcons({ calendarClearOutline });
	}

	ngOnInit() {
		this.filter = { ...this.eventSearchRequest() };
		if (this.filter) {
			if (this.filter.eventType) {
				this.selectedEventType = this.filter.eventType.id;
			}
			if (this.filter.isoCodeLanguage) {
				this.selectedLanguage = this.filter.isoCodeLanguage;
			}
			if (this.filter.startingDate) {
				this.startDate = this.filter.startingDate;
				this.formattedDate = DateTime.fromISO(this.startDate).toLocaleString(DateTime.DATE_SHORT);
			}
		}
		console.log(this.filter);
	}


	onStartDateChanged(event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>) {
		console.log(event);
		if (event.target.value) {
			const dateValue = event.target.value;
			this.startDate = dateValue as string;
			this.formattedDate = DateTime.fromISO(dateValue as string).toLocaleString(DateTime.DATE_SHORT);
		}
	}

	onResetFilter() {
		this.selectedEventType = '';
		this.startDate = '';
		this.selectedLanguage = null;
		(this.filter.eventType as any) = undefined;
		this.filter.isoCodeLanguage = undefined;
		this.filter.startingDate = undefined;
		this.formattedDate = '';
	}

	onSelectedLanguageChange() {
		if (!this.selectedLanguage) {
			console.log('here');
			this.filter.isoCodeLanguage = null as any;
		}
	}

	onApplyFilter() {
		if (this.selectedLanguage) {
			this.filter.isoCodeLanguage = this.selectedLanguage;
		}
		if (this.selectedEventType) {
			const selectedEvent = this.eventTypes().find(e => e.id === this.selectedEventType);
			if (selectedEvent) {
				this.filter.eventType = selectedEvent;
			}
		}
		if (this.startDate) {
			this.filter.startingDate = DateTime.fromISO(this.startDate).toUTC().toISO() as string;
		}
		console.log(this.filter);
		this.modalCtrl.dismiss(this.filter, 'confirm');
	}


	onEventSelected(event: any) {
		const value = event.target.value;
		if (value) {
			this.selectedEventType = value;
		}
	}

	dismiss() {
		this.modalCtrl.dismiss();
	}

}
