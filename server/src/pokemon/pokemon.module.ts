import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { PokemonSyncService } from './pokemon-sync.service';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pokemon.name, schema: PokemonSchema }]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PokemonController],
  providers: [PokemonService, PokemonSyncService],
  exports: [PokemonService, PokemonSyncService],
})
export class PokemonModule {}
