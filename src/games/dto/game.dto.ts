export interface GameDto {
  steamId: number;
  name: string;
  genres: string[];
  tags: string[];
  developers: string[];
  publishers: string[];
  languages: string[];
  points: number;
  gameplayTime: number;
  steamScore: number;
  price: number;
  metascore: number;
  soldCount: number;
  steamURL: string;
  HLTBURL: string;
  description: string;
  imageURL: string;
  releaseDate: string;
}

export interface SteamSpyGame {
  appid: string;
  name: string;
  developer: string;
  publisher: string;
  positive: number;
  negative: number;
  owners: string;
  price: number;
  languages: string;
  genre: string;
  tags: {
    [key: string]: number;
  };
}

export interface SteamGame {
  type: 'game' | 'mod' | 'dlc';
  is_free: boolean;
  price_overview: {
    initial: number;
    final: number;
  };
  name: string;
  required_age: number;
  short_description: string;
  header_image: string;
  metacritic?: { score: number; url: string };
  steam_appid: number;
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  publishers: string[];
  developers: string[];
  genres: { id: string; description: string }[];
  categories: { id: string; description: string }[];
  supported_languages: string;
}
