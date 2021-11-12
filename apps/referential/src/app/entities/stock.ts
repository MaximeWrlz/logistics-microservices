import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StockDocument = Stock & Document;

@Schema()
export class Stock {
  @Prop()
  productId: string;

  @Prop()
  available: number;
    
  @Prop()
  reserved: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);