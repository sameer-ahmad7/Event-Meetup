import {BusinessOpeningPeriod} from "./business-opening-period-model";

export interface BusinessOpeningDay {
  enabled: boolean;
  dayOfWeek: string;
  openingPeriods: Array<BusinessOpeningPeriod>;
}
