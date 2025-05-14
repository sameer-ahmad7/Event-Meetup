import { GeolocationModel } from "./geolocation.model";

export interface MarkerModel {

	id: number;
	geoLocation: GeolocationModel
	htmlPopup?: string;
	selfMarker: boolean;
}

