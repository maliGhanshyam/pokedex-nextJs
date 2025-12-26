import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleService } from './battle.service';
import { BattleController } from './battle.controller';
import { Battle } from '../entities/battle.entity';
import { Pokemon } from '../entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Battle, Pokemon])],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}

