import {UserAvatar} from "../../models/user-avatar.model";

export interface FeedbackRequest {
  eventId: string;
  userFeedbackId: string;
  rate: number;
  content: string;
}
