import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseDetailHeaderComponent } from './base-detail-header.component';

describe('BaseDetailHeaderComponent', () => {
  let component: BaseDetailHeaderComponent;
  let fixture: ComponentFixture<BaseDetailHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseDetailHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseDetailHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
