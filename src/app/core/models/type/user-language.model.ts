import {UserAvatar} from "../user-avatar.model";
import {Language} from "./language.model";
import {LanguageLevel} from "./language-level.model";

export interface UserLanguage {
  language: Language
  level: LanguageLevel;
}
