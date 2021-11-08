import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop()
  ean: string;

  @Prop()
  name: string;

  @Prop([String])
  categories: string[]

  @Prop()
  description: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
