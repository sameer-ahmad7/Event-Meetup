import {GeolocationModel} from "./geolocation.model";
import {BusinessOpeningDay} from "./business-opening-days-model";

export interface BusinessClient {
  id: string;
  name: string;
  street: string;
  city: string;
  country: string;
  geolocation: GeolocationModel
  imageProfileB64: string;
  imageCity: string;
  mapsUrl: string;
  rate: number;
  selected: boolean;
  businessDays: Array<BusinessOpeningDay>;
  open: boolean;


}
