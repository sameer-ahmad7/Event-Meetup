import {UserLanguage} from "./type/user-language.model";
import {Interest} from "./type/interest.model";
import {TypeModel} from "./type/type.model";
import {GeolocationAddress} from "./GeolocationAddress.model";

export interface User {
  geolocation?: GeolocationAddress;
  completionRate: number;
  userId: string;
  username?: string;
  password?: string;
  firstName: string;
  lastName: string;
  token?: string;
  email?: string;
  phoneNumber?: string;
  birthday: Date;
  nationality: string;
  gender: TypeModel;
  age: number;
  languages: Array<UserLanguage>;
  interests: Array<Interest>;
  imageProfileB64: string;
  fromCountry: string;
  livingCountry: string;
  userStatus: string;
  descProfile: string
  facebookNickname: string;
  tiktokUsername: string;
  instagramNickname: string;
  openProfileActions: Array<string>;
  xmppUser: string;
  xmppPsw: string;
}
