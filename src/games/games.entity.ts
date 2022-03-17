import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Game {
  @PrimaryColumn()
  id: number;

  @ManyToMany(() => Developer, (developer) => developer.name, {
    eager: true,
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  developers: Developer[];

  @ManyToMany(() => Publisher, (publisher) => publisher.name, {
    eager: true,
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  publishers: Publisher[];

  @ManyToMany(() => Genre, (genre) => genre.name, {
    eager: true,
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  genres: Genre[];

  @ManyToMany(() => Tag, (tag) => tag.name, {
    eager: true,
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  tags: Tag[];

  @ManyToMany(() => Language, (language) => language.name, {
    eager: true,
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  languages: Language[];

  @Column()
  name: string;

  @Column()
  points: number;

  @Column({
    type: 'float',
  })
  gameplayTime: number;

  @Column()
  steamScore: number;

  @Column()
  metascore: number;

  @Column()
  price: number;

  @Column()
  soldCount: number;

  @Column()
  description: string;

  @Column()
  steamURL: string;

  @Column()
  HLTBURL: string;

  @Column()
  imageURL: string;

  @Column()
  releaseDate: string;
}

@Entity()
export class Developer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}

@Entity()
export class Publisher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}

@Entity()
export class Language {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
