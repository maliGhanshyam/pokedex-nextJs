import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Pokemon } from './pokemon.entity';

@Entity('battles')
export class Battle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  pokemon1Id: number;

  @Column({ type: 'int' })
  pokemon2Id: number;

  @Column({ type: 'int' })
  winnerId: number;

  @Column({ type: 'jsonb' })
  battleLog: any[];

  @Column({ type: 'int' })
  turns: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Pokemon)
  @JoinColumn({ name: 'pokemon1Id' })
  pokemon1: Pokemon;

  @ManyToOne(() => Pokemon)
  @JoinColumn({ name: 'pokemon2Id' })
  pokemon2: Pokemon;

  @ManyToOne(() => Pokemon)
  @JoinColumn({ name: 'winnerId' })
  winner: Pokemon;
}

