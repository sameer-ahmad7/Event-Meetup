import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapViewPage } from './map-view.page';

describe('MapViewPage', () => {
  let component: MapViewPage;
  let fixture: ComponentFixture<MapViewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MapViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
