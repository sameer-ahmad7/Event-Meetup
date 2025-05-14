import {Injectable} from '@angular/core';
import {WebClientService} from './web-client.service';
import {ChatLastRead, UpdateChatLastRead} from '../models/chat/chat-message.model';
import * as RouteConstants from './route.constant';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ChatApiService {
	private _chatsLastRead: ChatLastRead[] = [];
	private _chatsLastRead$ = new BehaviorSubject<ChatLastRead[]>([]);
	private _isLoading$ = new BehaviorSubject<boolean>(false);

	constructor(private webClient: WebClientService) {
	}

	/** Emits true while loading last-read data */
	public get isLoading$(): Observable<boolean> {
		return this._isLoading$.asObservable();
	}

	/** Emits the array of ChatLastRead when updated */
	public get chatsLastRead$(): Observable<ChatLastRead[]> {
		return this._chatsLastRead$.asObservable();
	}

	/** Fetches last-read timestamps for all chat rooms from the backend */
	public loadChatsLastRead(): void {
		console.log('[ChatApiService] loadChatsLastRead: starting');
		this._isLoading$.next(true);

		this.webClient
			.get<{ lastReadMessages: ChatLastRead[] }>(RouteConstants.LAST_READ_CHATS)
			.pipe(
				map(res => res.lastReadMessages),
				tap(msgs => console.log('[ChatApiService] Received last-read data:', msgs))
			)
			.subscribe({
				next: msgs => {
					this._chatsLastRead = msgs;
					this._chatsLastRead$.next(msgs);
					this._isLoading$.next(false);
					console.log('[ChatApiService] loadChatsLastRead completed');
				},
				error: err => {
					console.error('[ChatApiService] loadChatsLastRead error:', err);
					this._isLoading$.next(false);
				}
			});
	}

	/** Sends an update of the last-read timestamp for a room */
	public updateChatLastRead(payload: UpdateChatLastRead): void{
		console.log('[ChatApiService] updateChatLastRead:', payload);
		this.webClient.put<void>(RouteConstants.LAST_READ_CHATS, payload).subscribe(() => console.log("[ChatService] updateChatLastRead succeeded"));
	}
}
