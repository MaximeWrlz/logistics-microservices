import { Controller, Get, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../clients/entities/order';

@Controller('client-orders')
export class ClientOrdersController {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>
  ) {}

  // @Post(':id')
  // public async add(@Param('id') id: string): Promise<void> {
  //   const doc = new this.orderModel({ reference: id });
  //   await doc.save();
  // }

  // @Get()
  // public async getAll(): Promise<{ reference: string }[]> {
  //   return await this.orderModel.find().exec();
  // }
}
