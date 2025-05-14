import {map, filter} from 'rxjs/operators';
import {HttpClient} from "@angular/common/http";
import {EventItem} from "../models/event-item.model";
import {Injectable} from "@angular/core";
import * as RouteConstants from './route.constant';
import {USER_FEEDBACKS} from "./route.constant";
import {UserFeedback} from "../models/user-feedback.model";
import {WebClientService} from "./web-client.service";
import {FeedbackRequest} from "../dto/request/feedback-request";

@Injectable({providedIn: 'root'})

export class UserFeedbackApiService {

  constructor(private webClient: WebClientService) {
  }

  /***
   * Get User Feedbacks
   */
  getUserFeedbacks(userId: string) {
    return this.webClient.get<{ feedbacks: UserFeedback[] }>(
      RouteConstants.USER_FEEDBACKS.replace("{userId}", userId))
      .pipe(map(data => data.feedbacks));
  }
  getEventFeedbacks(eventId: string) {
    return this.webClient.get<{ feedbacks: UserFeedback[] }>(
      RouteConstants.USER_EVENT_FEEDBACKS.replace("{eventId}", eventId))
      .pipe(map(data => data.feedbacks));
  }

  createFeedback(feedbackRequest: FeedbackRequest) {
    return this.webClient.post<any>(RouteConstants.FEEDBACKS, feedbackRequest);
  }
}
