import { catchError } from 'rxjs/operators';
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { UserAuthService } from 'src/app/auth/user-auth.service';

@Injectable({ providedIn: 'root' })

export class WebClientService {

	constructor(private http: HttpClient,
		private userAuth: UserAuthService) {
	}

	/***
	 * REST POST
	 */
	post<T>(endpoint: string, payload: any): Observable<T> {
		return this.http.post<any>(endpoint, payload, { headers: this.authHeaders() })
			.pipe(
				catchError(this.handleError)
			);
	}

	/***
	 * REST PUT
	 */
	put<T>(endpoint: string, payload: any): Observable<T> {
		return this.http.put<any>(endpoint, payload, { headers: this.authHeaders() });
	}

	/**
	 * REST DELETE
	 */
	delete<T>(endpoint: string): Observable<T> {
		return this.http.delete<any>(endpoint, { headers: this.authHeaders() });
	}

	/***
	 * REST DELETE
	 */
	get<T>(endpoint: string, requestOptions?: any): Observable<T> {
		return this.http.get<any>(endpoint, { headers: this.authHeaders() });
	}

	private authHeaders() {
		if (this.userAuth.getAccessToken()) {
			const token = this.userAuth.getAccessToken();
			let headers = new HttpHeaders();
			headers = headers.set('Content-Type', 'application/json')
				.set('Authorization', `${(token?.tokenType === 'bearer') ? 'Bearer' : token?.tokenType} ${token?.accessToken}`);
			return headers;
		}
		return {};
	}
	private handleError(error: HttpErrorResponse) {
		if (error.status === 0) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error('An error occurred:', error.error);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong.
			console.error(
				`Backend returned code ${error.status}, body was: `, error.error);
		}
		return throwError(() => error);
	}
}
