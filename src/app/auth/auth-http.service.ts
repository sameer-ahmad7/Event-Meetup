import { Injectable } from '@angular/core';
import { TokenResponse, Requestor } from '@openid/appauth';
import { AuthService } from 'ionic-appauth';

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {

  constructor(private requestor: Requestor, private auth: AuthService) { }

  public async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any){
    const token: TokenResponse = await this.auth.getValidToken();
    return this.requestor.xhr<T>({
      url,
      method,
      data: JSON.stringify(body),
      headers: this.addHeaders(token)
    });
  }

  private addHeaders(token: TokenResponse) {
	console.log('here');
      return (token) ? {
                  Authorization: `${(token.tokenType === 'bearer') ? 'Bearer' : token.tokenType} ${'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJLOWRWYm10bGpUcHVmeUlmX2lIRGZTN212d2w2RnRuYmFIV3N0dmpmXy1NIn0.eyJleHAiOjE3NDE5NTM3MDEsImlhdCI6MTc0MTk1MjgwMSwiYXV0aF90aW1lIjoxNzQxOTQ2NTc5LCJqdGkiOiIzOWM4ZTU5OS0yMzZjLTRjZDgtYWI1MS01N2Q5N2Q2YzI1MmIiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLnNwZWFrZWF0YXBwLmNvbS9yZWFsbXMvU3BlYWtFYXQiLCJhdWQiOiJTcGVha0VhdEFwcCIsInN1YiI6IjdkNWM0YjJlLWZiNzYtNGExMi04ZDY1LWY0OGEwYTMwYzYwOCIsInR5cCI6IklEIiwiYXpwIjoiU3BlYWtFYXRBcHAiLCJzaWQiOiJmNTk3MjE2Zi0zNmYwLTQxNmItODkwZC0zZWJlOTc5NzFkZGMiLCJhdF9oYXNoIjoiTkVYSlAzVDNRTGVIZWx0UVA0STROQSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQW5nZWxvIE1hZ2xpb25lIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWFnbGlvbmVhbmdlbG9AZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6IkFuZ2VsbyIsImZhbWlseV9uYW1lIjoiTWFnbGlvbmUiLCJlbWFpbCI6Im1hZ2xpb25lYW5nZWxvQGdtYWlsLmNvbSJ9.V_BCVjwMzL_-uIoU6VK89x_6TbnfBvQTl1-uFK0sjgCpsIEYfDKMBMVc948c3jG970bDvyqVC7eyFogZ5_yKy5PBDnREsBgXRzpOh7PR9FVGDeVYIq8zETsAlziGhaXuvDP0TwC92NZLZpvwvp560Wro-_BuyvPsZKhs67bNAidxnQGZoN-W7xNk_I1FEs68iORmvsxE64FESIUDhcI6jB-SvsfKpVQ6iwIfMu2iNgYlTTqnxiyJFE_IGBlvQhDdp7rEZLQc69FYrwGvxh2dwCov4zKW6svaHQjN7C5BK1ksPcSladuglpxL_KjdqfmjOP-ycE7FLflEYfZoN-REsQ'}`,
                  'Content-Type': 'application/json'
              } : {};

  }
}
