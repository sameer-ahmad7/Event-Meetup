import { Component, Input, input, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonList, IonLabel, IonItem, IonToolbar } from '@ionic/angular/standalone';
import { BusinessClient } from 'src/app/core/models/business-client.model';

@Component({
	selector: 'app-show-working-hours',
	templateUrl: './show-working-hours.component.html',
	styleUrls: ['./show-working-hours.component.scss'],
	standalone: true,
	imports: [IonItem, IonLabel, IonList]
})
export class ShowWorkingHoursComponent implements OnInit {

	@Input() business!: BusinessClient;
	workingHoursInfo: { day: string; timeIntervals: { startTime: string; endTime: string }[] }[] = [];

	constructor() { }

	ngOnInit() {
		this.getWorkingTimes();
	}

	getWorkingTimes() {
		this.business.businessDays.forEach(businessDay => {
			const dayOfTheWeek = businessDay.dayOfWeek.charAt(0) + businessDay.dayOfWeek.substring(1).toLowerCase();
			if (businessDay.openingPeriods.length > 0) {
				const timeIntervals: { startTime: string; endTime: string }[] = [];
				for (const openingPeriod of businessDay.openingPeriods) {
					const startTime = this.removeSeconds(openingPeriod.startTime);
					const endTime = this.removeSeconds(openingPeriod.endTime);
					timeIntervals.push({ startTime, endTime });
				}
				this.workingHoursInfo.push({
					day: dayOfTheWeek,
					timeIntervals
				})

			}

		})
	}

	removeSeconds(time: string) {
		return time.substring(0, time.length - 3);
	}


}
