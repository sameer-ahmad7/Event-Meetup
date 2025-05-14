import { Component, OnInit } from '@angular/core';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import { IonButton, ModalController } from '@ionic/angular/standalone';

@Component({
	selector: 'app-notification-permission',
	templateUrl: './notification-permission.component.html',
	styleUrls: ['./notification-permission.component.scss'],
	providers: [ModalController],
	imports: [IonButton]
})
export class NotificationPermissionComponent implements OnInit {

	constructor(private modalController: ModalController) { }

	ngOnInit() { }

	async requestNotificationPermission() {
		// Open location settings
		await NativeSettings.open({
			optionAndroid: AndroidSettings.AppNotification,
			optionIOS: IOSSettings.App
		});
		this.modalController.dismiss();
	}


}
