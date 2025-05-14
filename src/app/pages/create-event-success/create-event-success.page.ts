import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, ModalController, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';


@Component({
	selector: 'app-create-event-success',
	templateUrl: './create-event-success.page.html',
	styleUrls: ['./create-event-success.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonIcon, IonButtons, IonButton, IonContent, IonHeader, IonToolbar, CommonModule, FormsModule]
})
export class CreateEventSuccessPage implements OnInit {

	constructor(private modalCtrl: ModalController) {
		addIcons({ close });

	}

	ngOnInit() {
	}

	dismiss() {
		this.modalCtrl.dismiss();
	}

	gotoMyEvents() {
		this.modalCtrl.dismiss({ myEvents: true });
	}

	gotoHome() {
		this.modalCtrl.dismiss({ home: true });
	}

}
