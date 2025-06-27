export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'urgent' | 'medium' | 'low' | '';
  assignedTo: string;
  category: 'technical' | 'user-story' | '';
  subtasks: Subtask[];
  createdAt: Date;
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export type TaskColumn = 'todo' | 'inprogress' | 'awaiting' | 'done';
