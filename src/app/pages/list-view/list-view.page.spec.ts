import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListViewPage } from './list-view.page';

describe('ListViewPage', () => {
  let component: ListViewPage;
  let fixture: ComponentFixture<ListViewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
