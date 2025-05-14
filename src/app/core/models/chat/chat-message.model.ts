import {UserAvatar} from "../user-avatar.model";


export interface ChatMessage {
  from: UserAvatar;
  text: string;
  dateTime: string;
}

export interface ChatLastRead{
eventId:string;
lastReadTimestamp:string;
}

export interface UpdateChatLastRead{
	eventId:string;
	lastRead:string;
}
