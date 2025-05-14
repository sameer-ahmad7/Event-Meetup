import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFilterPage } from './event-filter.page';

describe('EventFilterPage', () => {
  let component: EventFilterPage;
  let fixture: ComponentFixture<EventFilterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventFilterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
