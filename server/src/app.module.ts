import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PokemonModule } from './pokemon/pokemon.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { ContactsModule } from './contacts/contacts.module';
import { BattleModule } from './battle/battle.module';
import { CompareModule } from './compare/compare.module';
import { TeamsModule } from './teams/teams.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { HealthModule } from './health/health.module';
import { User } from './entities/user.entity';
import { Pokemon } from './entities/pokemon.entity';
import { FavoritePokemon } from './entities/favorite-pokemon.entity';
import { Contact } from './entities/contact.entity';
import { Battle } from './entities/battle.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'pokedex'),
        entities: [User, Pokemon, FavoritePokemon, Contact, Battle],
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true' || configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        // Connection pooling for better performance
        extra: {
          max: 10, // Maximum number of connections in the pool
          min: 2, // Minimum number of connections in the pool
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PokemonModule,
    FavoritesModule,
    AnalyticsModule,
    AdminModule,
    ContactsModule,
    BattleModule,
    CompareModule,
    TeamsModule,
    RecommendationsModule,
    HealthModule,
  ],
})
export class AppModule {}

