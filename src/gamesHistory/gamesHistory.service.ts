import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from 'src/games/games.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GamesHistoryService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDroppedGames(userId: number) {
    const userInfo = await this.usersRepository.findOne({
      where: { id: userId },
    });
    console.log(userInfo);
    return userInfo.gamesHistory;
  }

  async createDroppedGame(userId: number, gameId: number) {
    const updatedUser = await this.usersRepository
      .createQueryBuilder('users')
      .relation(User, 'gamesHistory')
      .of(userId)
      .add(gameId);

    console.log(updatedUser);
    return updatedUser;
  }
}
