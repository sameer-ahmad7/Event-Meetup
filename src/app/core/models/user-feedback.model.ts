import {UserAvatar} from "./user-avatar.model";
import {EventItem} from "./event-item.model";

export interface UserFeedback {
  feedbackId: string;
  content: string;
  receivedFrom: UserAvatar;
  event: EventItem;
  dateFeedback: Date;
  rate: number;
  userFeedback: UserAvatar;
}
