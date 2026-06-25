import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/pokedex'),
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
