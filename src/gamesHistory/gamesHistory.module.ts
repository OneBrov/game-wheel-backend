import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from 'src/games/games.module';
import { User } from 'src/users/user.entity';
import { GamesHistoryController } from './gamesHistory.controller';
import { GamesHistoryService } from './gamesHistory.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [GamesHistoryService],
  controllers: [GamesHistoryController],
})
export class GamesHistoryModule {}
