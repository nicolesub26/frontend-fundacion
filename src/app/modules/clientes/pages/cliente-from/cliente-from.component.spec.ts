import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteFromComponent } from './cliente-from.component';

describe('ClienteFromComponent', () => {
  let component: ClienteFromComponent;
  let fixture: ComponentFixture<ClienteFromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteFromComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteFromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
