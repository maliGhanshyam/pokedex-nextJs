import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FavoritePokemonDocument = HydratedDocument<FavoritePokemon>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'favorite_pokemon' })
export class FavoritePokemon {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  pokemonId: number;

  createdAt?: Date;
}

export const FavoritePokemonSchema = SchemaFactory.createForClass(FavoritePokemon);
FavoritePokemonSchema.index({ userId: 1, pokemonId: 1 }, { unique: true });
