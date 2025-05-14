import { Component, Input, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AvatarModule } from 'ngx-avatars';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';
import { SharedService } from 'src/app/core/services/shared.service';
import { IonIcon, IonButton, IonActionSheet, ActionSheetButton, ActionSheetController, LoadingController, ModalController, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { BlockService } from 'src/app/core/rest/block.service';
import { EventItem } from 'src/app/core/models/event-item.model';
import { AlertController } from '@ionic/angular';
import { UserAvatar } from 'src/app/core/models/user-avatar.model';
import { combineLatest } from 'rxjs';
import { KickReasons, ReportReasons } from 'src/app/core/models/block.model';
import { ToastService } from 'src/app/core/services/toast.service';
import { KickOutUserComponent } from '../kick-out-user/kick-out-user.component';
import { ReportUserComponent } from '../report-user/report-user.component';

@Component({
  selector: 'app-event-participants',
  templateUrl: './event-participants.component.html',
  styleUrls: ['./event-participants.component.scss'],
  standalone:true,
  imports:[AvatarModule,IonIcon,IonButton,IonSpinner]
})
export class EventParticipantsComponent  implements OnInit {

@Input() event!:EventItem;
@Input() participants:UserEventAvatar[]=[];
@Input() userId='';
isLoading=true;
kickReasons:KickReasons[]=[];
reportReasons:ReportReasons[]=[];

  constructor(public sharedService:SharedService,private blockService:BlockService,private alertCtrl:AlertController,
	private actionSheetCtrl:ActionSheetController,private loadingCtrl:LoadingController,private toast:ToastService,
	private modalCtrl:ModalController,private router:Router
  ) { 
	addIcons({ellipsisHorizontal});
  }

  ngOnInit() {
	if(this.userId===this.event.owner.userId){
		combineLatest([this.blockService.getKickReasons(),this.blockService.getReportReasons()])
		.subscribe(([kickReasons,reportReaons])=>{
			this.kickReasons=kickReasons;
			this.reportReasons=reportReaons;
			this.isLoading=false;
			console.log(this.kickReasons);
		})
	}else{
		this.blockService.getReportReasons().subscribe(reportReasons=>{
			this.reportReasons=reportReasons;
			this.isLoading=false;
			console.log(this.reportReasons);
		})
	}
  }

 async onOpenActionSheet(participant:UserEventAvatar){
	const actionSheetButtons:ActionSheetButton[]=[];
	if(this.userId===this.event.owner.userId){
		actionSheetButtons.push(
			{
				text:'Kick Out',
				handler:()=>{
					this.kickOutUser(participant.userAvatar,this.event);
				}
			}
		)
	}
	actionSheetButtons.push({
		text:'Block',
		handler:()=>{
			this.blockUser(participant.userAvatar);
		},
	});

	if(this.userId!==this.event.owner.userId){
		actionSheetButtons.push({
			text:'Report',
			handler:()=>{
				this.reportUser(participant.userAvatar,this.event);
			}
		})
	}

	const actionSheet=await this.actionSheetCtrl.create({
		header:'Actions',
		buttons:actionSheetButtons
	});
	await actionSheet.present();
  }

  async kickOutUser(user:UserAvatar,event:EventItem){
	const modal=await this.modalCtrl.create({component:KickOutUserComponent,
		componentProps:{
			user,
			eventId:event.eventId,
			reasons:this.kickReasons
		},
		initialBreakpoint:1,
		breakpoints:[0,1],
		cssClass:'filter-modal'
});
	await modal.present();
	modal.onDidDismiss().then(res=>{
		console.log(res);
		if(res.data && res.data.success){
			this.dismiss(true);
		}
	})
  }

  gotoProfile(link:string){
	this.router.navigateByUrl(link);
	this.dismiss();
  }

  async reportUser(user:UserAvatar,event:EventItem){
	const modal=await this.modalCtrl.create({component:ReportUserComponent,
		componentProps:{
			user,
			eventId:event.eventId,
			reasons:this.reportReasons
		},
		initialBreakpoint:1,
		breakpoints:[0,1],
		cssClass:'filter-modal'
	});
	await modal.present();
	modal.onDidDismiss().then(res=>{
		console.log(res);
		if(res.data && res.data.success){
			this.dismiss(true);
		}
	})
  }

  dismiss(success:boolean=false){
	this.modalCtrl.dismiss({success});
  }

  async onBlockUser(user:UserAvatar){
	const loader=await this.loadingCtrl.create({backdropDismiss:false});
	await loader.present();
	this.blockService.blockUser(user.userId).subscribe(async res=>{
		await loader.dismiss();
		this.toast.show(`${user.firstName} has been blocked`);
		this.dismiss(true);
	},async err=>{
		await loader.dismiss();
		this.toast.show(`Failed to block ${user.firstName}`,'Error','danger');
	})
  }

async  blockUser(user:UserAvatar){
	const alert=await this.alertCtrl.create({
	header:'Block',
	message:`Are you sure you want to block ${user.firstName}?`,
	buttons:[
		{
			text:'Cancel',
			role:'cancel'
		},
		{
			text:'Confirm',
			handler:()=>{
				this.onBlockUser(user);
			}
		}
	]
	});
	await alert.present();

  }

}
