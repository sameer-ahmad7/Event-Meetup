import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from "ionic-appauth";
import { SharedService } from "../services/shared.service";
import { NotificationService } from "../services/notification.service";
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { UserAuthService } from 'src/app/auth/user-auth.service';

export const ErrorInterceptor: HttpInterceptorFn = (request: HttpRequest<any>, next: HttpHandlerFn): Observable<any> => {
    // Inject required services
    const auth = inject(AuthService);
    const toastr = inject(ToastService);
    const router = inject(Router);
    const sharedService = inject(SharedService);
	const userAuthService=inject(UserAuthService);

    return next(request).pipe(
        catchError((err: HttpErrorResponse) => {
            console.log('Error Intercepted:', err);
            handleError(err, auth,userAuthService, toastr, router, sharedService);
            return throwError(() => err);
        })
    );
};

// Extracted handleError function
async function handleError(
    err: HttpErrorResponse,
    auth: AuthService,
	userAuthService:UserAuthService,
    toastr: ToastService,
    router: Router,
    sharedService: SharedService
) {
    console.log('Handling error:', err.status);
    sharedService.hideBackdrop();

    if (err.status >= 500) {
        toastr.show('Please contact the administrator', 'Server Error', 'danger');
    } else if (err.status >= 400) {
        switch (err.status) {
            case 401:
				console.log('here');
                sharedService.logDebug('401 - Redirect Landing');
				await userAuthService.refreshTokenIfExpired();
                router.navigate(['/'], { replaceUrl: true });
                break;
            case 412:
                validationErrors(err.error.validationErrors, toastr);
                break;
            case 400:
                break;
            default:
                toastr.show(
                    err.message || err.error?.message || 'Something went wrong',
                    'Unknown Error',
                    'danger'
                );
        }
    } else if (err.status === 0) {
        sharedService.showBackdrop();
        sharedService.openMessageDialog('Server Unreachable', "Please, verify your network connection and try again", "Try now")
            .then(() => {
                auth.signIn();
            });
    }
}

// Extracted validationErrors function
function validationErrors(validationErrors: any, toastr: ToastService) {
    let errors = '';
    for (let field in validationErrors) {
        errors += validationErrors[field];
        toastr.show(validationErrors[field], '', 'danger');
    }
    toastr.show('Please correct the following fields', 'Validation Errors', 'danger');
}
