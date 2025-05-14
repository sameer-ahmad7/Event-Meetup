import { environment } from "../../../environments/environment";


const basePath = "/api"
const BASE_HOST = `${environment.backendHost}${basePath}`;

// Event
export const EVENT_ALL = BASE_HOST + "/events"
export const EVENT_SEARCH = EVENT_ALL + "/search";
export let EVENT_HISTORY_SEARCH = EVENT_ALL + "/history/search";
export const EVENT_BY_ID = EVENT_ALL + "/{eventId}"
export const SAVE_EVENT = EVENT_ALL;

// Chat
export let EVENT_CHATS = EVENT_ALL + "/chats";
export let LAST_READ_CHATS=BASE_HOST+"/chat/last-read"

// Event Subscription
export const EVENT_SUBSCRIPTION = EVENT_BY_ID + "/subscription";
export let EVENT_SUBSCRIPTION_QUEUE = EVENT_SUBSCRIPTION + '/queue';

// User
export const USER_ALL = BASE_HOST + "/users";
export const USER_BY_ID = USER_ALL + "/{userId}";
export const USER_SELF = USER_ALL + "/self";
export let USER_SELF_IMAGE = USER_SELF + '/image-profile';
export let USER_SELF_CONFIG = USER_SELF + '/config';
// User Feedbacks
export const USER_FEEDBACKS = USER_BY_ID + "/feedbacks"
// User Event Feedbacks
export const USER_EVENT_FEEDBACKS = USER_SELF + "/events/{eventId}" + "/feedbacks"
// Delete Account
export let USER_SELF_DELETE_ACCOUNT = USER_SELF + '/delete';

// Feedback
export const FEEDBACKS = BASE_HOST + "/feedback"

// User  Notifications
export let USER_NOTIFICATIONS = USER_SELF + "/notifications";

//Notifications SSE
export let NOTIFICATIONS_SUBSCRIBE = USER_SELF + "/notifications/subscribe"

// Feedback
export const CONTACTS_FORM = BASE_HOST + "/contacts-form"

// Business Client
export const BUSINESS_CLIENTS_ALL = BASE_HOST + "/business-clients"
export let BUSINESS_CLIENTS_SEARCH = BUSINESS_CLIENTS_ALL + "/search";

// Types
const BASE_TYPE = BASE_HOST + "/types"
export let GENDER_ALL = BASE_TYPE + "/genders";
export let LANGUAGE_ALL = BASE_TYPE + "/languages";
export let LANGUAGE_LEVEL_ALL = BASE_TYPE + "/levels";
export let COUNTRY_ALL = BASE_TYPE + "/countries";
export let EVENT_TYPES_ALL = BASE_TYPE + "/events-type";
export let INTERESTS_ALL = BASE_TYPE + "/interests";
export let PARTICIPANT_SIZE = BASE_TYPE + "/participant-size";
export const EVENT_STATUSES = BASE_TYPE + '/event/statuses';
export const KICK_REASONS=BASE_TYPE+'/kick-reasons';
export const REPORT_REASONS=BASE_TYPE+'/report-reasons';

// RADAR
export const RADAR_SEARCH_AUTOCOMPLETE = "https://api.radar.io/v1/search/autocomplete?query={query}";
