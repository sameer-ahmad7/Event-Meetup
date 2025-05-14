import {BusinessClient} from "./business-client.model";

export interface EventAvatar {
  eventId: string;
  name: string;
  language: string;
  businessClient: BusinessClient;

}
