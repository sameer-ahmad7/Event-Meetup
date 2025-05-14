import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from "ionic-appauth";


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(
        private AuthService: AuthService,
    ) { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // noop
        const handler = next.handle(request);
        return handler;
    }
}
