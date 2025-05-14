import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventSuccessPage } from './event-success.page';

describe('EventSuccessPage', () => {
  let component: EventSuccessPage;
  let fixture: ComponentFixture<EventSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
