import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
	providedIn: 'root'
})
export class ToastService {

	constructor(private toastController: ToastController) { }

	async show(message: string = '', header = '', color = 'primary', position: 'top' | 'middle' | 'bottom' = 'top') {

		const toast = await this.toastController.create({
			header,
			color,
			message,
			duration: 1500,
			position
		});


		await toast.present();

	}

}
