import {Injectable} from "@angular/core";
import * as RouteConstants from './route.constant';
import {UserSubscription} from "../dto/request/user-subscription";
import {WebClientService} from "./web-client.service";

@Injectable({providedIn: 'root'})

export class EventSubscriptionApiService {

  constructor(private webClient: WebClientService) {
  }

  /***
   * Subscribe an event
   */
  createSubscription(eventId: string) {
    return this.webClient.post<any>(
      RouteConstants.EVENT_SUBSCRIPTION.replace("{eventId}", eventId), null);
  }

  /***
   * Create subscription queue
   */
  createSubscriptionQueue(eventId: string) {
    return this.webClient.post<any>(
      RouteConstants.EVENT_SUBSCRIPTION_QUEUE.replace("{eventId}", eventId), null);
  }

  /***
   * Approve an event subscription
   */
  approveSubscription(eventId: string, userSubscription: UserSubscription) {
    return this.webClient.put<{ message: string }>(
      RouteConstants.EVENT_SUBSCRIPTION.replace("{eventId}", eventId),
      userSubscription
    );
  }

  /***
   * Unsubscribe an event
   */
  deleteSubscription(eventId: string) {
    return this.webClient.delete<{}>(
      RouteConstants.EVENT_SUBSCRIPTION.replace("{eventId}", eventId))
  }
}
