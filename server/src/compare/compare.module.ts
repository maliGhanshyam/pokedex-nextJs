import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';
import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pokemon.name, schema: PokemonSchema }]),
    GuestModule,
  ],
  controllers: [CompareController],
  providers: [CompareService],
})
export class CompareModule {}
