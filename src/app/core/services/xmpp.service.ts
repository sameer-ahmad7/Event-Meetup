import { Injectable } from '@angular/core';

declare var Strophe: any;
declare var $iq: any;
declare var $pres: any;

@Injectable({
	providedIn: 'root',
})
export class XmppService {
	public static readonly ROOM_DOMAIN = '@conference.""app.com';
	public static readonly DOMAIN = 'openfire.""app.com';
	public static readonly SERVER_URL = 'wss://' + XmppService.DOMAIN + '/ws/';
	connection: any;

	/**
	 * Establish a new XMPP connection (WebSocket or BOSH) and send initial presence.
	 * Resolves only once we reach CONNECTED; rejects on any failure.
	 */
	public async connect(username: string, password: string): Promise<void> {
		console.log('[XmppService] Connect called');

		// If already connected, skip
		if (this.connection && this.connection.connected) {
			console.log('[XmppService] Already connected; skipping new connect');
			return;
		}

		return new Promise((resolve, reject) => {
			// Create a fresh connection instance
			this.connection = new Strophe.Connection(XmppService.SERVER_URL);
			console.log('[XmppService] Connecting to', this.connection.service);

			// Optional: enable raw logging to debug traffic
			// this.connection.rawInput  = (data: any) => console.debug('[XMPP RECV]', data);
			// this.connection.rawOutput = (data: any) => console.debug('[XMPP SEND]', data);

			// Kick off the connection process
			this.connection.connect(username, password, (status: any) => {
				switch (status) {
					case Strophe.Status.CONNECTING:
						console.log('[XmppService] Strophe status: CONNECTING');
						break;
					case Strophe.Status.AUTHENTICATING:
						console.log('[XmppService] Strophe status: AUTHENTICATING');
						break;
					case Strophe.Status.CONNECTED:
						console.log('[XmppService] Connected to XMPP');
						// Announce presence to join the default roster
						try {
							this.connection.send($pres().tree());
						} catch (sendErr) {
							console.warn('[XmppService] Failed to send initial presence', sendErr);
						}
						resolve();
						break;
					case Strophe.Status.DISCONNECTING:
						console.log('[XmppService] Strophe status: DISCONNECTING');
						break;
					case Strophe.Status.DISCONNECTED:
						console.warn('[XmppService] Disconnected from XMPP');
						reject(new Error('XMPP disconnected'));
						break;
					case Strophe.Status.CONNFAIL:
					case Strophe.Status.AUTHFAIL:
						console.error('[XmppService] XMPP connection/authentication failed');
						reject(new Error('XMPP connection failed'));
						break;
					default:
						console.warn(`[XmppService] Unhandled Strophe status: ${status}`);
				}
			});
		});
	}

	public joinMuc(
		roomJid: string,
		nickname: string,
		password: string,
		onMessage: (msg: any) => boolean,
		onPresence: (pres: any) => boolean,
		onRoster: (roster: any) => boolean
	) {
		// guard against no/closed connection
		if (!this.connection?.connected) {
			console.warn(`[XmppService] joinMuc skipped: no live connection for ${roomJid}`);
			return;
		}

		console.log(`[XmppService] joinMuc called for ${roomJid} as ${nickname}`);
		try {
			// actually join the room
			this.connection.muc.join(
				roomJid,
				nickname,
				onMessage,
				onPresence,
				onRoster,
				password
			);

			// register low‐level handlers too, in case the plugin join() didn’t
			this.connection.addHandler(onMessage, null, 'message', null, null, roomJid);
			this.connection.addHandler(onPresence, null, 'presence', null, null, roomJid);
			this.connection.addHandler(
				onRoster,
				null,
				'iq',
				'set',
				'http://jabber.org/protocol/muc#admin',
				roomJid
			);
		} catch (err) {
			console.error('[XmppService] joinMuc error', err);
		}
	}

	public sendGroupMessage(roomJid: string, text: string): void {
		console.log(`[XmppService] sendGroupMessage to ${roomJid}: ${text}`);
		const msg = Strophe.xmlElement('message', { to: roomJid, type: 'groupchat' });
		msg.appendChild(Strophe.xmlElement('body', {}, text));
		this.connection.send(msg);
	}

	/**
	 * Leave a MUC room by sending an unavailable presence and then calling leave().
	 */
	public leaveMuc(roomJid: string, nick: string): void {
		// skip if no open connection
		if (!this.connection || !this.connection.connected) {
			console.debug(`[XmppService] leaveMuc skipped: no live connection for ${roomJid}`);
			return;
		}

		console.log(`[XmppService] leaveMuc called for ${roomJid} as ${nick}`);
		const pres = $pres({ to: `${roomJid}/${nick}`, type: 'unavailable' });

		try {
			// let the server know we’re gone
			this.connection.send(pres);
			// clean up the MUC state
			this.connection.muc.leave(roomJid, nick);
		} catch (err) {
			console.warn('[XmppService] leaveMuc error', err);
		}
	}

	public isConnected(): boolean {
		return this.connection?.connected;
	}

	public disconnect(): void {
		if (this.isConnected()) {
			console.log('[XmppService] disconnect called');
			this.connection.disconnect();
		}
	}

	/**
	 * ========
	 * GETTERS
	 * =======
	 */
	public getBody(stanza: any): string {
		const body = Strophe.getText(stanza.getElementsByTagName('body')[0]);
		// console.log(`[XmppService] getBody → ${body}`);
		return body;
	}
	public getResource(stanza: any): string {
		const res = Strophe.getResourceFromJid(stanza.getAttribute('from'));
		// console.log(`[XmppService] getResource → ${res}`);
		return res;
	}
	public getTimestamp(stanza: any): string {
		const delay = stanza.getElementsByTagName('delay')[0];
		const ts = delay ? delay.getAttribute('stamp') : new Date().toISOString();
		// console.log(`[XmppService] getTimestamp → ${ts}`);
		return ts;
	}
	public getAttribute(stanza: any, attr: any) {
		const value = stanza.getAttribute(attr);
		// console.log(`[XmppService] Attribute ${attr} → ${value}`);
		return value;
	}
	/**
	 * ========
	 * END GETTERS
	 * =======
	 */

	/**
	 * ================
	 * UNUSED FUNCTIONS
	 * ================
	 */
	sendIQ(iq: any, successCb: (result: any) => void, errorCb: (error: any) => void) {
		if (!this.isConnected()) {
			console.error('XMPP connection is not established');
			errorCb('XMPP not connected');
			return;
		}

		// iq should be a valid Strophe.Builder (usually built with $iq())
		this.connection.sendIQ(
			iq,
			(res: any) => {
				console.log('IQ Result:', res);
				successCb(res);
			},
			(err: any) => {
				console.error('IQ Error:', err);
				errorCb(err);
			}
		);
	}
	getUnreadMessageCount(roomJid: string, lastReadTimestamp: string): Promise<number> {
		console.log('Sending IQ unread messages: ', lastReadTimestamp);
		return new Promise((resolve, reject) => {
			const iq = $iq({
				type: 'set',
				to: roomJid,
				id: 'mam-unread-' + Date.now(),
			})
				.c('query', { xmlns: 'urn:xmpp:mam:2' })
				.c('x', { xmlns: 'jabber:x:data', type: 'submit' })
				.c('field', { var: 'FORM_TYPE', type: 'hidden' })
				.c('value').t('urn:xmpp:mam:2').up().up()
				.c('field', { var: 'start' })
				.c('value').t(lastReadTimestamp);

			this.sendIQ(
				iq,
				(res: any) => {
					const countNode = res.getElementsByTagName('count')[0];
					const count = countNode ? parseInt(countNode.textContent || '0', 10) : 0;
					console.log(`Unread messages since ${lastReadTimestamp}:`, count);
					resolve(count);
				},
				(err: any) => {
					console.error('Failed to get unread message count', err);
					reject(err);
				}
			);
		});
	}
}
