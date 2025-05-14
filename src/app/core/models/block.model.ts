import { LanguageLevelDTO } from "./type/language-level.model";

export interface KickReasons{
	key:string;
	value:string;
}

export interface ReportReasons{
	key:string;
	value:string;
}

export interface BlockedUser{
	userId: string;
    firstName: string;
    lastName: string;
    imageProfileB64: string;
    xmppUser: string;
	languageLevelDto:LanguageLevelDTO[];
}