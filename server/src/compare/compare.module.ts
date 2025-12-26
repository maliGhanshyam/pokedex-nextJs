import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompareService } from './compare.service';
import { CompareController } from './compare.controller';
import { Pokemon } from '../entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon])],
  controllers: [CompareController],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}

