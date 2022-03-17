import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtAuthGuard } from 'src/users/jwt-auth.guard';
import { GamesHistoryService } from './gamesHistory.service';

@Controller('/history')
export class GamesHistoryController {
  constructor(private readonly gamesHistoryService: GamesHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getDroppedGames(@Req() req: any) {
    const user = req.user as UserDto;
    return await this.gamesHistoryService.getDroppedGames(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async createDroppedGame(@Body() { gameId }, @Req() req: any) {
    const user = req.user as UserDto;
    console.log(gameId);
    return await this.gamesHistoryService.createDroppedGame(user.id, gameId);
  }
}
