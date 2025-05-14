import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventHistoryPage } from './event-history.page';

describe('EventHistoryPage', () => {
  let component: EventHistoryPage;
  let fixture: ComponentFixture<EventHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
