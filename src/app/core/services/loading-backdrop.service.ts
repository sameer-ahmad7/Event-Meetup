import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
	providedIn: 'root'
})
export class LoadingBackdropService {

	private loadingEl!: HTMLIonLoadingElement;

	constructor(private loadingCtrl: LoadingController) { }

	async show() {
		this.loadingEl = await this.loadingCtrl.create({ backdropDismiss: false });
		this.loadingEl.present();
	}

	hide() {
		if (this.loadingEl) {
			this.loadingEl.dismiss();
		}
	}


}
