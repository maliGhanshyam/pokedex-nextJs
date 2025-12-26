import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FavoritePokemon } from './favorite-pokemon.entity';

@Entity('pokemon')
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'int' })
  weight: number;

  @Column({ type: 'jsonb' })
  stats: {
    base_stat: number;
    effort: number;
    stat: { name: string };
  }[];

  @Column({ type: 'jsonb' })
  types: { type: { name: string } }[];

  @Column()
  sprite: string;

  @Column({ type: 'jsonb', nullable: true })
  sprites: {
    front_default: string;
    other: {
      ['official-artwork']: {
        front_default: string;
        front_shiny: string;
      };
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  abilities: { ability: { name: string } }[];

  @Column({ type: 'jsonb', nullable: true })
  species: { name: string };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FavoritePokemon, (favorite) => favorite.pokemon)
  favorites: FavoritePokemon[];
}

