import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/** All fields optional; same validation rules as create. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
