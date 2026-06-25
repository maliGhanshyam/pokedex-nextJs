import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BattleDocument = HydratedDocument<Battle>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'battles' })
export class Battle {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  pokemon1Id: number;

  @Prop({ required: true })
  pokemon2Id: number;

  @Prop({ required: true })
  winnerId: number;

  @Prop({ type: [Object], default: [] })
  battleLog: any[];

  @Prop({ required: true })
  turns: number;

  createdAt?: Date;
}

export const BattleSchema = SchemaFactory.createForClass(Battle);
