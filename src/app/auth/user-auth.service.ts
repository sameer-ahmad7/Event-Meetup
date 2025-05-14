import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthActions, AuthService, IAuthAction } from 'ionic-appauth';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { TokenResponse } from "@openid/appauth";
import { User } from "../core/models/user.models";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import * as RouteConstants from "../core/rest/route.constant";
import { Preferences } from '@capacitor/preferences';
import { RadarApiService } from "../core/rest/radar-api.service";
import { GeolocationAddress } from "../core/models/GeolocationAddress.model";
import { jwtDecode } from "jwt-decode";
import { Router } from '@angular/router';
import { SharedService } from '../core/services/shared.service';

@Injectable({
	providedIn: 'root'
})
export class UserAuthService {
	private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
	user$ = this.userSubject.asObservable();
	geoLocation$: Observable<GeolocationAddress> = new Subject()

	tokenResponse?: TokenResponse;
	user!: User;
	geoLocation!: GeolocationAddress;
	authenticated = false;

	subscriptionRefreshToken!: Subscription;
	schedulerRefreshTokenStarted = false;

	constructor(
		private auth: AuthService,
		private http: HttpClient,
		private router: Router,
		private radarApiService: RadarApiService
	) {
		this.auth.init().then(() => {
			this.auth.events$.subscribe((action) => this.handleAuthEvent(action));
		})
	}

	async handleAuthEvent(authAction: IAuthAction) {
		// // this.log.debug("AuthEvent: " + authAction.action);
		// // this.log.debug("Status: " + this.auth.);
		if (authAction.error) {
			console.log("Auth Error: " + authAction.error);
		}
		console.log(authAction.action);
		const validStates: String[] = [AuthActions.LoadTokenFromStorageSuccess, AuthActions.RefreshSuccess, AuthActions.SignInSuccess]
		if (validStates.includes(authAction.action)) {
			this.authenticated = true;
			this.tokenResponse = authAction.tokenResponse;
			await this.startTokenRefreshScheduler();
			await this.fetchUserAuth();
			if (authAction.action === AuthActions.SignInSuccess) {
				// this.log.debug("Login Success");
				this.router.navigate(['/tabs'], { replaceUrl: true });
			}
		}
	}

	loadUserFromStorage(): Promise<void> {
		return new Promise((resolve, reject) => {
			Preferences.get({ key: 'user' }).then(ret => {
				if (ret.value) {
					this.user = JSON.parse(ret.value);
				}
				resolve();
			});
		})
	}

	async startTokenRefreshScheduler() {
		if (!this.schedulerRefreshTokenStarted) {
			this.schedulerRefreshTokenStarted = true;
			console.log("Starting scheduler refresh token");
			const checkInterval = 30 * 1000; // 30 seconds
			setInterval(async () => {
				console.log("Scheduler: scanning token")
				await this.refreshTokenIfExpired();
			}, checkInterval);
		}
	}

	async refreshTokenIfExpired() {
		console.log("Check tokenIsExpired");
		if (this.isTokenExpiringSoon(this.tokenResponse?.accessToken)) {
			console.log("Token is expired");
			await this.auth.refreshToken();
		}
	}

	getTokenExpiration(token: string): number {
		const decoded: any = jwtDecode(token);
		return decoded.exp * 1000;
	}

	isTokenExpiringSoon(token: string | undefined, threshold: number = 60 * 1000): boolean {
		if (!token) {
			return true;
		}
		const expirationTime = this.getTokenExpiration(token);
		return (expirationTime - Date.now()) < threshold;
	}

	async fetchUserAuth(): Promise<User> {
		// console.log("DEBUG# Fetching user")
		return new Promise((resolve, reject) => {
			this.http.get<User>(RouteConstants.USER_SELF, { headers: this.authHeaders() })
				.subscribe(user => {
					Preferences.set({
						key: 'user',
						value: JSON.stringify(user)
					});
					this.user = user;
					this.radarApiService.geolocationAddress$.subscribe(geoLocation => {
						this.user.geolocation = geoLocation;
					});
					// TODO: idea was to move these above (inside geoLocationAddress subscribe). But in that case the redirect after login doesn't work
					this.userSubject.next(this.user);
					resolve(this.user);
				})
		})
	}

	getAccessToken() {
		if (this.tokenResponse) {
			return this.tokenResponse;
		}
		return null;
	}

	currentUser() {
		return this.user;
	}

	private authHeaders() {
		let headers = new HttpHeaders();
		headers = headers.set('Content-Type', 'application/json')
			.set('Authorization', `${(this.tokenResponse?.tokenType === 'bearer') ? 'Bearer' : this.tokenResponse?.tokenType} ${this.tokenResponse?.idToken}`);
		return headers;
	}

	isTokenValid() {
		return this.tokenResponse && this.tokenResponse.isValid(1);
	}

	async checkSession(): Promise<boolean> {
		try {
			const token = await this.auth.getValidToken();
			return !!token; // Returns true if token exists	
		} catch {
			return false;
		}
	}


}
