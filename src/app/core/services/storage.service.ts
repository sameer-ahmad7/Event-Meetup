import { Injectable } from '@angular/core'
import { CookieService } from "ngx-cookie-service";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class StorageService {
	private cacheTimeout = 60 * 60 * 1000; // 60 minutes


	constructor(private cookieService: CookieService) {

	}

	public setCookie(cookieKey: any, cookieValue: any) {
		this.cookieService.set(cookieKey, cookieValue);
	}

	public getCookie(cookieKey: any) {
		this.cookieService.get(cookieKey);
	}

	public setCache(cacheKey: any, cacheValue: any): void {
		const cache = {
			data: cacheValue,
			timestamp: Date.now()
		};
		localStorage.setItem(cacheKey, JSON.stringify(cache));
	}

	public getCache(cacheKey: any): any {
		const cacheString = localStorage.getItem(cacheKey);
		if (!cacheString) {
			return null;
		}
		const cache = JSON.parse(cacheString);
		const now = Date.now();
		if (now - cache.timestamp < this.cacheTimeout) {
			return cache.data;
		} else {
			localStorage.removeItem(cacheKey);
			return null;
		}
	}

	getData(cacheKey: string, fetchData: () => Observable<any>) {
		if (!environment.enableCache) {
			return fetchData();
		}
		const data = this.getCache(cacheKey);
		return data ? of(data) : fetchData().pipe(
			tap(response => {
				this.setCache(cacheKey, response);
			}));
	}
}
