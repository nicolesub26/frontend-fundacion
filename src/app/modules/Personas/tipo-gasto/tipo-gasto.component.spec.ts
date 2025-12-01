import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoGastoComponent } from './tipo-gasto.component';

describe('TipoGastoComponent', () => {
  let component: TipoGastoComponent;
  let fixture: ComponentFixture<TipoGastoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoGastoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoGastoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
