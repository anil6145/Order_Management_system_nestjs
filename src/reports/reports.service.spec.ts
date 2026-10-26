import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockDataSource = {
    query: vi.fn(),
    createQueryRunner: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});