import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonacionEfectivoComponent } from './donacion-efectivo.component';

describe('DonacionEfectivoComponent', () => {
  let component: DonacionEfectivoComponent;
  let fixture: ComponentFixture<DonacionEfectivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonacionEfectivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonacionEfectivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
