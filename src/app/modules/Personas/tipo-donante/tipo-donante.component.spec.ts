import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDonanteComponent } from './tipo-donante.component';

describe('TipoDonanteComponent', () => {
  let component: TipoDonanteComponent;
  let fixture: ComponentFixture<TipoDonanteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoDonanteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoDonanteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
