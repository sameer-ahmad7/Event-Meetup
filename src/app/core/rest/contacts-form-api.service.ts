import {map, filter} from 'rxjs/operators';
import {HttpClient} from "@angular/common/http";
import {EventItem} from "../models/event-item.model";
import {Injectable} from "@angular/core";
import * as RouteConstants from './route.constant';
import {CONTACTS_FORM, USER_FEEDBACKS} from "./route.constant";
import {UserFeedback} from "../models/user-feedback.model";
import {WebClientService} from "./web-client.service";
import {FeedbackRequest} from "../dto/request/feedback-request";

@Injectable({providedIn: 'root'})

export class ContactsFormApiService {

  constructor(private webClient: WebClientService) {
  }

  submitContactsForm(contactsFormData: any) {
    return this.webClient.post<any>(RouteConstants.CONTACTS_FORM, contactsFormData);
  }
}
