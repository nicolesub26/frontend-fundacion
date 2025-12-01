import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioRolComponent } from './usuario-rol.component';

describe('UsuarioRolComponent', () => {
  let component: UsuarioRolComponent;
  let fixture: ComponentFixture<UsuarioRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioRolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
