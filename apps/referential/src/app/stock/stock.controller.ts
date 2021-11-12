import { Stock, StockDocument } from '../entities/stock';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiOperation } from '@nestjs/swagger';
import { StockDto } from '../dtos';
import { StockMovementDto, StockProductDto } from '@log/contracts';


// c la mer noire ce fichier

@Controller('stock')
export class StockController {
  constructor (@InjectModel(Stock.name) private stockModel: Model<Stock>) {}

  @Get()
  public async stock(): Promise<StockProductDto[]> {
    const allProductsFromDb = await this.stockModel.find().exec();
    return allProductsFromDb.map(p => ({productId: p.productId, quantity: p.available}));
  }
  
  // @Get('products') 
  // @ApiOperation({ summary: "call all stocks"})
  // public async stocks(): Promise<StockDto> {
  //   return this.stockModel.find().exec();
  // }

  // @Get('products/:id')
  // @ApiOperation({ summary: "Get on product by his id"})
  // public async findOne(@Param('id') id: string): Promise<StockDto> {
  //   return await this.stockModel.findById(id).exec();
  // }

  @Post(":id/movement")
  public async updateStock(@Param('id') id: string, @Body() stockMovement: StockMovementDto) {
    // We assume we already know the product in catalog
    // We assume also that stockMovement.type == Supply

    const existingStock = await this.stockModel.findOne({productId: id}).exec();
    if (existingStock) {
      console.log('Found the product');
      existingStock.available += stockMovement.quantity
      await existingStock.save();
    } else {
      console.log('Did not find the product, adding it', stockMovement);
      const newObject = new this.stockModel({productId: id, available: stockMovement.quantity, reserved: 0} as Stock)
      await newObject.save();
    }
  }
}
