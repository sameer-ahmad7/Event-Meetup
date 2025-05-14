import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButton, IonInput, IonItem, IonList, IonSelect, IonSelectOption, LoadingController, ModalController } from "@ionic/angular/standalone";
import { ReportReasons } from 'src/app/core/models/block.model';
import { UserAvatar } from 'src/app/core/models/user-avatar.model';
import { BlockService } from 'src/app/core/rest/block.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-report-user',
  templateUrl: './report-user.component.html',
  styleUrls: ['./report-user.component.scss'],
    standalone:true,
	imports:[IonList,IonItem,IonInput,IonSelect,IonSelectOption,IonButton, FormsModule]
  
})
export class ReportUserComponent  implements OnInit {
@Input() user!:UserAvatar;
@Input() eventId!:string;
@Input() reasons:ReportReasons[]=[];
reason='';
message='';

  constructor(private loadingCtrl:LoadingController,private alertCtrl:AlertController,private toast:ToastService,
	private blockService:BlockService,private modalCtrl:ModalController) { }

  ngOnInit() {}

  async onReportUser(){
	const loader=await this.loadingCtrl.create({backdropDismiss:false});
	await loader.present();
	this.blockService.reportUser(this.eventId,this.user.userId,this.reason,this.message).subscribe(async res=>{
		await loader.dismiss();
		this.toast.show(`${this.user.firstName} has been reported`);
		this.dismiss(true);
	},async err=>{
		await loader.dismiss();
		this.toast.show(`Failed to Report ${this.user.firstName}`,'Error','danger');
	})
  }

  dismiss(sucess:boolean=false){
	this.modalCtrl.dismiss({sucess});
  }

  async reportUser(){
	const alert=await this.alertCtrl.create({
		header:'Report',
		message:`Are you sure you want to report ${this.user.firstName}?`,
		buttons:[
			{
				text:'Cancel',
				role:'cancel'
			},
			{
				text:'Confirm',
				handler:()=>{
					this.onReportUser();
				}
			}
		]
		});
		await alert.present();
	
  }


}
