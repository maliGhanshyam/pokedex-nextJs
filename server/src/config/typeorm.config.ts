import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';
import { Contact } from '../entities/contact.entity';
import { Battle } from '../entities/battle.entity';

config();

const configService = new ConfigService();

export const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'pokedex'),
  entities: [User, Pokemon, FavoritePokemon, Contact, Battle],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
};

export default new DataSource(typeormConfig);

