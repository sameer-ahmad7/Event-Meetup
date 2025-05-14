export interface UserAvatar {
  userId: string;
  xmppUser: string;
  firstName: string;
  lastName: string;
  imageProfileB64: string;

  // OLD
  name?: string;
  text?: string;
  profile?: string;
  variant?: string;
  size?: string;
}
