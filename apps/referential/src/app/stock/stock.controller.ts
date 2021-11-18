import { Stock } from '../entities/stock';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovementDto, StockProductDto } from '@log/contracts';
import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Controller('stock')
export class StockController {
  constructor (@InjectModel(Stock.name) private stockModel: Model<Stock>, private readonly http: HttpService) {}

  @Get()
  public async stock(): Promise<StockProductDto[]> {
    const allProductsFromDb = await this.stockModel.find().exec();
    return allProductsFromDb.map(p => ({productId: p.productId, quantity: p.available, reserved: p.reserved}));
  }


  @Post(":id/movement")
  public async updateStock(@Param('id') id: string, @Body() stockMovement: StockMovementDto) {
    const existingStock = await this.stockModel.findOne({productId: id}).exec();
    if (existingStock && stockMovement.status === 'Supply') {   
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
        existingStock.available -= stockMovement.quantity;
        existingStock.reserved += stockMovement.quantity;
        await existingStock.save();
        if (existingStock.available == 0) {
          const res = await lastValueFrom(this.http.get(`https://fhemery-logistics.herokuapp.com/api/products/${existingStock.productId}`).pipe(
            map(resp => resp.data)
          ));
          const data = {
            ean: res.ean
          }
          this.http.post(`https://fhemery-logistics.herokuapp.com/api/supply-request`, data);
        }
        return {
          "status_code": 204,
          "message": "Produits réservés.",
          "data": existingStock.available + " produits disponibles restants"
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
