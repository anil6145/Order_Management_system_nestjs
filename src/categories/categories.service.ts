import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {

    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository : Repository<Category>
    ){}

    async getAllCategories(){
        return this.categoriesRepository.find({
            order : {name : 'ASC'}
        })
    }

    async createCategory(createCategoryDto : CreateCategoryDto){
        const name = createCategoryDto.name.trim();

        const existingCategory = await this.categoriesRepository.findOne({
            where : {name}
        });

        if(existingCategory) {
            throw new ConflictException ('Category name already exists',);
        }

        const category = this.categoriesRepository.create({
            name
        });

        return this.categoriesRepository.save(category)
    }
}
