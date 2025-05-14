import { map } from 'rxjs/operators';
import { EventItem } from "../models/event-item.model";
import { Injectable } from "@angular/core";
import * as RouteConstants from './route.constant';
import { WebClientService } from "./web-client.service";
import { EventSearchRequest } from '../dto/request/event-search-request.model';

@Injectable({ providedIn: 'root' })

export class EventApiService {

	constructor(private webClient: WebClientService) {
	}

	/***
	 * Get All Event
	 */
	getAllEvents() {
		return this.webClient.get<{ events: EventItem[] }>(RouteConstants.EVENT_ALL)
			.pipe(map(data => data.events));
	}

	/***
	 * Search Events
	 */
	searchEvents(filter: EventSearchRequest) {
		return this.webClient.post<{ events: EventItem[] }>(RouteConstants.EVENT_SEARCH, filter)
			.pipe(map(data => data.events));
	}

	getEventsForChat() {
		return this.webClient.get<{ events: EventItem[] }>(RouteConstants.EVENT_CHATS)
			.pipe(map(data => data.events));
	}

	getEventsForChatBzSearchEvents() {
		const filter = new EventSearchRequest();
		filter.statusesEvent = ['OPEN', 'FULL', 'IN_PROGRESS'];
		return this.webClient.post<{ events: EventItem[] }>(RouteConstants.EVENT_HISTORY_SEARCH, filter)
			.pipe(map(data =>
				data.events.filter(event => ['OWNER', 'ACCEPTED']
					.includes(event.currentUserEventStatus))));
	}
	/***
	 * Search Events History
	 */
	searchEventsHistory(filter: any) {
		return this.webClient.post<{ events: EventItem[] }>(RouteConstants.EVENT_HISTORY_SEARCH, filter)
			.pipe(map(data => data.events));
	}

	/***
	 * Get Event By ID
	 */
	getEvent(eventId: string) {
		return this.webClient.get<EventItem>(RouteConstants.EVENT_BY_ID
			.replace("{eventId}", eventId));
	}

	/***
	 * Delete Event By ID
	 */
	deleteEvent(eventId: string) {
		return this.webClient.delete<EventItem>(RouteConstants.EVENT_BY_ID
			.replace("{eventId}", eventId));
	}

	/***
	 * Create Event
	 */
	save(eventDto: any) {
		return this.webClient.post(RouteConstants.SAVE_EVENT, eventDto);
	}
}
