import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PokemonDocument = HydratedDocument<Pokemon>;

@Schema({ timestamps: true, collection: 'pokemon' })
export class Pokemon {
  @Prop({ required: true, unique: true, index: true })
  id: number;

  @Prop({ required: true, unique: true, lowercase: true })
  name: string;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  weight: number;

  @Prop({ type: [Object], default: [] })
  stats: {
    base_stat: number;
    effort: number;
    stat: { name: string };
  }[];

  @Prop({ type: [Object], default: [] })
  types: { type: { name: string } }[];

  @Prop({ default: '' })
  sprite: string;

  @Prop({ type: Object })
  sprites: {
    front_default: string;
    other: {
      ['official-artwork']: {
        front_default: string;
        front_shiny: string;
      };
    };
  };

  @Prop({ type: [Object], default: [] })
  abilities: { ability: { name: string } }[];

  @Prop({ type: Object })
  species: { name: string };

  createdAt?: Date;
  updatedAt?: Date;
}

export const PokemonSchema = SchemaFactory.createForClass(Pokemon);
