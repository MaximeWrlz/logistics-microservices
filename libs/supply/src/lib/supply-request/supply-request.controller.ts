import { Body, Controller, Get, Post } from '@nestjs/common';
import { SupplyRequestDto } from '@log/contracts';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SupplyRequest,
  SupplyRequestDocument,
} from './entities/supply-request';

@Controller('supply-request')
export class SupplyRequestController {
  constructor(
    @InjectModel(SupplyRequest.name)
    private supplyRequestDocumentModel: Model<SupplyRequestDocument>
  ) {}

  // @Post()
  // public async add(@Body() supplyRequest: SupplyRequestDto): Promise<void> {
  //   const newRequest = new this.supplyRequestDocumentModel(supplyRequest);
  //   await newRequest.save();
  // }

  // @Get()
  // public async getAll(): Promise<SupplyRequestDto[]> {
  //   return await this.supplyRequestDocumentModel.find().exec();
  // }
}
