import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, take } from 'rxjs';
import { RadarApiService } from '../core/rest/radar-api.service';
import { AddressInfo } from '../core/models/geolocation.model';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

private _isLoading$=new BehaviorSubject<boolean>(true);
private _address!:AddressInfo;
private _address$=new Subject<AddressInfo>();

  constructor(private radarMapApiService:RadarApiService) { }


 async getLocation(){
	if(Capacitor.isNativePlatform()){
		const cachedLocation=this.getCachedLocation();
		if(cachedLocation?.address && cachedLocation.lat && cachedLocation.lng){
			this._address=cachedLocation;
			console.log(this._address);
			this._isLoading$.next(false);
			this.fetchFromGeolocation(true);
		}else{
			this.removeLocation();
			this.fetchFromGeolocation();
		}

	}else{
		const cachedLocation=this.getCachedLocation();
		if(cachedLocation?.address && cachedLocation.lat && cachedLocation.lng){
			this._address=cachedLocation;
			console.log(this._address);
			this._isLoading$.next(false);
			this.fetchLocationFromRadar(true);
		}else{
			this.removeLocation();
			this.fetchLocationFromRadar();
		}
	}
  }

 async fetchFromGeolocation(isBackground:boolean=false){
	if(!isBackground){
		try {
			const res=await Geolocation.getCurrentPosition({enableHighAccuracy:false});
			if(res.coords){
				const lat=res.coords.latitude;
				const lng=res.coords.longitude;
			const address=await	this.radarMapApiService.reverseGeocodeLocation(lat,lng);
			if(address){
				this._address={
					lat,
					lng,
					address
				}
				this.storeLocation(this._address);
				this._isLoading$.next(false);
			}
			}else{
				this.fetchLocationFromRadar();
			}
			} catch (error) {
				this.fetchLocationFromRadar();
				
			}
		
	}else{
		Geolocation.getCurrentPosition({enableHighAccuracy:true}).then( async res=>{
			if(res.coords){
				const lat=res.coords.latitude;
				const lng=res.coords.longitude;
			const address=await	this.radarMapApiService.reverseGeocodeLocation(lat,lng);
			if(address){
				this._address={
					lat,
					lng,
					address
				}
				this.storeLocation(this._address);
				this._address$.next(this._address);
			}
		}else{
			this.fetchLocationFromRadar(true);
		}
		}).catch(err=>this.fetchLocationFromRadar(true));
	}
  }

  removeLocation(){
	localStorage.removeItem('location');
  }

  storeLocation(address:AddressInfo){
	localStorage.setItem('location',JSON.stringify(address));
  }

  getCachedLocation():AddressInfo|null{
	const location=localStorage.getItem('location');
	if(location){
		return JSON.parse(location);
	}
	return null;
  }

  fetchLocationFromRadar(isBackground:boolean=false){
	this.radarMapApiService.fetchGeolocationAddress().
	pipe(take(1))
	.subscribe(geolocationAddress => {
		console.log('radar', geolocationAddress);
		let address = geolocationAddress.formattedAddress;
		if (!address) {
			address = `${geolocationAddress.city}, ${geolocationAddress.country}`
		}
		this._address={lat:geolocationAddress.latitude,lng:geolocationAddress.longitude,address};
		this.storeLocation(this._address);
		if(isBackground){
			this._address$.next(this._address);
		}else{
			this._isLoading$.next(false);
		}
	})


  }

  get isLoading$(){
	return this._isLoading$.asObservable();
  }

  get address(){
	return this._address;
  }

  get address$(){
	return this._address$.asObservable();
  }


}
