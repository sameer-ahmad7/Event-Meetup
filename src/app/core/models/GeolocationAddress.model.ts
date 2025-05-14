import {GeolocationModel} from "./geolocation.model";

export interface GeolocationAddress extends GeolocationModel {
  ip: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  stateCode: string;
}
