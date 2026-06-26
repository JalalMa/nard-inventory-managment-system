import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeModule } from '../realtime/realtime.module';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem]), RealtimeModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, TypeOrmModule],
})
export class SalesModule {}
