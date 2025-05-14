import { Injectable } from "@angular/core";
import { WebClientService } from "./web-client.service";
import * as RouteConstants from './route.constant';
import { map } from "rxjs/operators";
import { BusinessClient } from "../models/business-client.model";
import { GeoPositionClient } from "../models/geo-position.client";
import { UserAuthService } from "src/app/auth/user-auth.service";

@Injectable({ providedIn: 'root' })

export class BusinessClientApiService {

	constructor(private webClient: WebClientService,
		private userAuth: UserAuthService) {
	}

	/***
	 * Get All Business Clients
	 */
	getBusinessClients() {
		return this.webClient
			.get<{ businessClients: BusinessClient[] }>(RouteConstants.BUSINESS_CLIENTS_ALL)
			.pipe(map(response => {
				return response.businessClients;
			}));
	}

	/***
	 * Search Business Clients By Position
	 */
	searchBusinessClients(eventDate: string, geoPositionClient?: GeoPositionClient) {
		if (!geoPositionClient) {
			const geolocation = this.userAuth.currentUser().geolocation;
			geoPositionClient = {
				latitude: geolocation!.latitude,
				longitude: geolocation!.longitude,
				distanceKm: 200
			}
		}
		return this.webClient
			.post<{ businessClients: BusinessClient[] }>(RouteConstants.BUSINESS_CLIENTS_SEARCH, {
				geoPositionClient: geoPositionClient,
				startingDate: eventDate
			})
			.pipe(map(response => {
				return response.businessClients;
			}));
	}
}
