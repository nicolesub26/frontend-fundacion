import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonacionReportesComponent } from './donacion-reportes.component';

describe('DonacionReportesComponent', () => {
  let component: DonacionReportesComponent;
  let fixture: ComponentFixture<DonacionReportesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonacionReportesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonacionReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
