import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { GamesModule } from './games/games.module';
import { GamesHistoryModule } from './gamesHistory/gamesHistory.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(
    //   {
    //   url: process.env.DATABASE_URL,
    //   type: 'postgres',
    //   name: 'default',
    //   logging: false,
    //   ssl: {
    //     rejectUnauthorized: false,
    //   },
    //   entities: ['dist/**/*.entity.js'],
    //   synchronize: true, // This for development
    //   autoLoadEntities: true,
    // }
    ),
    UsersModule,
    GamesModule,
    GamesHistoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
