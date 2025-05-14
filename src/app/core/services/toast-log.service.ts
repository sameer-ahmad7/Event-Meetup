import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { ToastService } from "./toast.service";

@Injectable({
	providedIn: 'root',
})
export class ToastLogService {

	constructor(private toast: ToastService) {
	}
	debug(msg: string) {
		console.log(msg);
		if (environment.debugMode) {
			this.toast.show(msg);
			console.log(msg);
		}
	}
}
