import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonHeader, IonTitle, IonToolbar, LoadingController, IonProgressBar, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BlockedUser } from 'src/app/core/models/block.model';
import { BlockService } from 'src/app/core/rest/block.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { chevronBack, ellipsisHorizontal } from 'ionicons/icons';
import { AvatarModule } from 'ngx-avatars';
import { User } from 'src/app/core/models/user.models';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-blocked-users',
  templateUrl: './blocked-users.page.html',
  styleUrls: ['./blocked-users.page.scss'],
  standalone: true,
  imports: [ IonButton, IonBackButton, IonButtons, IonProgressBar, IonContent, AvatarModule,
	IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class BlockedUsersPage implements OnInit {

isLoading=true;
blockedUsers:BlockedUser[]=[];
selfUser!:User;

  constructor(private loadingCtrl:LoadingController,private alertCtrl:AlertController,private router:Router,
	private toast:ToastService,private userAuthService:UserAuthService,public sharedService:SharedService,
	private blockService:BlockService) { 
		addIcons({ellipsisHorizontal,chevronBack});
	}

  ngOnInit() {
	this.selfUser=this.userAuthService.currentUser();
	this.fetchBlockedUsers();
  }

  gotoProfile(link:string){
	this.router.navigateByUrl(link);
  }

  fetchBlockedUsers(){
	this.blockService.getBlockedUsers().subscribe(users=>{
		console.log(users);
		this.blockedUsers=users;
		this.isLoading=false;
	});
  }

  async onUnBlockUser(user:BlockedUser){
	const loader=await this.loadingCtrl.create({backdropDismiss:false});
	await loader.present();
	this.blockService.unBlockUser(user.userId).subscribe(async res=>{
		await loader.dismiss();
		this.toast.show(`${user.firstName} has been unblocked`);
		this.fetchBlockedUsers();
	},async err=>{
		await loader.dismiss();
		this.toast.show(`Failed to unblock ${user.firstName}`,'Error','danger');
	})

  }

  async unBlockUser(user:BlockedUser){
	const alert=await this.alertCtrl.create({
		header:'Unblock',
		message:`Are you sure you want to unblock ${user.firstName}?`,
		buttons:[
			{
				text:'Cancel',
				role:'cancel'
			},
			{
				text:'Confirm',
				handler:()=>{
					this.onUnBlockUser(user);
				}
			}
		]
		});
		await alert.present();
	
  }

}
