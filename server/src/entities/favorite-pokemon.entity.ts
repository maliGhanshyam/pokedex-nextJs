import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Pokemon } from './pokemon.entity';

@Entity('favorite_pokemon')
@Unique(['userId', 'pokemonId'])
export class FavoritePokemon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  pokemonId: number;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Pokemon, (pokemon) => pokemon.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pokemonId' })
  pokemon: Pokemon;

  @CreateDateColumn()
  createdAt: Date;
}

