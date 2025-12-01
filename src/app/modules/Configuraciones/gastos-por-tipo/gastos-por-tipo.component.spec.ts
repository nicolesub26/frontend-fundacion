import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastosPorTipoComponent } from './gastos-por-tipo.component';

describe('GastosPorTipoComponent', () => {
  let component: GastosPorTipoComponent;
  let fixture: ComponentFixture<GastosPorTipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastosPorTipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastosPorTipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
