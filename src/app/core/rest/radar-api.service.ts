import { Injectable } from "@angular/core";
import { MapLocationResponse } from "../models/map/map-location-response.model";
import * as RouteConstants from './route.constant';
import { map } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";
// @ts-ignore
import Radar from 'radar-sdk-js';
import { Observable, Subject } from "rxjs";
import { GeolocationAddress } from "../models/GeolocationAddress.model";
import { StorageService } from "../services/storage.service";
import { Cacheable } from "ts-cacheable";

const sharedCacheOptions = {
	maxAge: 3600000, // 1 hour
	shouldCacheDecider: (response: any) => response !== null && response !== undefined
  };
  

@Injectable({ providedIn: 'root' })

export class RadarApiService {
	REVERSE_GEOCODE_CACHE_KEY = "REVERSE_GEOCODE_CACHE";
	IP_GEOCODE_CACHE_KEY = "IP_GEOCODE_CACHE";
	GEOLOCATION_ADDRESS_CACHE_KEY = "GEOLOCATION_ADDRESS_CACHE"
	AUTOCOMPLETE_PREFIX_CACHE = "AUTOCOMPLETE_CACHE_PREFIX_";

	private geolocationAddress: Subject<GeolocationAddress | any> = new Subject<GeolocationAddress | any>();
	geolocationAddress$: Observable<GeolocationAddress> = this.geolocationAddress.asObservable();

	constructor(private http: HttpClient, private storageService: StorageService) {
		this.init();
	}

	init() {
		let publishableKey = 'prj_live_pk_9f09e577b9625c9cfb6d3c87c3d6e8d1e991e79d';
		Radar.initialize(publishableKey);
	}

	/***
	 * Search Autocomplete
	 */
	@Cacheable({...sharedCacheOptions})
	searchAutocomplete(query: string) {
		const headerDict = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': 'prj_live_pk_9f09e577b9625c9cfb6d3c87c3d6e8d1e991e79d',
		}
		const requestOptions = {
			headers: new HttpHeaders(headerDict),
		};
		return this.http
			.get<MapLocationResponse>(RouteConstants.RADAR_SEARCH_AUTOCOMPLETE
				.replace("{query}", query), requestOptions)
			.pipe(map(response => {
				return response.addresses;
			}));
	}

	fetchGeolocationAddress() {
		return this.storageService.getData(this.GEOLOCATION_ADDRESS_CACHE_KEY, () => {
			return new Observable<GeolocationAddress | any>(observer => {
				const _self = this;
				Radar.trackOnce()
					.then((radarTrackResponse: any) => {
						const location = radarTrackResponse.location;
						const user = radarTrackResponse.user;
						const events = radarTrackResponse.events;

						const data = {
							accuracy: location.accuracy,
							altitude: location.altitude,
							altitudeAccuracy: location.altitudeAccuracy,
							heading: location.heading,
							latitude: location.latitude,
							longitude: location.longitude,
							speed: location.speed,
						};
						console.log("GPS [latitude, longitude]: " + data.latitude + ", " + data.longitude);
						const geolocationAddress = {
							latitude: data.latitude,
							longitude: data.longitude
						}
						_self.getReverseGeocode(data.latitude, data.longitude).subscribe((reverseGeocode: any) => {
							_self.geolocationAddress.next(reverseGeocode);
							observer.next(reverseGeocode)
							observer.complete();
						}, error => {
							console.error(error);
							_self.geolocationAddress.next(geolocationAddress);
							observer.next(geolocationAddress)
							observer.complete();
						})
					}).catch((err) => {
						console.error(err);
						_self.getIpGeocode().subscribe((geolocationAddress: any) => {
							_self.geolocationAddress.next(geolocationAddress);
							observer.next(geolocationAddress)
							observer.complete();
						})
					});
			});

		})
	}

	async reverseGeocodeLocation(latitude: number, longitude: number) {
		try {
			console.log(latitude);
			console.log(longitude);
			const result = await Radar.reverseGeocode({ latitude, longitude });
			console.log('result', result);
			const { addresses } = result;
			if (addresses && addresses.length > 0) {
				return addresses[0].formattedAddress;
			}
			return '';
		} catch (error) {
			console.log('error', error);
			return '';
		}
	}

	private getReverseGeocode(latitude: number, longitude: number) {
		return this.storageService.getData(this.REVERSE_GEOCODE_CACHE_KEY, () => {
			return new Observable<GeolocationAddress>(observer => {
				Radar.reverseGeocode({ latitude: latitude, longitude: longitude })
					.then((result: any) => {
						console.log("Reverse Geocode: ", result);
						const { addresses } = result;
						if (addresses && addresses.length) {
							observer.next(addresses[0]);
							observer.complete();
						} else {
							throw new Error("Unable to get reverse geocode with the coordinates: " + latitude + ", " + longitude);
						}
					})
					.catch((err: any) => {
						console.error(err);
					});
			});
		})
	}

	private getIpGeocode() {
		return this.storageService.getData(this.IP_GEOCODE_CACHE_KEY, () => {
			return new Observable<GeolocationAddress>(observer => {
				Radar.ipGeocode()
					.then((radarIpGeocodeResponse: any) => {
						console.log("IP Geocode: ", radarIpGeocodeResponse)
						const location = radarIpGeocodeResponse.address;
						observer.next({
							latitude: location.latitude,
							longitude: location.longitude,
							state: location.state,
							country: location.country,
							city: location.city,
							countryCode: location.countryCode,
							stateCode: location.stateCode,
							ip: radarIpGeocodeResponse.ip
						});
						observer.complete();
					}).catch((err: any) => {
						console.error('Error retrieving geolocation information:', err);
					});
			});
		});
	}
}
