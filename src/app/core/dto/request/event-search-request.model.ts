import { GeoPositionClient } from "../../models/geo-position.client";
import { TypeModel } from "../../models/type/type.model";

export class EventSearchRequest {
	startingDate: string | undefined;
	isoCodeLanguage: string | undefined;
	eventType!: TypeModel | undefined;
	isOffered: string | undefined;
	geoPositionEvent: GeoPositionClient | undefined
	selfPosition: boolean | undefined;
	statusesEvent!: Array<String>;
	formattedAddress: string | undefined;
}
