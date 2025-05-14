import { Component, OnInit } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular/standalone';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

@Component({
	selector: 'app-location-permission',
	templateUrl: './location-permission.component.html',
	styleUrls: ['./location-permission.component.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonButton]
})
export class LocationPermissionComponent implements OnInit {

	constructor(private modalController: ModalController) { }

	ngOnInit() { }

	gotoSettings() {

	}

	async requestLocationPermission() {
		// Open location settings
		await NativeSettings.open({
			optionAndroid: AndroidSettings.ApplicationDetails,
			optionIOS: IOSSettings.App
		});
		this.modalController.dismiss();

	}
}
