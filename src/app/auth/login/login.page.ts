import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { AuthService } from 'ionic-appauth';
import { environment } from 'src/environments/environment';
import { Browser } from '@capacitor/browser';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { UserAuthService } from '../user-auth.service';
import { take } from 'rxjs';


@Component({
	selector: 'app-login',
	templateUrl: './login.page.html',
	styleUrls: ['./login.page.scss'],
	standalone: true,
	imports: [IonButton, IonSpinner, CommonModule, FormsModule, IonContent]
})
export class LoginPage implements OnInit, OnDestroy {

	isBrowserClosed = false;
	private browserCloseListener?: PluginListenerHandle;
	timeout!: any;

	constructor(
		private userAuthService: UserAuthService,
		private auth: AuthService,
		private cdr: ChangeDetectorRef
	) {
		// this.sharedService.showBackdrop();
	}

	async ngOnInit() {
		if (Capacitor.isNativePlatform()) {
			await this.addBrowserCloseListener();
		}
	}

	async addBrowserCloseListener() {
		this.browserCloseListener = await Browser.addListener('browserFinished', () => {
			this.timeout = setTimeout(async () => {
				const auth = await this.userAuthService.checkSession();
				if (!auth) {
					console.log('User closed login browser manually.');
					this.isBrowserClosed = true; // Hide spinner and reset UI	
					this.cdr.detectChanges();
				}
			}, 4000);
		});
	}

	ionViewDidEnter() {
		console.log('ion View Did Enter');
		if (!this.isBrowserClosed) {
			this.auth.initComplete$.pipe(take(1)).subscribe(complete => {
				if (complete) {
					setTimeout(async () => {
						try {
							await this.auth.signIn();

						} catch (error) {
							console.log('error', error);
						}

					}, 500);

				}
			})

		}
	}

	login() {
		this.auth.signIn();
	}


	ngOnDestroy() {
		console.log('destroy');
		this.browserCloseListener?.remove();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	protected readonly environment = environment;
}
