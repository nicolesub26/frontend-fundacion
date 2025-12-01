import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDonacionComponent } from './tipo-donacion.component';

describe('TipoDonacionComponent', () => {
  let component: TipoDonacionComponent;
  let fixture: ComponentFixture<TipoDonacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoDonacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoDonacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
