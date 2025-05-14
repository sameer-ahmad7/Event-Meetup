import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'ionic-appauth';
import { map, Observable, take } from 'rxjs';
import { UserAuthService } from './user-auth.service';

@Injectable({
	providedIn: 'root'
})
export class NoAuthGuardService implements CanActivate {

	constructor(
		private userAuthService: UserAuthService,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
		return new Promise(resolve => {
			this.userAuthService.checkSession().then((auth) => {
				if (!auth) {
					resolve(true);
				}
				resolve(false);
			})
		})

	}
}
