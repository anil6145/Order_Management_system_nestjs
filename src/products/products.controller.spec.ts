
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { AuditService } from '../audit/audit/audit-queue.service.js';
import { RedisCacheService } from '../redis-cache/redis-cache.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            createProduct: vi.fn(),
            getAllProducts: vi.fn(),
            getProduct: vi.fn(),
            updateProduct: vi.fn(),
            removeProduct: vi.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {},
        },
        {
    provide: RedisCacheService,
    useValue: {},
  },

      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
