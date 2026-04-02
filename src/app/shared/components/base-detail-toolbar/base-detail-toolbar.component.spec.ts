import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseDetailToolbarComponent } from './base-detail-toolbar.component';

describe('BaseDetailToolbarComponent', () => {
  let component: BaseDetailToolbarComponent;
  let fixture: ComponentFixture<BaseDetailToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseDetailToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseDetailToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
