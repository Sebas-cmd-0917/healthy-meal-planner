import { Task } from '../../../domain/task/Task.js';
import { buildAll } from '../shared/batch.js';

export class CreateTasks {
  constructor({ taskRepository }) {
    this.taskRepository = taskRepository;
  }

  async execute(input) {
    const tasks = buildAll(input, (item) => new Task({ ...item, id: null, createdAt: null }), { label: 'Tarea' });
    return this.taskRepository.saveMany(tasks);
  }
}
