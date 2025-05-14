import {UserAvatar} from "./user-avatar.model";
import {EventItem} from "./event-item.model";
import {NotificationTypeEnum} from "./type/notification-type-enum.models";
import {EventAvatar} from "./event-avatar.model";

export interface UserNotification {
  notificationId: number;
  message: string;
  createdAt: Date;
  isRead: boolean;
  userFrom: UserAvatar
  resourceId: string
  notificationType: string
  eventAvatar: EventAvatar;
}
