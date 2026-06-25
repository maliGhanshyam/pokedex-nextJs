import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactDocument = HydratedDocument<Contact>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'contacts' })
export class Contact {
  id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  mobile: string;

  @Prop({ required: true })
  message: string;

  createdAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
