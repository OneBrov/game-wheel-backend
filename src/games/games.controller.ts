import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseArrayPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GameDto } from './dto/game.dto';
import { GamesService } from './games.service';

@Controller('/games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post('/')
  async createGame() {
    const game = await this.gamesService.loadGamePage(0);
    return game;
  }

  @Get('/tags')
  async getTags() {
    return await this.gamesService.getTags();
  }

  @Get('/genres')
  async getGenres() {
    return await this.gamesService.getGenres();
  }

  @Get('/publishers')
  async getPublishers() {
    return await this.gamesService.getPublishers();
  }

  @Get('/developers')
  async getDevelopers() {
    return await this.gamesService.getDevelopers();
  }

  @Get('/')
  async getGames(
    @Query('maxCount', new DefaultValuePipe(15)) maxCount: number,
    @Query('offset') offset: number,
    @Query('isRandom', new DefaultValuePipe(false)) isRandom: boolean,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('minMetascore') minMetascore: number,
    @Query('maxMetascore') maxMetascore: number,
    @Query('minRating') minRating: number,
    @Query('maxRating') maxRating: number,
    @Query('isFree') isFree: boolean,
    @Query('name') name: string,
    @Query('publisher', new ParseArrayPipe({ items: String, optional: true }))
    publishers: string[],
    @Query('developer', new ParseArrayPipe({ items: String, optional: true }))
    developers: string[],
    @Query('genre', new ParseArrayPipe({ items: String, optional: true }))
    genres: string[],
    @Query('tag', new ParseArrayPipe({ items: String, optional: true }))
    tags: string[],
  ) {
    console.log('____');

    console.log(maxCount);
    console.log(offset);
    const games = await this.gamesService.getGames({
      maxCount,
      minPrice,
      maxPrice,
      isFree,
      minMetascore,
      maxMetascore,
      minRating,
      maxRating,
      genres,
      tags,
      publishers,
      developers,
      name: name,
      isRandom,
      offset,
    });
    console.log(games.length);

    return games;
  }
}
