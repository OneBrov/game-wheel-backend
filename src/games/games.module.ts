import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games.controller';
import {
  Developer,
  Game,
  Genre,
  Language,
  Publisher,
  Tag,
} from './games.entity';
import { GamesService } from './games.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    TypeOrmModule.forFeature([Genre]),
    TypeOrmModule.forFeature([Tag]),
    TypeOrmModule.forFeature([Publisher]),
    TypeOrmModule.forFeature([Developer]),
    TypeOrmModule.forFeature([Language]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [GamesService],
  controllers: [GamesController],
})
export class GamesModule {}
