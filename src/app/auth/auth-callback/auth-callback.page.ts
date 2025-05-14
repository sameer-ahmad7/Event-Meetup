import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'ionic-appauth';
import { Subscription } from 'rxjs';
import { SharedService } from "../../core/services/shared.service";

@Component({
	template: '<p>Signing in...</p>',
	standalone: false
})
export class AuthCallbackPage implements OnInit, OnDestroy {
	sub: Subscription | undefined;

	constructor(
		private auth: AuthService,
		private router: Router,
		private sharedService: SharedService
	) { }

	ngOnInit() {
		this.sharedService.logDebug("Auth-Callback init: " + window.location.origin + this.router.url)
		this.auth.authorizationCallback(window.location.origin + this.router.url);
	}

	ngOnDestroy() {
		this.sub?.unsubscribe();
	}

}
