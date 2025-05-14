import {AddressLocationResponse} from "./address-location-response.model";

export interface MapLocationResponse {
    "meta": {
        "code": 200
    },
    "addresses": Array<AddressLocationResponse>
}