import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, input, OnDestroy, OnInit, output, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonChip, IonLabel, IonCard, IonCardHeader, IonButton, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { filter, people, location, locateOutline } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { EventItem } from 'src/app/core/models/event-item.model';
import { MarkerModel } from 'src/app/core/models/marker-model';
import * as L from 'leaflet';
import { SharedService } from 'src/app/core/services/shared.service';
import { UserEventAvatar } from 'src/app/core/models/user-event-avatar.model';

@Component({
	selector: 'app-map-view',
	templateUrl: './map-view.page.html',
	styleUrls: ['./map-view.page.scss'],
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [IonCardHeader, IonCard, IonLabel, IonChip, IonIcon, CommonModule, FormsModule]
})
export class MapViewPage implements OnInit, OnDestroy {
	@ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

	private map!: L.Map;
	private markerLayer!: L.LayerGroup;

	filteredEvents: EventItem[] = [];

	defaultZoomLevel = 5;
	events = input.required<EventItem[]>();
	userLocation = input.required<{ latitude: number; longitude: number }>();
	mapMarkers = input.required<MarkerModel[]>();
	isRefresh = input.required<boolean>();
	isRefreshMyLocation = input.required<boolean>();
	onRefreshLocation = output<void>();

	selfMarker?: L.Marker<any>;
	defaultCenter: [number, number] = [0, 0];

	constructor(private router: Router, public sharedService: SharedService
	) {

		effect(() => {
			if (this.isRefresh() && this.map) {
				this.reinitializeMarkers();
			}
		});
		addIcons({ locateOutline, people, location, filter });
	}

	ngOnInit(): void {

	}

	gotoDetails(id: string) {
		setTimeout(() => {
			console.log(id);
			this.router.navigate(['/events', id]);
		}, 500);
	}

	getEventParticipants(participants: UserEventAvatar[]) {
		return participants.filter(p => p.userEventStatus === 'OWNER' || p.userEventStatus === 'ACCEPTED');
	}


	ngAfterViewInit(): void {
		this.fixLeafletIcons();
		setTimeout(() => {
			this.initMap();
		}, 200); // Ensure Ionic has fully rendered before initializing Leaflet
	}

	private fixLeafletIcons(): void {
		const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
		const iconUrl = 'assets/leaflet/marker-icon.png';
		const shadowUrl = 'assets/leaflet/marker-shadow.png';

		L.Marker.prototype.options.icon = L.icon({
			iconRetinaUrl,
			iconUrl,
			shadowUrl,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});
	}


	private initMap(): void {
		if (this.map) {
			this.map.remove(); // Prevent reinitialization issues
		}

		let geoLocation = this.userLocation();
		if (this.events() && this.events().length > 0) {
			geoLocation = { latitude: this.events()[0].businessClient.geolocation.latitude, longitude: this.events()[0].businessClient.geolocation.longitude }
		}

		this.defaultCenter = [geoLocation.latitude, geoLocation.longitude];

		this.map = L.map(this.mapContainer.nativeElement, {
			center: [geoLocation.latitude, geoLocation.longitude], // Default center
			zoom: 2, // Default zoom level
			zoomControl: false, // Disable default zoom buttons
			scrollWheelZoom: true, // Enable scroll zoom
			dragging: true, // Enable dragging
			touchZoom: true, // Enable pinch zoom
			doubleClickZoom: false // Disable double-click zoom (optional)
		});

		// Add OpenStreetMap tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(this.map);

		this.markerLayer = L.layerGroup().addTo(this.map);
		this.addMarkers();

		// Ensure map resizes properly after rendering
		if (this.mapMarkers().length > 1) {
			setTimeout(() => {
				this.fitMapToMarkers();
			}, 200);
		}
	}

	private reinitializeMarkers(): void {
		// 🔹 Step 1: Remove all existing markers
		this.markerLayer.clearLayers();

		// 🔹 Step 2: Add new markers
		this.addMarkers();

		// 🔹 Step 3: Adjust zoom & fit bounds
		if (this.isRefreshMyLocation()) {
			setTimeout(()=>{
				this.map.invalidateSize();
				if (this.selfMarker) {
					this.selfMarker.fire('click');
				}
	
			},200);

		} else {
			if (this.mapMarkers().length > 1) {
				this.fitMapToMarkers();
			} else {
				setTimeout(()=>{
					this.map.invalidateSize();
					this.map.setZoom(5);
				},200);

			}

		}
	}

	private fitMapToMarkers(): void {
		if (this.mapMarkers().length === 0) return; // Prevent errors if no markers exist
		const bounds = L.latLngBounds(this.mapMarkers().map((m) => [m.geoLocation.latitude, m.geoLocation.longitude]));


 this.map.invalidateSize(); // Fixes layout issues before adjusting bounds
  this.map.flyToBounds(bounds, { padding: [50, 50], animate: false });

  setTimeout(() => {

			if (this.mapMarkers().length > 1) {

				const currentZoom = this.map.getZoom();
				this.defaultZoomLevel=currentZoom;
				console.log(currentZoom);
				this.map.setMinZoom(this.defaultZoomLevel);			
		}
		const newCenter = this.map.getCenter();
		this.defaultCenter = [newCenter.lat, newCenter.lng];
  }, 500); // Allow time for Leaflet to adjust

	}

	onCenterMyLocation() {
		if (this.selfMarker) {
			this.selfMarker.fire('click');
		}
		this.onRefreshLocation.emit();

	}

	private addMarkers(): void {
		this.mapMarkers().forEach((location) => {
			let title = 'You are here';
			let iconUrl = 'assets/leaflet/marker-icon-green.png';
			if (!location.selfMarker) {
				iconUrl = 'assets/leaflet/marker-icon-red.png';
				const eventItem = this.events().find(e => e.businessClient.geolocation.latitude === location.geoLocation.latitude && e.businessClient.geolocation.longitude);
				if (eventItem) {
					title = this.getBusinessClientAddress(eventItem);
				}
			}
			const customIcon = L.icon({
				iconUrl,
				shadowUrl: 'assets/leaflet/marker-shadow.png',
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41]
			});
			const marker = L.marker([location.geoLocation.latitude, location.geoLocation.longitude], { title, icon: customIcon })
				.addTo(this.markerLayer)
				.bindPopup(`<b>${title}</b>`);

			if (location.selfMarker) {
				this.selfMarker = marker;
			}

			marker.on('click', () => {
				this.flyToMarker(location.geoLocation.latitude, location.geoLocation.longitude);
				if (!location.selfMarker) {
					this.filteredEvents = this.events().filter(e => e.businessClient.geolocation.latitude === location.geoLocation.latitude && e.businessClient.geolocation.longitude === location.geoLocation.longitude);
				}
			});
			if (this.mapMarkers().length > 1) {
				marker.on('popupclose', () => {
					this.filteredEvents = [];
					this.flyToMarker(this.defaultCenter[0], this.defaultCenter[1], this.defaultZoomLevel);
				});
			}


		});
	}

	getBusinessClientAddress(event: EventItem): string {
		return event.businessClient.name + ", " + event.businessClient.country + ", " + event.businessClient.city;
	}


	public flyToMarker(latitude: number, longitude: number, zoom: number = 12): void {
		this.map.flyTo([latitude, longitude], zoom, {
			animate: true,
			duration: 1.5
		});
	}

	ngOnDestroy(): void {

	}
}
