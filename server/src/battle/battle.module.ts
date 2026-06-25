import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { Battle, BattleSchema } from '../entities/battle.entity';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Battle.name, schema: BattleSchema },
      { name: Pokemon.name, schema: PokemonSchema },
    ]),
  ],
  controllers: [BattleController],
  providers: [BattleService],
})
export class BattleModule {}
