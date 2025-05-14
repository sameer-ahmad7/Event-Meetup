import {UserAvatar} from "./user-avatar.model";
import {EventItem} from "./event-item.model";

export interface EventFeedback {
  userFeedback: Array<UserAvatar>;
  feedbackId: string;
  
}
