import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonacionArticuloComponent } from './donacion-articulo.component';

describe('DonacionArticuloComponent', () => {
  let component: DonacionArticuloComponent;
  let fixture: ComponentFixture<DonacionArticuloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonacionArticuloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonacionArticuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
