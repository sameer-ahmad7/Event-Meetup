import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEventMapPage } from './create-event-map.page';

describe('CreateEventMapPage', () => {
  let component: CreateEventMapPage;
  let fixture: ComponentFixture<CreateEventMapPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEventMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
