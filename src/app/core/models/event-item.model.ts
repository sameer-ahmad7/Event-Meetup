import {UserAvatar} from "./user-avatar.model";
import {BusinessClient} from "./business-client.model";
import {UserEventAvatar} from "./user-event-avatar.model";
import {PartecipantSizeGroup} from "./partecipant-size-group";
import {GeolocationModel} from "./geolocation.model";
import {TypeModel} from "./type/type.model";
import {Language} from "./type/language.model";

export interface EventItem extends GeolocationModel {
  eventId: string;
  description: string;
  creationDate: Date;
  name: string;
  participantSizeGroup: PartecipantSizeGroup;
  minAge: number;
  maxAge: number;
  avgCostMax: number;
  gender: TypeModel;
  startingDate: Date;
  endingDate: Date;
  status: TypeModel;
  businessClient: BusinessClient;
  participants: Array<UserEventAvatar>;
  owner: UserAvatar;
  isOffered: boolean;
  currentUserEventStatus: string

  img: string;
  language: Language;
  label: string;

  // CSS
  statusClass: string;
  deadline: string;
  bg_color: string;

  eventChatPassword: string;
}
