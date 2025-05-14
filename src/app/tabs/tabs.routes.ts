import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
	{
		path: 'tabs',
		component: TabsPage,
		children: [
			{
				path: 'home',
				loadComponent: () =>
					import('./home/home.page').then((m) => m.HomePage),
			},
			{
				path: 'chats',
				loadComponent: () => import('./chat/chat.page').then(m => m.ChatPage)
			},
			{
				path: 'create-event',
				loadComponent: () => import('./create-event/create-event.page').then(m => m.CreateEventPage)
			},
			{
				path: 'my-events',
				loadComponent: () => import('./my-event/my-event.page').then(m => m.MyEventPage)
			},
			{
				path: '',
				redirectTo: '/tabs/home',
				pathMatch: 'full',
			},
		],
	},
	{
		path: '',
		redirectTo: '/tabs/home',
		pathMatch: 'full',
	},

];
