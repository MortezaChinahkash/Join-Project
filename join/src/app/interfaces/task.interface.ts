export interface Task {
  id?: string; // Optional, da Firebase die ID automatisch generiert
  title: string;
  description: string;
  dueDate: string;
  priority: 'urgent' | 'medium' | 'low' | '';
  assignedTo: string[]; // Array für mehrere Kontakte
  category: 'technical' | 'user-story' | '';
  subtasks: Subtask[];
  createdAt: Date;
  column: TaskColumn; // ← NEU: Spalten-Information
}

export interface Subtask {
  id?: string; // Optional, da Firebase die ID automatisch generiert
  title: string;
  completed: boolean;
}

export type TaskColumn = 'todo' | 'inprogress' | 'awaiting' | 'done';
