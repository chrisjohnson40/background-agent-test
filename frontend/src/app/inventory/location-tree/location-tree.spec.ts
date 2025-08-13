import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationTree } from './location-tree';

describe('LocationTree', () => {
  let component: LocationTree;
  let fixture: ComponentFixture<LocationTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationTree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
