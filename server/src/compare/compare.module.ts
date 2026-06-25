import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pokemon.name, schema: PokemonSchema }]),
  ],
  controllers: [CompareController],
  providers: [CompareService],
})
export class CompareModule {}
