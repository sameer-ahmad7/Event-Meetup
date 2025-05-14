import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, input, OnInit, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardHeader, IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { BusinessClient } from 'src/app/core/models/business-client.model';
import { Router } from '@angular/router';
import { MarkerModel } from 'src/app/core/models/marker-model';
import { SharedService } from 'src/app/core/services/shared.service';
import L from 'leaflet';
import { addIcons } from 'ionicons';
import { filter, location, locateOutline, people, star, starHalfOutline, helpCircle } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { ShowWorkingHoursComponent } from './show-working-hours/show-working-hours.component';

@Component({
	selector: 'app-create-event-map',
	templateUrl: './create-event-map.page.html',
	styleUrls: ['./create-event-map.page.scss'],
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [IonCardHeader, IonCard, IonLabel, IonChip, IonIcon, CommonModule, FormsModule]
})
export class CreateEventMapPage implements OnInit {

	@ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

	private map!: L.Map;
	private markerLayer!: L.LayerGroup;


	@ViewChild('slides') swiperElement: any;

	currentSlide = 0;

	markers: L.Marker<any>[] = [];

	defaultZoomLevel = 5;
	businesses = input.required<BusinessClient[]>();
	userLocation = input.required<{ latitude: number; longitude: number }>();
	mapMarkers = input.required<MarkerModel[]>();
	isRefresh = input.required<boolean>();
	onRefreshLocation = output<void>();
	onBusinessSelected = output<BusinessClient>();

	selectedBusiness!: BusinessClient;

	selfMarker?: L.Marker<any>;
	defaultCenter: [number, number] = [0, 0];
	auxRanking = [1, 2, 3, 4, 5];
	workingHoursInfo: { day: string; timeIntervals: { startTime: string; endTime: string }[] }[] = [];

	constructor(private modalCtrl: ModalController, public sharedService: SharedService) {
		effect(() => {
			if (this.isRefresh() && this.map) {
				this.selectedBusiness = null as any;
				this.workingHoursInfo = [];
				this.markers = [];
				this.reinitializeMarkers();
				console.log('here');
			}
		});
		addIcons({ locateOutline, helpCircle, star, starHalfOutline, people, location, filter });

	}


	ngOnInit() {
	}

	onSlideChanged(event: any) {
		this.currentSlide = event.detail[0].realIndex;
		const business = this.businesses()[this.currentSlide];
		const marker = this.markers.find(m => m.getLatLng().lat === business.geolocation.latitude && m.getLatLng().lng === business.geolocation.longitude);
		marker?.fire('click');
	}

	onSelectBusiness(businessClient: BusinessClient) {
		this.selectedBusiness = businessClient;
		this.onBusinessSelected.emit(this.selectedBusiness);
	}

	async showWorkingHours(business: BusinessClient) {
		const modal = await this.modalCtrl.create({
			component: ShowWorkingHoursComponent, componentProps: {
				business
			},
			breakpoints: [0, 1],
			initialBreakpoint: 1,
			cssClass: 'working-hours-modal'
		})
		await modal.present();
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
		if (this.businesses() && this.businesses().length > 0) {
			geoLocation = { latitude: this.businesses()[0].geolocation.latitude, longitude: this.businesses()[0].geolocation.longitude }
		}

		this.defaultCenter = [geoLocation.latitude, geoLocation.longitude];

		this.map = L.map(this.mapContainer.nativeElement, {
			center: [geoLocation.latitude, geoLocation.longitude], // Default center
			zoom: 5, // Default zoom level
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

		setTimeout(() => {
			if (this.businesses().length > 0) {
				const business = this.businesses()[0];
				const marker = this.markers.find(m => m.getLatLng().lat === business.geolocation.latitude && m.getLatLng().lng === business.geolocation.longitude);
				if (marker) {
					marker.fire('click');
				}
			}
		}, 200);
	}


	private fitMapToMarkers(): void {
		if (this.mapMarkers().length === 0) return; // Prevent errors if no markers exist
		const bounds = L.latLngBounds(this.mapMarkers().map((m) => [m.geoLocation.latitude, m.geoLocation.longitude]));


		this.map.invalidateSize(); // Fixes layout issues before adjusting bounds
		this.map.flyToBounds(bounds, { padding: [50, 50], animate: false });

		setTimeout(() => {

			if (this.mapMarkers().length > 1) {

				const currentZoom = this.map.getZoom();
				this.defaultZoomLevel = currentZoom;
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
		this.selectedBusiness = null as any;
		this.onRefreshLocation.emit();

	}


	private reinitializeMarkers(): void {
		// 🔹 Step 1: Remove all existing markers
		this.markerLayer.clearLayers();

		// 🔹 Step 2: Add new markers
		this.addMarkers();

		// 🔹 Step 3: Adjust zoom & fit bounds
		if (this.mapMarkers().length > 1) {
			this.fitMapToMarkers();
		} else if (this.mapMarkers().length === 1) {
			setTimeout(() => {
				this.map.invalidateSize();
				const lat = this.mapMarkers()[0].geoLocation.latitude;
				const lng = this.mapMarkers()[0].geoLocation.longitude;
				if (this.businesses().length === 0) {
					this.flyToMarker(lat, lng);
				}
			}, 200);
		}
		if (this.businesses().length > 0) {
			setTimeout(() => {
				const business = this.businesses()[0];
				const marker = this.markers.find(m => m.getLatLng().lat === business.geolocation.latitude && m.getLatLng().lng === business.geolocation.longitude);
				if (marker) {
					marker.fire('click');
				}
			}, 200);
		}

	}

	private addMarkers(): void {
		this.mapMarkers().forEach((location) => {
			let title = 'You are here';
			let iconUrl = 'assets/leaflet/marker-icon-green.png';
			if (!location.selfMarker) {
				iconUrl = 'assets/leaflet/marker-icon-red.png';
				const eventItem = this.businesses().find(e => e.geolocation.latitude === location.geoLocation.latitude && e.geolocation.longitude);
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
				this.navigateToSlide(location.geoLocation.latitude, location.geoLocation.longitude);
			});
			if (this.mapMarkers().length > 1) {
				marker.on('popupclose', () => {
					this.flyToMarker(this.defaultCenter[0], this.defaultCenter[1], this.defaultZoomLevel);
				});
			}

			this.markers.push(marker);
		});
	}

	navigateToSlide(lat: number, lng: number) {
		const businessIndex = this.businesses().findIndex(b => b.geolocation.latitude === lat && b.geolocation.longitude === lng);
		if (businessIndex >= 0 && businessIndex != this.currentSlide) {
			const swiper = this.swiperElement.nativeElement.swiper;
			if (swiper) {
				swiper.slideTo(businessIndex, 0); // Instantly jump to the selected slide
			}

		}
	}

	getBusinessClientAddress(event: BusinessClient): string {
		return event.name + ", " + event.country + ", " + event.city;
	}


	public flyToMarker(latitude: number, longitude: number, zoom: number = 12): void {
		this.map.flyTo([latitude, longitude], zoom, {
			animate: true,
			duration: 1.5
		});
	}



}
