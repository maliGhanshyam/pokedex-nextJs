import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestService } from './guest.service';
import { GuestActivity, GuestActivitySchema } from './guest-activity.entity';
import { Battle, BattleSchema } from '../entities/battle.entity';
import { FavoritePokemon, FavoritePokemonSchema } from '../entities/favorite-pokemon.entity';
import { User, UserSchema } from '../entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GuestActivity.name, schema: GuestActivitySchema },
      { name: Battle.name, schema: BattleSchema },
      { name: FavoritePokemon.name, schema: FavoritePokemonSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
