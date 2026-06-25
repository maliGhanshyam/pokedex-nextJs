import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GuestAction } from './guest.constants';

export type GuestActivityDocument = HydratedDocument<GuestActivity>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'guest_activities' })
export class GuestActivity {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  action: GuestAction;

  createdAt?: Date;
}

export const GuestActivitySchema = SchemaFactory.createForClass(GuestActivity);
GuestActivitySchema.index({ userId: 1, action: 1 });
