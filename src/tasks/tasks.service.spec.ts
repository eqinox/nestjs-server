import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { TaskStatus } from './task-status.enum';

const mockUser = { id: '1', username: 'TestUser' } as User;

const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test Desc',
    status: TaskStatus.OPEN,
    user: mockUser,
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Another Desc',
    status: TaskStatus.DONE,
    user: mockUser,
  },
];

describe('TasksService - getTasks', () => {
  let tasksService: TasksService;
  let taskRepository: Repository<Task>;

  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Desc',
    status: TaskStatus.OPEN,
    user: mockUser,
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
            findOne: jest.fn().mockResolvedValue(mockTask),
          },
        },
      ],
    }).compile();

    tasksService = moduleRef.get<TasksService>(TasksService);
    taskRepository = moduleRef.get<Repository<Task>>(getRepositoryToken(Task));
  });

  const queryBuilder: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockTasks),
  };

  describe('getTasks', () => {
    it('calls TasksRepository.getTasks and returns the result', async () => {
      jest.spyOn(tasksService, 'getTasks');
      const filterDto = { status: TaskStatus.OPEN, search: 'test' };
      const result = await tasksService.getTasks(filterDto, mockUser);
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getTaskById', () => {
    it('calls TasksRepository.findOne and returns the result', async () => {
      const result = await tasksService.getTaskById('1', mockUser);
      expect(result).toEqual(mockTask);
    });

    it('throws an error if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);
      await expect(tasksService.getTaskById('999', mockUser)).rejects.toThrow();
    });
  });
});

