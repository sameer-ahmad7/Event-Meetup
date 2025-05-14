import { Language } from "./language.model";

export interface LanguageLevel {
  // Basic, Intermediate, Master
  levelName: string;
  description: string;
}

export interface LanguageLevelDTO{
	language:Language;
	level:LanguageLevel;
}