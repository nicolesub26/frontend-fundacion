import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadoFromComponent } from './empleado-from.component';

describe('EmpleadoFromComponent', () => {
  let component: EmpleadoFromComponent;
  let fixture: ComponentFixture<EmpleadoFromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadoFromComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpleadoFromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
