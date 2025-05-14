import {Injectable} from '@angular/core';
import {XmppService} from "./xmpp.service";
import {SharedService} from "./shared.service";
import {ChatMessage, UpdateChatLastRead} from "../models/chat/chat-message.model";
import {EventItem} from "../models/event-item.model";
import {User} from "../models/user.models";
import {BehaviorSubject, combineLatest, filter, firstValueFrom, lastValueFrom, Subject, take} from 'rxjs';
import {ChatApiService} from "../rest/chat-api.service";
import {EventApiService} from "../rest/event-api.service";
import {DateTime} from "luxon";
import {UserAuthService} from "../../auth/user-auth.service";

declare var Strophe: any;
declare var $iq: any;
declare var $pres: any;

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    // Signal for UI when a new msg is received
    private readonly _messageReceived$ = new Subject<string>();
    public messageReceived$ = this._messageReceived$.asObservable();

    private readonly _initChat$: any = new Subject<string>();
    public initChat$ = this._initChat$.asObservable();


    // Map of room JIDs to ChatRoom instances
    private readonly chatRooms = new Map<string, ChatRoom>();
    // Tracks whether a connection attempt is in progress
    private isConnecting = false;
    // Signal for UI when connection and room joins are complete
    private readonly connectionStatus$ = new BehaviorSubject<string>("");
    public status$ = this.connectionStatus$.asObservable();
    // Map unread messages count per room
    private readonly _chatCountMap$ = new BehaviorSubject<{ [key: string]: number }>({});
    public chatCountMap$ = this._chatCountMap$.asObservable();
    // Authenticated user is using the active chat room
    selfUser!: User;
    activeChatRoom?: ChatRoom;
    // Auxiliar
    joiningChat: boolean = true;

    constructor(private xmpp: XmppService,
                public sharedService: SharedService,
                private eventApiService: EventApiService,
                private chatApi: ChatApiService,
                private userAuth: UserAuthService) {
        this.selfUser = this.userAuth.currentUser();
    }


    /**
     * Connects to XMPP server and joins all MUC rooms based on last-read timestamps
     */
    public connectToAllRooms(): void {
        console.log('[ChatService] connectToAllRooms called');

        // Prevent duplicate connections if already in progress or already connected
        if (this.isConnecting || this.xmpp.isConnected()) {
            console.log('[ChatService] Already connecting or connected; aborting');
            return;
        }
        this.isConnecting = true;

        // Trigger loading of last-read timestamps
        this.chatApi.loadChatsLastRead();

        // Wait until loading finishes AND we have at least one room to join
        const _self = this;
        combineLatest([
            this.chatApi.isLoading$,
            this.chatApi.chatsLastRead$
        ]).pipe(
            filter(([loading, lastReads]) =>
                // only continue once loading is done
                !loading &&
                // and we actually have rooms to join
                Array.isArray(lastReads) &&
                lastReads.length > 0
            ),
            take(1)  // handle exactly one emission then complete
        ).subscribe({
            next: async ([, lastReads]) => {
                console.log(`[ChatService] Last-read data loaded: ${lastReads.length} rooms`);

                const username = `${_self.selfUser.xmppUser}${XmppService.ROOM_DOMAIN}`;
                const password = _self.selfUser.xmppPsw;

                try {
                    // Connect to the XMPP server
                    await _self.xmpp.connect(username, password);
                    console.log('[ChatService] XMPP connected');

                    // Join each MUC room based on the last-read timestamps
                    for (const lr of lastReads) {
                        const event = await firstValueFrom(
                            this.eventApiService.getEvent(lr.eventId)
                        );
                        await this.joinRoom(
                            event.eventId,
                            event.eventChatPassword,
                            lr.lastReadTimestamp
                        );
                    }
                    // Wait for the roster of last room
                    setTimeout(() => {
                        console.log('[ChatService] All rooms joined');
                        this.connectionStatus$.next("ALL");
                    }, 100)
                } catch (error) {
                    console.error('[ChatService] connectToAllRooms error', error);
                } finally {
                    // Always reset the flag so we can reconnect again later
                    this.isConnecting = false;
                }
            },
            error: (error) => {
                console.error('[ChatService] loadChatsLastRead failed', error);
                // Reset the flag even on failure
                this.isConnecting = false;
            }
        });
    }

    /**
     * ============
     * JOIN MUC ROOM
     * ============
     */
    private async joinRoom(eventId: string, password: string, lastReadTimestamp: string) {
        const roomJid = this.getRoomJid(eventId);
        if (this.chatRooms.has(roomJid)) {
            console.log(`[ChatService] Already joined room ${roomJid}`);
            return;
        }
        const chatEvent = await lastValueFrom(this.eventApiService.getEvent(eventId));
        const room = new ChatRoom(roomJid, chatEvent, lastReadTimestamp);
        this.chatRooms.set(roomJid, room);
        this.connectionStatus$.next(eventId);
        const user = this.userAuth.currentUser();
        this.xmpp.joinMuc(
            roomJid,
            user.xmppUser,
            password,
            (msg: any) => this.handleMessage(msg, room),
            (pres: any) => this.handlePresence(pres, room),
            (roster: any) => this.handleRoster(roster, room)
        );
    }

    /**
     * ============
     * MUC HANDLERS
     * ============
     */
    private handleMessage(stanza: any, room: ChatRoom): boolean {
        const text = this.xmpp.getBody(stanza);
        const sender = this.xmpp.getResource(stanza);
        if (!sender || !text) {
            return true;
        }
        const timestamp = this.xmpp.getTimestamp(stanza);
        // console.log(`[ChatService] Message received from ${sender} at ${timestamp}: ${text}`);
        const avatar = this.getUserAvatar(sender, room.currentEventChat);
        const message = <ChatMessage>{
            from: avatar,
            text: text,
            dateTime: timestamp
        }
        room.messages.push(message);
        if (room.messages.length === 1) {
            console.log(`[ChatService] Successfully received a message received in the room ${room.roomJid}`);
        }
        this._messageReceived$.next(room.currentEventChat.eventId);
        room.lastMessageTime = this.sharedService.getLastChangeTime(new Date(message.dateTime));

        if (!this.activeChatRoom) {
            // console.log("Message received: ", message)
            if (room?.lastReadTimestamp && room?.lastReadTimestamp < timestamp && this.selfUser.userId !== avatar.userId) {
                console.log(`[ChatService] Message received offline`);
                room.userLastMessages.set(avatar.userId, text);
                room.unreadCount++;
                this._chatCountMap$.next({[room.currentEventChat.eventId]: room.unreadCount});
            }
        }

        return true;
    }

    handlePresence(stanza: any, room: ChatRoom) {
        // console.log('[ChatService] Presence stanza received from room: ' + room.roomJid);
        let username = this.xmpp.getResource(stanza);
        let type = this.xmpp.getAttribute(stanza, 'type');
        if (username.indexOf('/') !== -1) {
            username = username.substring(
                username.indexOf('/') + 1
            );
        }
        // Check the presence type
        if (type === 'unavailable') {
            // User left the room
            console.log('[ChatService] User left the room:', username);
            room.onlineUsers.delete(username);
        } else {
            // User joined or updated presence
            console.log('[ChatService] User joined the room:', username);
            const user = room?.currentEventChat?.participants
                .filter(participant => participant.userAvatar.xmppUser === username)[0];
            if (user) {
                room.onlineUsers.set(username, this.sharedService.getParticipantName(user.userAvatar));
            } else {
                console.log('[ChatService] WARN: User not found:', username);
            }
        }
        return true;
    }

    private handleRoster(stanza: any, room: ChatRoom): boolean {
        console.log('[ChatService] Roster stanza received from room: ' + room.roomJid);
        this._initChat$.next(room.currentEventChat.eventId);
        return true;
    }

    /**
     * ============
     * END MUC HANDLERS
     * ============
     */
    public sendGroupMessage(eventId: string, text: string): void {
        const roomJid = this.getRoomJid(eventId);
        console.log(`[ChatService] sendMessage to ${roomJid}: ${text}`);
        this.xmpp.sendGroupMessage(roomJid, text);
    }

    public resetUnreadCount(eventId: string) {
        const chatRoom = this.getChatRoom(eventId);
        if (chatRoom) {
            chatRoom.unreadCount = 0;
            this._chatCountMap$.next({[eventId]: chatRoom.unreadCount});
        }
    }

    getUserAvatar(from: any, chatEvent: EventItem) {
        if (chatEvent.owner.xmppUser === from) {
            return chatEvent.owner;
        }
        const userAvatar = chatEvent.participants.filter(participant =>
            participant.userAvatar.xmppUser === from)
            .map(participant => participant.userAvatar);
        if (userAvatar?.length) {
            return userAvatar[0];
        }
        throw new Error("user not found");
    }

    updateChatLastRead(eventId: string) {
        const lastReadTimestamp = DateTime.now().toUTC().toISO({suppressMilliseconds: false});
        const updateChatLastRead: UpdateChatLastRead = {
            lastRead: lastReadTimestamp,
            eventId: eventId
        }
        const chatRoom = this.getChatRoom(updateChatLastRead.eventId);
        if (chatRoom) {
            chatRoom.lastReadTimestamp = new Date(updateChatLastRead.lastRead);
        }
        this.chatApi.updateChatLastRead(updateChatLastRead);
    }

    public disconnectAllRooms(): void {
        console.log('[ChatService] disconnectAllRooms called');

        // 1) Leave each room safely
        this.chatRooms.forEach(room => {
            const roomJid = this.getRoomJid(room.currentEventChat.eventId);
            const xmppUser = this.userAuth.currentUser().xmppUser;
            if (this.xmpp.isConnected()) {
                try {
                    console.log(`[ChatService] Leaving room ${roomJid}`);
                    this.xmpp.leaveMuc(roomJid, xmppUser);
                } catch (e) {
                    console.warn('[ChatService] leaveMuc failed, skipping', e);
                }
            }
        });

        // 2) Clean local state
        this.chatRooms.clear();
        // 3) Clear active chat room
        this.activeChatRoom = undefined;

        // 4) Disconnect XMPP if still connected
        if (this.xmpp.isConnected()) {
            this.xmpp.disconnect();
            console.log('[ChatService] XMPP disconnected');
        }

        // 5) Reset status flags
        this.isConnecting = false;
        this.connectionStatus$.next('');
    }


    /**
     * ===========
     * UI FUNCTION
     * ===========
     */


    /**
     * ===========================
     * GETTERS / SETTERS
     * ===========================
     */
    public setActiveChatRoom(eventId: string) {
        this.activeChatRoom = this.getChatRoom(eventId);
    }

    public getMessages(eventId: string): ChatMessage[] {
        return this.getChatRoom(eventId)?.messages || [];
    }

    public getUserLastMessage(userId: string) {
        return this.activeChatRoom!.userLastMessages.get(userId);
    }

    public getRoomJid(eventId: string) {
        return `${eventId}${XmppService.ROOM_DOMAIN}`;
    }

    public getChatRoom(eventId: string) {
        return this.chatRooms.get(this.getRoomJid(eventId));
    }

    public isOnline(user: any) {
        return this.activeChatRoom?.onlineUsers.get(user.xmppUser);
    }

    getLastMessageTime() {
        return this.activeChatRoom!.lastMessageTime;
    }

    /**
     * ===========================
     * END GETTERS / SETTERS
     * ===========================
     */

    /**
     * ===========================
     * Only Desktop
     * ===========================
     */
    selfMessage(message: ChatMessage) {
        return this.selfUser.xmppUser === message.from.xmppUser
    }

    showAvatarMessage(index: number) {
        const message = this.activeChatRoom!.messages[index];
        if (index === 0) {
            return !this.selfMessage(message)
        }
        const prevMessage = this.activeChatRoom!.messages[index - 1];
        return message.from.xmppUser !== prevMessage.from.xmppUser
            && !this.selfMessage(message);
    }
}


class ChatRoom {
    roomJid: string;
    onlineUsers: Map<string, string> = new Map<string, string>();
    userLastMessages = new Map<string, string>();
    messages: Array<ChatMessage> = [];
    lastMessageTime: string = '';
    currentEventChat!: EventItem;
    lastReadTimestamp!: string | Date;
    unreadCount = 0;
    connected = false;

    constructor(roomJid: string, currentEventChat: EventItem, lastReadTimestamp: string) {
        this.roomJid = roomJid;
        this.currentEventChat = currentEventChat;
        this.lastReadTimestamp = lastReadTimestamp;
    }
}

