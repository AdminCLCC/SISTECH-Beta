import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkOrderSparePartDto } from './create-work-order-spare-part.dto';

export class UpdateWorkOrderSparePartDto extends PartialType(CreateWorkOrderSparePartDto) {}
