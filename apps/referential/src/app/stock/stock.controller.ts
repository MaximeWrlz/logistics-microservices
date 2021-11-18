import { Stock } from '../entities/stock';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovementDto, StockProductDto } from '@log/contracts';

@Controller('stock')
export class StockController {
  constructor (@InjectModel(Stock.name) private stockModel: Model<Stock>) {}

  @Get()
  public async stock(): Promise<StockProductDto[]> {
    const allProductsFromDb = await this.stockModel.find().exec();
    return allProductsFromDb.map(p => ({productId: p.productId, quantity: p.available, reserved: p.reserved}));
  }


  @Post(":id/movement")
  public async updateStock(@Param('id') id: string, @Body() stockMovement: StockMovementDto, res) {
    // We assume we already know the product in catalog

    const existingStock = await this.stockModel.findOne({productId: id}).exec();
    if (existingStock && stockMovement.status === 'Supply') {
      console.log('Found the product');      
      existingStock.available += stockMovement.quantity;
      await existingStock.save();      
    } else if (existingStock && stockMovement.status === 'Reserve') {
      if (stockMovement.quantity > existingStock.available) {
        return {
          "status_code": 400,
          "message": "Il n'y a plus assez de stock sur ce produit !",
          "data": existingStock.available + " produits disponibles restants."
        };
      } else {
        console.log('Reserved the product');
        existingStock.available -= stockMovement.quantity;
        existingStock.reserved += stockMovement.quantity;
        await existingStock.save();
        return {
          "status_code": 204,
          "message": "Produits réservés.",
          "data": existingStock.available + " produits disponibles restants",
        };
      }
    } else if (existingStock && stockMovement.status === 'Removal') {
      if (stockMovement.quantity > existingStock.reserved) {
        return {
          "status_code": 400,
          "message": "Le stock de produits reservés n'est pas suffisant !",
          "data": existingStock.reserved + " produits reservés restants."
        };
      } else {
        existingStock.reserved -= stockMovement.quantity;
        await existingStock.save();
        return {
          "status_code": 204,
          "message": "Produits envoyé à la livraison.",
        };
      }
    } else { 
      console.log('Did not find the product, adding it', stockMovement);
      const newObject = new this.stockModel({productId: id, available: stockMovement.quantity, reserved: 0} as Stock)
      await newObject.save();
    }
  }
}
