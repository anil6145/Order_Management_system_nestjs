import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { DataSource } from 'typeorm';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: DataSource,
          useValue: {
            transaction: vi.fn(),
            getRepository: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

