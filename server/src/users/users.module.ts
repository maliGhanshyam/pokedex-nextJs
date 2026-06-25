import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DemoUserSeedService } from './demo-user.seed.service';
import { User, UserSchema } from '../entities/user.entity';
import { FavoritesModule } from '../favorites/favorites.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FavoritesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, DemoUserSeedService],
  exports: [UsersService],
})
export class UsersModule {}
