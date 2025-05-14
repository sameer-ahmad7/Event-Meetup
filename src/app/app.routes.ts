import { Routes } from '@angular/router';
import { LoginPage } from './auth/login/login.page';
import { AuthGuardService } from './auth/auth-guard.service';
import { NoAuthGuardService } from './auth/no-auth-guard.service';

export const routes: Routes = [
	{
		path: '',
		canActivate: [AuthGuardService],
		loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
	},
	{
		path:'chats/:id',
		canActivate:[AuthGuardService],
		loadComponent:()=>import('./pages/chat-details/chat-details.page').then(m=>m.ChatDetailsPage)
	},
	{
		path: 'login',
		canActivate: [NoAuthGuardService],
		component: LoginPage,
	},
	{ path: 'callback', loadChildren: () => import('./auth/auth-callback/auth-callback.module').then(m => m.AuthCallbackPageModule) },
	{ path: 'endsession', loadChildren: () => import('./auth/end-session/end-session.module').then(m => m.EndSessionPageModule) },
	{
		path: 'notifications',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/notification/notification.page').then(m => m.NotificationPage)
	},
	{
		path: 'events/:id',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/event-details/event-details.page').then(m => m.EventDetailsPage)
	},
	{
		path: 'profile',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
	},
	{
		path: 'profile/:id',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
	},
	{
		path: 'edit-profile',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/edit-profile/edit-profile.page').then(m => m.EditProfilePage)
	},
	{
		path: 'complete-profile',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/edit-profile/edit-profile.page').then(m => m.EditProfilePage)
	},
	{
		path: 'account-settings',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/account-settings/account-settings.page').then(m => m.AccountSettingsPage)
	},
	{
		path: 'privacy-policy',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/privacy-policy/privacy-policy.page').then(m => m.PrivacyPolicyPage)
	},
	{
		path: 'contact',
		canActivate: [AuthGuardService],
		loadComponent: () => import('./pages/contact/contact.page').then(m => m.ContactPage)
	},
	{
		path: 'blocked-users',
		canActivate:[AuthGuardService],
		loadComponent: () => import('./pages/blocked-users/blocked-users.page').then( m => m.BlockedUsersPage)
	  },	
	{
		path: '**',
		redirectTo: 'login'
	},
];
