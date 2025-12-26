import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PokemonModule } from '../pokemon/pokemon.module';

@Module({
  imports: [PokemonModule],
  controllers: [AdminController],
})
export class AdminModule {}

