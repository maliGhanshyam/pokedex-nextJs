import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../entities/user.entity';
import { FavoritesModule } from '../favorites/favorites.module';
import { BattleModule } from '../battle/battle.module';
import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FavoritesModule,
    BattleModule,
    GuestModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
