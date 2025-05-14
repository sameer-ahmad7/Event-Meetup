import {Injectable} from "@angular/core";
import * as RouteConstants from './route.constant';
import {WebClientService} from "./web-client.service";
import {User} from "../models/user.models";
import {UserConfig} from "../models/user-config.models";

@Injectable({providedIn: 'root'})

export class UserApiService {

  constructor(private webClient: WebClientService) {
  }


  /***
   * Get User By ID
   */
  getUser(userId: string) {
    return this.webClient.get<User>(RouteConstants.USER_BY_ID
      .replace("{userId}", userId));
  }

  updateUser(user: User) {
    return this.webClient.put<{}>(RouteConstants.USER_SELF, user);
  }

  getUserConfig() {
    return this.webClient.get<UserConfig>(RouteConstants.USER_SELF_CONFIG);
  }

  updateUserConfig(userConfig: UserConfig) {
    return this.webClient.put<{}>(RouteConstants.USER_SELF_CONFIG, userConfig);
  }

  saveImageAvatar(imageB64: string) {
    return this.webClient.put<{}>(RouteConstants.USER_SELF_IMAGE, imageB64);
  }

  deleteSelfAccount() {
    return this.webClient.delete<{}>(RouteConstants.USER_SELF_DELETE_ACCOUNT);
  }
}
