import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { UserAuthService } from './user-auth.service';

@Injectable({
	providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

	constructor(
		private userAuth: UserAuthService,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userAuth.refreshTokenIfExpired()
				.then(async () => {
					console.log(state.url);
					if (!this.userAuth.isTokenValid()) {
						console.log('here', this.userAuth.getAccessToken())
						this.router.navigate(['/login'], { replaceUrl: true });
						// location.href = environment.welcomePage;
					} else {
						// Authenticated
						let user = this.userAuth.currentUser();
						if (!user) {
							await this.userAuth.fetchUserAuth();
							user = this.userAuth.currentUser()
						}
						if (state.url.includes('complete-profile') && user.userStatus !== 'NEW') {
							this.router.navigate(['/'], { replaceUrl: true });
						} else if (state.url.includes('complete-profile') && user.userStatus === 'NEW') {
							// noop
						} else if (user.userStatus === 'NEW') {
							this.router.navigate(['/complete-profile'], { replaceUrl: true });
						}
						resolve(true);
					}
				})
		});

	}
}
