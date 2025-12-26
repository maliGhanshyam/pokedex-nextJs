import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { Pokemon } from '../entities/pokemon.entity';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { PokemonSyncService } from './pokemon-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pokemon]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PokemonController],
  providers: [PokemonService, PokemonSyncService],
  exports: [PokemonService, PokemonSyncService],
})
export class PokemonModule {}

