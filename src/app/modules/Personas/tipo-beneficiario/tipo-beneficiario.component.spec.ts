import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoBeneficiarioComponent } from './tipo-beneficiario.component';

describe('TipoBeneficiarioComponent', () => {
  let component: TipoBeneficiarioComponent;
  let fixture: ComponentFixture<TipoBeneficiarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoBeneficiarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoBeneficiarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
