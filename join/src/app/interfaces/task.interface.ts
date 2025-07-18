export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'urgent' | 'medium' | 'low' | '';
  assignedTo: string[];
  category: 'technical' | 'user-story' | '';
  subtasks: Subtask[];
  createdAt: Date;
  column: TaskColumn;
}

export interface Subtask {
  id?: string;
  title: string;
  completed: boolean;
}

export type TaskColumn = 'todo' | 'inprogress' | 'awaiting' | 'done';
