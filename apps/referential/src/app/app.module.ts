import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PingController } from './ping/ping.controller';
import { StockController } from './stock/stock.controller';
import { environment } from '../environments/environment';
import { Stock, StockSchema } from './entities/stock';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forRoot(environment.mongoUrl),
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }])
  ],
  controllers: [AppController, PingController, StockController],
  providers: [AppService],
})
export class AppModule {}
