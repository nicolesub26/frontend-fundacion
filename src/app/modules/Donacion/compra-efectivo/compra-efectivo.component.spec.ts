import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraEfectivoComponent } from './compra-efectivo.component';

describe('CompraEfectivoComponent', () => {
  let component: CompraEfectivoComponent;
  let fixture: ComponentFixture<CompraEfectivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraEfectivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraEfectivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
