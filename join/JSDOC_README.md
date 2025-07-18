# 📚 JSDoc Documentation Guide - Join Project

## 🎯 Overview

This guide outlines the JSDoc documentation standards and practices used throughout the Join project. Comprehensive JSDoc comments ensure maintainable, readable, and well-documented code for all team members.

---

## 📋 JSDoc Standards

### 🔧 Basic JSDoc Structure

```typescript
/**
 * Brief description of the function/class/method.
 * More detailed description if needed, explaining the purpose,
 * behavior, and any important implementation details.
 * 
 * @param {Type} paramName - Description of the parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Usage example
 * const result = functionName(param1, param2);
 * 
 * @since 1.0.0
 * @author Morteza Chinahkash, Daniel Grabowski, Joshua Brunke, Gary Angelone
 */
```

### 🏷️ Required Tags

#### For All Functions/Methods
- `@param` - Document all parameters
- `@returns` - Document return value (use `@returns {void}` for void functions)
- `@throws` - Document exceptions that may be thrown

#### For Classes
- `@class` or `@constructor` - Mark as class/constructor
- `@implements` - Interfaces implemented
- `@extends` - Parent class extended

#### For Services
- `@service` - Mark as Angular service
- `@injectable` - Mark as injectable dependency

#### For Components
- `@component` - Mark as Angular component
- `@selector` - Component selector
- `@templateUrl` - Template file path
- `@styleUrls` - Style file paths

---

## 🎨 Component Documentation Examples

### Angular Component Example
```typescript
/**
 * Main board component for task management with drag & drop functionality.
 * Provides a Kanban-style interface for organizing tasks across different columns.
 * Supports both desktop and mobile interactions with responsive design.
 * 
 * @component
 * @selector app-board
 * @templateUrl ./board.component.html
 * @styleUrls ./board.component.scss
 * 
 * @example
 * <!-- Basic usage -->
 * <app-board></app-board>
 * 
 * @author Morteza Chinahkash, Daniel Grabowski, Joshua Brunke, Gary Angelone
 * @since 1.0.0
 */
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  
  /**
   * Array of tasks currently displayed on the board.
   * Updated in real-time through Firebase subscriptions.
   * 
   * @type {Task[]}
   * @memberof BoardComponent
   */
  tasks: Task[] = [];

  /**
   * Handles task mouse down events for drag & drop initiation.
   * Delegates to the drag & drop service for desktop interactions.
   * 
   * @param {MouseEvent} event - The mouse down event
   * @param {Task} task - The task being interacted with
   * @returns {Promise<boolean>} True if drag was initiated, false if click
   * 
   * @example
   * // Called from template
   * <div (mousedown)="onTaskMouseDown($event, task)">
   * 
   * @memberof BoardComponent
   */
  async onTaskMouseDown(event: MouseEvent, task: Task): Promise<boolean> {
    return this.dragDropService.onTaskMouseDown(event, task, () => this.loadTasks());
  }
}
```

---

## 🔧 Service Documentation Examples

### Angular Service Example
```typescript
/**
 * Service for managing task operations including CRUD operations,
 * drag & drop functionality, and Firebase integration.
 * Provides centralized task management for the entire application.
 * 
 * @service
 * @injectable
 * @providedIn 'root'
 * 
 * @example
 * // Inject into component
 * constructor(private taskService: TaskService) {}
 * 
 * // Create new task
 * const newTask = this.taskService.addTask(taskData, 'todo');
 * 
 * @author Morteza Chinahkash, Daniel Grabowski, Joshua Brunke, Gary Angelone
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  /**
   * Creates a new task and adds it to the specified column.
   * Automatically generates ID and creation timestamp.
   * 
   * @param {Omit<Task, 'id' | 'createdAt'>} task - Task data without ID and timestamp
   * @param {TaskColumn} column - Target column for the new task
   * @returns {Task} The created task with generated ID and timestamp
   * 
   * @throws {Error} When task data is invalid or column doesn't exist
   * 
   * @example
   * const taskData = {
   *   title: 'New Task',
   *   description: 'Task description',
   *   priority: 'medium',
   *   assignedContacts: [],
   *   subtasks: []
   * };
   * const newTask = this.addTask(taskData, 'todo');
   * 
   * @memberof TaskService
   */
  addTask(task: Omit<Task, 'id' | 'createdAt'>, column: TaskColumn): Task {
    const newTask = this.createNewTask(task);
    this.tasks[column].push(newTask);
    return newTask;
  }

  /**
   * Updates an existing task with new data.
   * Searches across all columns to find and update the task.
   * 
   * @param {string} taskId - Unique identifier of the task to update
   * @param {Partial<Task>} updatedTask - Partial task data for update
   * @returns {boolean} True if task was found and updated, false otherwise
   * 
   * @example
   * const success = this.updateTask('task-123', { 
   *   title: 'Updated Title',
   *   priority: 'high' 
   * });
   * 
   * @memberof TaskService
   */
  updateTask(taskId: string, updatedTask: Partial<Task>): boolean {
    for (const column of Object.keys(this.tasks) as TaskColumn[]) {
      const success = this.updateTaskInColumn(column, taskId, updatedTask);
      if (success) return true;
    }
    return false;
  }
}
```

---

## 🎯 Interface Documentation Examples

### TypeScript Interface Example
```typescript
/**
 * Represents a task in the Kanban board system.
 * Contains all necessary information for task management,
 * including metadata, assignment, and progress tracking.
 * 
 * @interface Task
 * 
 * @example
 * const task: Task = {
 *   id: 'task-123',
 *   title: 'Implement feature',
 *   description: 'Add new functionality',
 *   priority: 'high',
 *   column: 'inprogress',
 *   createdAt: new Date(),
 *   assignedContacts: ['contact-1'],
 *   subtasks: []
 * };
 * 
 * @author Team
 * @since 1.0.0
 */
export interface Task {
  /**
   * Unique identifier for the task.
   * Generated automatically when task is created.
   * 
   * @type {string}
   */
  id?: string;

  /**
   * Display title of the task.
   * Should be concise but descriptive.
   * 
   * @type {string}
   */
  title: string;

  /**
   * Detailed description of the task.
   * Optional field for additional context.
   * 
   * @type {string}
   * @optional
   */
  description?: string;

  /**
   * Priority level of the task.
   * Affects visual styling and sorting.
   * 
   * @type {'low' | 'medium' | 'high' | 'urgent'}
   * @default 'medium'
   */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Current column/status of the task.
   * Determines task position on the board.
   * 
   * @type {TaskColumn}
   */
  column: TaskColumn;

  /**
   * Timestamp when the task was created.
   * Used for sorting and tracking.
   * 
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Array of contact IDs assigned to this task.
   * References contacts from the contact management system.
   * 
   * @type {string[]}
   * @default []
   */
  assignedContacts: string[];

  /**
   * Array of subtasks for breaking down the main task.
   * Each subtask can be marked as completed independently.
   * 
   * @type {Subtask[]}
   * @default []
   */
  subtasks: Subtask[];
}
```

---

## 🚀 Advanced JSDoc Patterns

### Event Handler Documentation
```typescript
/**
 * Handles drag start events for task elements.
 * Initializes drag state and creates visual feedback.
 * 
 * @param {DragEvent} event - The drag start event
 * @param {Task} task - The task being dragged
 * @returns {void}
 * 
 * @fires TaskService#taskDragStart - When drag operation begins
 * @listens element:dragstart - Responds to HTML5 drag start events
 * 
 * @example
 * // Template usage
 * <div draggable="true" (dragstart)="onDragStart($event, task)">
 * 
 * @memberof BoardComponent
 */
onDragStart(event: DragEvent, task: Task): void {
  // Implementation
}
```

### Async Method Documentation
```typescript
/**
 * Asynchronously loads tasks from Firebase backend.
 * Updates local task arrays and triggers change detection.
 * Handles loading states and error scenarios.
 * 
 * @async
 * @returns {Promise<void>} Resolves when tasks are loaded
 * @throws {FirebaseError} When Firebase operation fails
 * @throws {NetworkError} When network connection is unavailable
 * 
 * @example
 * try {
 *   await this.loadTasksFromFirebase();
 *   console.log('Tasks loaded successfully');
 * } catch (error) {
 *   console.error('Failed to load tasks:', error);
 * }
 * 
 * @memberof TaskService
 */
async loadTasksFromFirebase(): Promise<void> {
  // Implementation
}
```

### Observable Documentation
```typescript
/**
 * Observable stream of current user authentication state.
 * Emits user object when logged in, null when logged out.
 * Updates automatically when authentication state changes.
 * 
 * @type {Observable<User | null>}
 * @readonly
 * 
 * @example
 * // Subscribe to auth state changes
 * this.authService.currentUser$.subscribe(user => {
 *   if (user) {
 *     console.log('User logged in:', user.displayName);
 *   } else {
 *     console.log('User logged out');
 *   }
 * });
 * 
 * @memberof AuthService
 */
readonly currentUser$: Observable<User | null>;
```

---

## 🎨 Template and Style Documentation

### Component Template Documentation
```html
<!-- 
  Main task card template for displaying individual tasks.
  Supports drag & drop interactions and responsive design.
  
  @template TaskCard
  @param {Task} task - The task data to display
  @param {boolean} isDragging - Whether task is currently being dragged
  
  @example
  <app-task-card 
    [task]="task" 
    [isDragging]="dragState.isDraggingTask"
    (taskClick)="onTaskClick($event)"
    (taskMouseDown)="onTaskMouseDown($event, task)">
  </app-task-card>
-->
<div class="task-card" 
     [class.dragging]="isDragging"
     (click)="onTaskClick()"
     (mousedown)="onTaskMouseDown($event)">
  
  <!-- Task content -->
  <div class="task-content">
    <h3 class="task-title">{{ task.title }}</h3>
    <p class="task-description" *ngIf="task.description">
      {{ task.description }}
    </p>
  </div>
</div>
```

### SCSS Documentation
```scss
/**
 * Styles for task card component.
 * Provides responsive design and drag & drop visual feedback.
 * 
 * @stylesheet TaskCard
 * @responsive true
 * @supports drag-and-drop
 * 
 * @author Morteza Chinahkash, Daniel Grabowski, Joshua Brunke, Gary Angelone
 * @since 1.0.0
 */

/**
 * Main task card container.
 * Base styles for all task cards on the board.
 * 
 * @selector .task-card
 */
.task-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  /**
   * Hover state for task cards.
   * Provides visual feedback on interaction.
   */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /**
   * Dragging state for task cards.
   * Applied when task is being dragged.
   */
  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
}
```

---

## 🔍 JSDoc Generation and Tools

### Installation
```bash
# Install JSDoc globally
npm install -g jsdoc

# Install JSDoc for TypeScript
npm install --save-dev typedoc
```

### Configuration
```json
// jsdoc.conf.json
{
  "source": {
    "include": ["./src"],
    "includePattern": "\\.(js|ts)$",
    "exclude": ["node_modules/"]
  },
  "opts": {
    "destination": "./docs/",
    "recurse": true
  },
  "plugins": ["plugins/markdown"]
}
```

### Generation Commands
```bash
# Generate JSDoc documentation
jsdoc -c jsdoc.conf.json

# Generate TypeDoc documentation
typedoc --out docs src

# Generate with custom theme
typedoc --theme minimal --out docs src
```

---

## 📊 Documentation Coverage

### Current Coverage Status
- **Services**: 95% documented
- **Components**: 90% documented  
- **Interfaces**: 100% documented
- **Utilities**: 85% documented

### Coverage Goals
- [ ] Achieve 100% JSDoc coverage for all public methods
- [ ] Document all component inputs and outputs
- [ ] Add usage examples for all services
- [ ] Document error scenarios and edge cases

---

## ✅ JSDoc Best Practices

### DO's ✅
- **Be Descriptive**: Write clear, concise descriptions
- **Include Examples**: Provide usage examples for complex functions
- **Document Parameters**: Always document all parameters and return values
- **Use Proper Types**: Specify accurate TypeScript types
- **Update Regularly**: Keep documentation in sync with code changes
- **Document Edge Cases**: Explain error conditions and unusual behavior

### DON'Ts ❌
- **Don't State Obvious**: Avoid documenting self-explanatory code
- **Don't Use Placeholder Text**: Remove TODO or placeholder comments
- **Don't Over-Document**: Focus on public APIs and complex logic
- **Don't Forget Maintenance**: Update docs when code changes
- **Don't Use Vague Descriptions**: Be specific about behavior and purpose

---

## 🔧 IDE Integration

### VS Code Extensions
- **JSDoc Generator**: Automatically generates JSDoc templates
- **TypeScript Importer**: Auto-imports and documents dependencies
- **Document This**: Quick JSDoc generation for TypeScript

### Configuration
```json
// VS Code settings.json
{
  "typescript.suggest.jsdoc": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.quickSuggestions": {
    "comments": true
  }
}
```

---

## 📈 Documentation Metrics

### Quality Indicators
- **Coverage Percentage**: % of public methods documented
- **Example Completeness**: Methods with usage examples
- **Type Accuracy**: Correct TypeScript type annotations
- **Link Validity**: Internal documentation links work correctly

### Review Checklist
- [ ] All public methods have JSDoc comments
- [ ] Parameters and return values documented
- [ ] Complex logic has explanatory comments
- [ ] Examples provided for non-trivial functions
- [ ] Error scenarios documented
- [ ] Types are accurate and up-to-date

---

## 🚀 Future Documentation Plans

### Planned Improvements
- **Interactive Examples**: Add live code examples
- **API Documentation Site**: Generate public documentation website
- **Video Tutorials**: Screen recordings for complex features
- **Architecture Diagrams**: Visual system architecture documentation

### Tools Integration
- **Automated Generation**: CI/CD pipeline documentation builds
- **Coverage Reports**: Automated documentation coverage reporting
- **Link Checking**: Automated validation of documentation links

---

*Last Updated: July 19, 2025*
*JSDoc Standards Version: 1.0*
*Maintained by: Morteza Chinahkash, Daniel Grabowski, Joshua Brunke, Gary Angelone*
