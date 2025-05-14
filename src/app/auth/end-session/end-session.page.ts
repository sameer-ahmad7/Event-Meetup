import { Component, OnInit } from '@angular/core';
import { AuthService } from 'ionic-appauth';
import { NotificationService } from "../../core/services/notification.service";
import { environment } from "../../../environments/environment";
import { NavController } from '@ionic/angular';

@Component({
	template: '<p>Signing Out...</p>',
	standalone: false
})
export class EndSessionPage implements OnInit {

	constructor(
		private auth: AuthService,
		private notificationService: NotificationService,
	) { }

	ngOnInit() {
		this.auth.endSessionCallback();
		// location.href = environment.welcomePage;
	}

}
