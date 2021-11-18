import { Stock } from '../entities/stock';
import { Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
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
    switch (stockMovement.status) {
      case "Supply":
        return this.Supply(id, existingStock, stockMovement);
      case "Reserve":
        return this.Reserve(existingStock, stockMovement);
      case "Removal":
        return this.Remove(existingStock, stockMovement);    
      default:
        break;
    }
  }

  public async Supply(id: string, existingStock: Document<unknown, unknown, Stock> & Stock & { _id: Types.ObjectId; }, stockMovement: StockMovementDto) {
    const existInCatalog = await lastValueFrom(this.http.get(`https://fhemery-logistics.herokuapp.com/api/products/${existingStock.productId}`).pipe(
      map(resp => resp.data)
    ));
    if (!existInCatalog) {
      return new HttpException("Le produit n'est pas répertorié dans le catalogue !", 400);
    }
    if (!existingStock) {
      const newObject = new this.stockModel({productId: id, available: stockMovement.quantity, reserved: 0} as Stock)
      await newObject.save();
      return 204;
    }
    existingStock.available += stockMovement.quantity;
    await existingStock.save();
    return 204;
  }

  public async Reserve(existingStock: Document<unknown, unknown, Stock> & Stock & { _id: Types.ObjectId; }, stockMovement: StockMovementDto) {
    if (stockMovement.quantity > existingStock.available) {
      return new HttpException(`Il n'y a plus assez de stock sur ce produit ! (${existingStock.available} produits disponibles restants)`, 400);
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
      return 204;
    }
  }

  public async Remove(existingStock: Document<unknown, unknown, Stock> & Stock & { _id: Types.ObjectId; }, stockMovement: StockMovementDto) {
    if (stockMovement.quantity > existingStock.reserved) {
      return new HttpException(`Le stock de produits reservés n'est pas suffisant ! (${existingStock.reserved} produits reservés restants)`, 400);
    } else {
      existingStock.reserved -= stockMovement.quantity;
      await existingStock.save();
      return 204;
    }
  }
}
