import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { AuditService } from '../audit/audit/audit-queue.service.js';

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            createOrder: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            updateStatus: vi.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});