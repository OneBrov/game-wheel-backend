import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { getManager, QueryBuilder, Repository } from 'typeorm';
import { GameDto, SteamGame, SteamSpyGame } from './dto/game.dto';
import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

import {
  Developer,
  Game,
  Genre,
  Language,
  Publisher,
  Tag,
} from './games.entity';
import { gameSettingDto } from './dto/gameSettings.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    @InjectRepository(Genre)
    private genresRepository: Repository<Genre>,
    @InjectRepository(Publisher)
    private publishersRepository: Repository<Publisher>,
    @InjectRepository(Developer)
    private developersRepository: Repository<Developer>,
    @InjectRepository(Language)
    private languagesRepository: Repository<Language>,
  ) {}
  private readonly hltbService = new HowLongToBeatService();

  async getGames(dto: gameSettingDto) {
    const suitableGames = getManager()
      .createQueryBuilder()
      .from((qb) => {
        if (dto.developers?.length > 0) {
          qb.andWhere('developer.name in (:...developers)', {
            developers: dto.developers,
          });
        }

        if (dto.publishers?.length > 0) {
          qb.andWhere('publisher.name in (:...publishers)', {
            publishers: dto.publishers,
          });
        }

        if (dto.tags?.length > 0) {
          qb.andWhere('tag.name in (:...tags)', {
            tags: dto.tags,
          });
        }

        if (dto.genres?.length > 0) {
          qb.andWhere('genre.name in (:...genres)', {
            genres: dto.genres,
          });
        }

        if (
          !dto.isFree &&
          dto.minPrice !== undefined &&
          dto.maxPrice !== undefined
        ) {
          qb.andWhere('game.price between :minPrice and :maxPrice', {
            minPrice: dto.minPrice,
            maxPrice: dto.maxPrice,
          });
        } else {
          qb.andWhere('game.price = 0');
        }

        if (dto.name && dto.name.length > 0) {
          qb.andWhere('game.name ~* :name', { name: dto.name });
        }

        qb.andWhere('game.metascore between :minMetascore and :maxMetascore', {
          minMetascore: dto.minMetascore,
          maxMetascore: dto.maxMetascore,
        });

        qb.andWhere('game.steamScore between :minRating and :maxRating', {
          minRating: dto.minRating,
          maxRating: dto.maxRating,
        });

        return qb
          .select('game.id')
          .distinct(true)
          .from(Game, 'game')
          .leftJoin('game.developers', 'developer')
          .leftJoin('game.publishers', 'publisher')
          .leftJoin('game.genres', 'genre')
          .leftJoin('game.tags', 'tag')
          .leftJoin('game.languages', 'language');
      }, 'g')
      .limit(dto.maxCount);

    if (dto.isRandom) {
      console.log('isRANDOM');

      suitableGames.orderBy('random()');
    }

    if (dto.offset) {
      suitableGames.offset(dto.offset);
    }

    const gameArrayIds = await suitableGames.getRawMany();
    const ids = gameArrayIds.map((row) => row.game_id);
    const gamesQuery = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.developers', 'developer')
      .leftJoinAndSelect('game.publishers', 'publisher')
      .leftJoinAndSelect('game.genres', 'genre')
      .leftJoinAndSelect('game.tags', 'tag')
      .leftJoinAndSelect('game.languages', 'language')
      .whereInIds(ids);
    return await gamesQuery.getMany();
  }

  async getTags() {
    return await this.tagsRepository.find();
  }

  async getGenres() {
    return await this.genresRepository.find();
  }

  async getPublishers() {
    return await this.publishersRepository.find();
  }

  async getDevelopers() {
    return await this.developersRepository.find();
  }

  @Cron('* * 240 * * *')
  async updateGameData() {
    await this.loadGamePage(0);
  }

  async loadGamePage(page: number): Promise<{ isSuccess: boolean }> {
    // const allGames = await this.getAllSteamGames();
    // console.log('games loaded');
    const allGames = await this.getSteamSpyPage(page);
    if (allGames?.length < 1) {
      return { isSuccess: false };
    }

    //Allowed poll rate - 1 request per second for most requests,
    // 1 request per 60 seconds for the *all* requests.
    let i = 0;
    const pendingInterval = setInterval(async () => {
      try {
        console.log(allGames[i].appid, allGames[i].name);
        const steamSpyGame = await this.getSteamSpyGame(allGames[i].appid);
        const hltbGame = await this.getHLTBGame(allGames[i].name);
        const steamGame = await this.getSteamGame(allGames[i].appid);

        if (steamGame?.type !== 'game') {
          throw new Error(`${steamGame?.name} is not a game`);
        }

        console.log(steamGame);
        console.log(steamSpyGame);
        console.log(hltbGame);

        if (
          !steamGame?.developers ||
          !steamGame?.publishers ||
          !steamGame?.genres ||
          !steamSpyGame?.languages ||
          !steamSpyGame?.tags ||
          hltbGame?.gameplayMain === undefined ||
          (steamGame?.price_overview?.initial === undefined &&
            !steamGame?.is_free)
        ) {
          throw new Error(`${steamGame?.name} data not full `);
        }
        const game = this.getGameDto(hltbGame, steamGame, steamSpyGame);

        console.log(game);

        this.createGame(game);
      } catch (e) {
        console.log(e?.message);
      }
      i++;
      if (i >= allGames.length) {
        clearInterval(pendingInterval);
        return {
          isSuccess: true,
        };
      }
    }, 5000);
  }

  async createGame(gameDto: GameDto) {
    let game = await this.gamesRepository.findOne({ id: gameDto.steamId });
    if (!game) {
      game = new Game();
    }
    const {
      gameDevelopers,
      gamePublishers,
      gameGenres,
      gameTags,
      gameLanguages,
    } = await this.createM2MGameFields(
      gameDto.tags,
      gameDto.genres,
      gameDto.publishers,
      gameDto.developers,
      gameDto.languages,
    );
    console.log(game);

    game.id = gameDto.steamId;
    game.name = gameDto.name;
    game.developers = gameDevelopers;
    game.publishers = gamePublishers;
    game.genres = gameGenres;
    game.tags = gameTags;
    game.languages = gameLanguages;
    game.points = gameDto.points;
    game.gameplayTime = gameDto.gameplayTime;
    game.steamScore = gameDto.steamScore;
    game.metascore = gameDto.metascore;
    game.description = gameDto.description;
    game.price = gameDto.price;
    game.soldCount = gameDto.soldCount;
    game.steamURL = gameDto.steamURL;
    game.HLTBURL = gameDto.HLTBURL;
    game.imageURL = gameDto.imageURL;
    game.releaseDate = gameDto.releaseDate;

    return this.gamesRepository.save(game);
  }

  async createM2MGameFields(
    tags: string[],
    genres: string[],
    publishers: string[],
    developers: string[],
    languages: string[],
  ) {
    const gameGenres = [];
    for (const genre of genres) {
      let dbGenre = await this.genresRepository.findOne({ name: genre });
      if (!dbGenre) {
        const newGenre = new Genre();
        newGenre.name = genre;
        dbGenre = await this.genresRepository.save(newGenre);
      }
      gameGenres.push(dbGenre);
    }

    const gameTags = [];
    for (const tag of tags) {
      let dbTag = await this.tagsRepository.findOne({ name: tag });
      if (!dbTag) {
        const newTag = new Tag();
        newTag.name = tag;
        dbTag = await this.tagsRepository.save(newTag);
      }
      gameTags.push(dbTag);
    }

    const gameDevelopers = [];
    for (const developer of developers) {
      let dbDeveloper = await this.developersRepository.findOne({
        name: developer,
      });
      if (!dbDeveloper) {
        const newDeveloper = new Developer();
        newDeveloper.name = developer;
        dbDeveloper = await this.developersRepository.save(newDeveloper);
      }
      gameDevelopers.push(dbDeveloper);
    }

    const gamePublishers = [];
    for (const publisher of publishers) {
      let dbPublisher = await this.publishersRepository.findOne({
        name: publisher,
      });
      if (!dbPublisher) {
        const newPublisher = new Publisher();
        newPublisher.name = publisher;
        dbPublisher = await this.publishersRepository.save(newPublisher);
      }
      gamePublishers.push(dbPublisher);
    }

    const gameLanguages = [];
    for (const language of languages) {
      let dbLanguage = await this.languagesRepository.findOne({
        name: language,
      });
      if (!dbLanguage) {
        const newLanguage = new Language();
        newLanguage.name = language;
        dbLanguage = await this.languagesRepository.save(newLanguage);
      }
      gameLanguages.push(dbLanguage);
    }
    return {
      gameGenres,
      gameTags,
      gameDevelopers,
      gamePublishers,
      gameLanguages,
    };
  }

  getGameDto(
    hltbGame: HowLongToBeatEntry,
    steamGame: SteamGame,
    steamSpyGame: SteamSpyGame,
  ) {
    const [minSoldCount, maxSoldCount] = steamSpyGame.owners
      .split(',')
      .join('')
      .split('..');

    const steamScore = Math.floor(
      (steamSpyGame.positive /
        (steamSpyGame.positive + steamSpyGame.negative)) *
        100,
    );

    const steamSpyGameData = {
      name: steamSpyGame.name,
      tags: Object.keys(steamSpyGame.tags),
      languages: steamSpyGame.languages.split(', '),
      soldCount: (Number(minSoldCount) + Number(maxSoldCount)) / 2,
      steamScore: steamScore || 0,
    };

    const hltbGameData = {
      gameplayTime: Number(hltbGame.gameplayMain),
      HLTBURL: `https://howlongtobeat.com/game?id=${hltbGame.id}`,
    };

    const steamGameData = {
      developers: steamGame.developers,
      publishers: steamGame.publishers,
      genres: steamGame.genres.map((g) => g.description),
      steamId: steamGame.steam_appid,
      price:
        steamGame?.price_overview?.initial / 100 ||
        (steamGame.is_free ? 0 : undefined),
      releaseDate: steamGame.release_date['date'],
      description: steamGame.short_description,
      metascore: steamGame?.metacritic?.score || 0,
      steamURL: `https://store.steampowered.com/app/${steamGame.steam_appid}`,
      imageURL: steamGame.header_image,
    };
    const points = this.getGamePoints(
      hltbGameData.gameplayTime,
      steamGameData.price,
      steamSpyGameData.steamScore,
    );

    const game: GameDto = {
      ...steamGameData,
      ...hltbGameData,
      ...steamSpyGameData,
      points: points,
    };
    return game;
  }

  async getSteamSpyPage(page: number) {
    const { data } = await axios.get<{
      [key: string]: { appid: number; name: string };
    }>(`https://steamspy.com/api.php?request=all&page=${page}`);
    return Object.values(data);
  }

  async getSteamSpyGame(appid: number) {
    const { data } = await axios.get<SteamSpyGame>(
      `https://steamspy.com/api.php?request=appdetails&appid=${appid}`,
    );
    return data;
  }

  async getHLTBGame(name: string) {
    const games = await this.hltbService.search(name);
    return games[0];
  }

  async getSteamGame(appid: number) {
    const { data } = await axios.get<{
      [key: string]: { success: boolean; data: SteamGame };
    }>(`http://store.steampowered.com/api/appdetails?cc=ru&appids=${appid}`);
    return data[appid].data;
  }

  getGamePoints(duration: number, price: number, steamScore: number) {
    let rawPoints = 0;
    let k2 = 1;
    //evaluate score by duration
    // 1-3 — 40   4-8 —75   9-12 — 115
    // 12-15 — 135   16-20 — 155
    // 20+ — 155 * k
    if (duration <= 3) {
      rawPoints = 40;
    } else if (duration <= 8) {
      rawPoints = 75;
    } else if (duration <= 12) {
      rawPoints = 115;
    } else if (duration <= 15) {
      rawPoints = 135;
    } else if (duration <= 20) {
      rawPoints = 155;
    } else {
      rawPoints = 155;
      k2 = k2 + Math.floor((duration - 20) / 5) * 0.05;
    }
    const rubles = price / 100;
    const k = (Math.random() * (115 - 90) + 90) / 100;

    if (rubles / duration >= 1.5 && rubles / duration < 2.5) {
      k2 = k2 + (Math.random() * 10) / 100;
    } else if (rubles / duration >= 2.5) {
      k2 = k2 + (Math.random() * (20 - 11) + 11) / 100;
    }
    const score = rawPoints * k * k2 * (steamScore / 100);
    return Math.floor(score);
  }
}
