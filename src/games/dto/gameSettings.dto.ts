export interface gameSettingDto {
  maxCount: number;
  minPrice: number;
  maxPrice: number;
  isFree: boolean;
  minMetascore: number;
  maxMetascore: number;
  minRating: number;
  maxRating: number;
  publishers: string[];
  developers: string[];
  tags: string[];
  genres: string[];
  name?: string;
  isRandom: boolean;
  offset?: number;
}
