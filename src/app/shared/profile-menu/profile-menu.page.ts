import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { SharedService } from 'src/app/core/services/shared.service';
import { User } from 'src/app/core/models/user.models';
import { AvatarModule } from 'ngx-avatars';
import { Router, RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular';

@Component({
	selector: 'app-profile-menu',
	templateUrl: './profile-menu.page.html',
	styleUrls: ['./profile-menu.page.scss'],
	standalone: true,
	providers: [ModalController],
	imports: [IonLabel, IonItem, IonList, IonContent, IonHeader, IonTitle, IonToolbar,
		AvatarModule,
		CommonModule, FormsModule]
})
export class ProfileMenuPage implements OnInit {

	user = input.required<User>();

	constructor(public sharedService: SharedService, private modal: ModalController, private router: Router) {
		addIcons({ close });
	}

	ngOnInit() {
	}

	gotoSettings() {
		this.router.navigate(['/account-settings']);
		this.modal.dismiss();
	}

	gotoProfile() {
		this.router.navigate(['/profile']);
		this.modal.dismiss();
	}

	gotoContact() {
		this.router.navigate(['/contact']);
		this.modal.dismiss();
	}

	logout() {
		this.sharedService.signOut();
	}

}
