import { map } from "rxjs/operators";

import { Injectable, NgZone } from "@angular/core";
import * as RouteConstants from './route.constant';
import { WebClientService } from "./web-client.service";
import { UserNotification } from "../models/user-notification.models";
import { UserAuthService } from "src/app/auth/user-auth.service";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })

export class UserNotificationApiService {

	private controller: AbortController | null = null; // Used to manually close the connection
	private reconnectDelay = 1000; // Initial delay (1 sec)
	private maxReconnectDelay = 30000; // Max delay (30 sec)
	private isReconnecting = false; // Prevent duplicate reconnects
	private retryCount = 0;
private maxRetries = 10;

	constructor(private webClient: WebClientService, private zone: NgZone) {
	}

	/***
	 * Get User Notifications
	 */
	getUserNotifications() {
		// console.log("DEBUG# Downloading notifications");
		return this.webClient.get<{ notifications: UserNotification[] }>(RouteConstants.USER_NOTIFICATIONS)
			.pipe(map(data => data.notifications));
	}

	subscribeToNotifications(token: string) {
		return new Observable(observer => {
			this.connect(observer, token);

			return () => {
				console.log('here');
				this.closeConnection();
			};
		});

	}

	private async connect(observer: any, token: string) {
		if (this.controller) {
			console.warn('SSE already connected. Skipping duplicate connection.');
			return; // Prevent duplicate connections		
		}

		this.controller = new AbortController();
		const signal = this.controller.signal;

		try {
			const response = await fetch(RouteConstants.NOTIFICATIONS_SUBSCRIBE, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Accept': 'text/event-stream'
				},
				signal
			});

			if (!response.ok) {
				throw new Error(`HTTP Error: ${response.status}`);
			}

			this.retryCount = 0; // ✅ Reset retry count on successful connection


			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('Failed to read SSE stream');
			}

			const processStream = async () => {
				while (true) {
					const { done, value } = await reader.read();

					if (done) {
						console.warn('SSE Stream Closed');
						observer.complete();
						//   this.reconnect(observer,token);
						return;
					}

					const decodedData = decoder.decode(value);
					console.log('SSE Data:', decodedData);

					decodedData.trim().split('\n').forEach(line => {
						if (line.startsWith(':heartbeat')) {
							console.log('Ignoring SSE Heartbeat');
							return;
						}

						if (line.startsWith('data:')) {
							try {
								// Extract the JSON string after 'data:'
								const jsonData = JSON.parse(line.replace(/^data:/, '').trim());
								console.log('json', jsonData);
								this.zone.run(() => observer.next(jsonData)); // Emit only JSON data
							} catch (error) {
								console.error('Failed to parse SSE JSON:', error);
							}
						}
					});
				}
			};

			processStream();
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.warn('SSE Connection was manually aborted');
			} else {
				console.error('SSE Connection Error:', error);
				observer.error(error);
				this.reconnect(observer, token);
			}
		}
	}

	private reconnect(observer: any, token: string) {
		if (this.isReconnecting || this.retryCount >= this.maxRetries) return;
		this.isReconnecting = true;
		this.retryCount++;

		setTimeout(() => {
			console.log('Reconnecting to SSE...');
			this.isReconnecting = false;
			this.closeConnection(); // Ensure old connection is fully closed before retrying
			this.connect(observer, token);
			this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay); // Exponential backoff
		}, this.reconnectDelay);;
	}

	private closeConnection() {
		if (this.controller) {
			console.log('Closing SSE connection');
			this.controller.abort(); // Manually close the fetch request
			this.controller = null;
			this.reconnectDelay = 1000; // Reset delay for next reconnect attempt
		}
	}

	/***
	 * Set Notifications read
	 */
	setNotificationsRead() {
		return this.webClient.put<{}>(RouteConstants.USER_NOTIFICATIONS, {});
	}
}
