import { Game } from 'src/games/games.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  nickname: string;

  @Column()
  password: string;

  @ManyToMany(() => Game, (game) => game.id, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  gamesHistory: Game[];
}
