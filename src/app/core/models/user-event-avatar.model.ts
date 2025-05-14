import {UserAvatar} from "./user-avatar.model";
import {UserEventStatusEnum} from "./type/user-event-status-enum.models";

export interface UserEventAvatar {
    lastChange: Date;
    userAvatar: UserAvatar;
    userEventStatus: string; // UserEventStatusEnum
}
