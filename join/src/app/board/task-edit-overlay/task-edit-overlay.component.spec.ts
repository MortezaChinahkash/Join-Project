import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskEditOverlayComponent } from './task-edit-overlay.component';
describe('TaskEditOverlayComponent', () => {
  let component: TaskEditOverlayComponent;
  let fixture: ComponentFixture<TaskEditOverlayComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskEditOverlayComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(TaskEditOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
