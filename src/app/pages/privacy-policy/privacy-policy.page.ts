import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';

@Component({
	selector: 'app-privacy-policy',
	templateUrl: './privacy-policy.page.html',
	styleUrls: ['./privacy-policy.page.scss'],
	standalone: true,
	imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PrivacyPolicyPage implements OnInit {

	constructor() {
		addIcons({ chevronBack });
	}

	ngOnInit() {
	}

}
