import { map } from 'rxjs/operators';
import { Injectable } from "@angular/core";
import * as RouteConstants from './route.constant';
import { WebClientService } from "./web-client.service";
import { Country } from "../models/type/country.model";
import { Language } from "../models/type/language.model";
import { LanguageLevel } from "../models/type/language-level.model";
import { Interest } from "../models/type/interest.model";
import { ParticipantSize } from "../models/participant-size";
import { TypeModel } from "../models/type/type.model";
import { Cacheable } from 'ts-cacheable';

const sharedCacheOptions = {
  maxAge: 3600000, // 1 hour
  shouldCacheDecider: (response: any) => response !== null && response !== undefined
};

@Injectable({ providedIn: 'root' })
export class TypeApiService {

	constructor(private webClient: WebClientService) {}

	@Cacheable(sharedCacheOptions)
	getGenders() {
		return this.webClient.get<{ genders: Array<TypeModel> }>(RouteConstants.GENDER_ALL)
			.pipe(map(data => data.genders));
	}

	@Cacheable(sharedCacheOptions)
	getLanguages() {
		return this.webClient.get<{ languages: Array<Language> }>(RouteConstants.LANGUAGE_ALL)
			.pipe(map(data => data.languages));
	}

	@Cacheable(sharedCacheOptions)
	getLanguageLevels() {
		return this.webClient.get<{ levels: Array<LanguageLevel> }>(RouteConstants.LANGUAGE_LEVEL_ALL)
			.pipe(map(data => data.levels));
	}

	@Cacheable(sharedCacheOptions)
	getCountries() {
		return this.webClient.get<{ countries: Array<Country> }>(RouteConstants.COUNTRY_ALL)
			.pipe(map(data => data.countries));
	}

	@Cacheable(sharedCacheOptions)
	getInterests() {
		return this.webClient.get<{ interests: Array<Interest> }>(RouteConstants.INTERESTS_ALL)
			.pipe(map(data => data.interests));
	}

	@Cacheable(sharedCacheOptions)
	getEventTypes() {
		return this.webClient.get<{ eventsType: Array<TypeModel> }>(RouteConstants.EVENT_TYPES_ALL)
			.pipe(map(data => data.eventsType));
	}

	@Cacheable(sharedCacheOptions)
	getParticipantSize() {
		return this.webClient.get<{ participantSizeGroup: Array<ParticipantSize> }>(RouteConstants.PARTICIPANT_SIZE)
			.pipe(map(data => data.participantSizeGroup));
	}

	@Cacheable(sharedCacheOptions)
	getEventStatuses() {
		return this.webClient.get<{ statusesEvent: Array<TypeModel> }>(RouteConstants.EVENT_STATUSES)
			.pipe(map(data => data.statusesEvent));
	}
}
