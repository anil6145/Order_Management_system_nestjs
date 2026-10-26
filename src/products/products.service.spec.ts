
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';
import { AuditService } from '../audit/audit/audit-queue.service.js';


describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            remove: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: vi.fn(),
            transaction: vi.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
