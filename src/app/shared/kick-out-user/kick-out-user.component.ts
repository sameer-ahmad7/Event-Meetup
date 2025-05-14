import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, LoadingController, ModalController, IonList,IonSelectOption, IonInput,IonItem, IonSelect, IonButton } from '@ionic/angular/standalone';
import { KickReasons } from 'src/app/core/models/block.model';
import { UserAvatar } from 'src/app/core/models/user-avatar.model';
import { BlockService } from 'src/app/core/rest/block.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-kick-out-user',
  templateUrl: './kick-out-user.component.html',
  styleUrls: ['./kick-out-user.component.scss'],
  standalone:true,
  imports:[IonList,IonItem,IonInput,IonSelect,IonSelectOption,IonButton, FormsModule]
})
export class KickOutUserComponent  implements OnInit {

@Input() user!:UserAvatar;
@Input() eventId!:string;
@Input() reasons:KickReasons[]=[];
reason='';
message='';

  constructor(private loadingCtrl:LoadingController,private alertCtrl:AlertController,private toast:ToastService,
	private blockService:BlockService,private modalCtrl:ModalController) { }

  ngOnInit() {}

  async onKickOutUser(){
	const loader=await this.loadingCtrl.create({backdropDismiss:false});
	await loader.present();
	this.blockService.kickOutUser(this.eventId,this.user.userId,this.reason,this.message).subscribe(async res=>{
		await loader.dismiss();
		this.toast.show(`${this.user.firstName} has been kicked out`);
		this.dismiss(true);
	},async err=>{
		await loader.dismiss();
		this.toast.show(`Failed to kick out ${this.user.firstName}`,'Error','danger');
	})
  }

  dismiss(sucess:boolean=false){
	this.modalCtrl.dismiss({sucess});
  }

  async kickOutUser(){
	const alert=await this.alertCtrl.create({
		header:'Kick Out',
		message:`Are you sure you want to kick out ${this.user.firstName}?`,
		buttons:[
			{
				text:'Cancel',
				role:'cancel'
			},
			{
				text:'Confirm',
				handler:()=>{
					this.onKickOutUser();
				}
			}
		]
		});
		await alert.present();
	
  }

}
