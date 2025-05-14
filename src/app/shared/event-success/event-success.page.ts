import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
	selector: 'app-event-success',
	templateUrl: './event-success.page.html',
	styleUrls: ['./event-success.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonButton, IonIcon, IonButtons, IonContent, IonHeader, IonToolbar, CommonModule, FormsModule]
})
export class EventSuccessPage implements OnInit {

	constructor(private modalCtrl: ModalController) {
		addIcons({ close });
	}

	ngOnInit() {
	}

	dismiss() {
		this.modalCtrl.dismiss();
	}

	gotoEvents() {
		this.modalCtrl.dismiss({ events: true });
	}

}
