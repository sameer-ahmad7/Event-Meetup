import { Injectable } from '@angular/core';
import { WebClientService } from './web-client.service';
import * as RouteConstants from './route.constant';
import { BlockedUser, KickReasons, ReportReasons } from '../models/block.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlockService {

  constructor(private webClient: WebClientService) { }

  blockUser(userId:string){
	return this.webClient.post(`${RouteConstants.USER_ALL}/${userId}/block`,{});
  }

  unBlockUser(userId:string){
	return this.webClient.delete(`${RouteConstants.USER_ALL}/${userId}/block`);
  }

  getBlockedUsers(){
	return this.webClient.get<BlockedUser[]>(`${RouteConstants.USER_ALL}/blocked`);
  }

  reportUser(eventId:string,userToReportId:string,reason:string,message:string){
	return this.webClient.post(`${RouteConstants.EVENT_ALL}/${eventId}/report`,{
		userToReportId,
		reason,
		message
	});
  }

  kickOutUser(eventId:string,userToKickId:string,reason:string,message:string){
	return this.webClient.post(`${RouteConstants.EVENT_ALL}/${eventId}/kick-user`,{
		userToKickId,
		reason,
		message
	});

  }

  getKickReasons(){
	return this.webClient.get<{reasons:KickReasons[]}>(RouteConstants.KICK_REASONS).pipe(
		map(res=>{
			if(res){
				return res.reasons;
			}else{
				return []
			}
		})
	);
  }

  getReportReasons(){
	return this.webClient.get<{reasons:ReportReasons[]}>(RouteConstants.REPORT_REASONS)
	.pipe(
		map(res=>{
			if(res){
				return res.reasons;
			}else{
				return []
			}
		})
	)
	;
  }

}
