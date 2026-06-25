import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../entities/user.entity';

export const DEMO_USER = {
  email: 'demo@example.com',
  password: 'password123',
  name: 'Demo Trainer',
  username: 'demo_trainer',
} as const;

@Injectable()
export class DemoUserSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoUserSeedService.name);

  constructor(
    @InjectModel(User.name)
    private usersModel: Model<UserDocument>,
  ) {}

  onModuleInit() {
    setTimeout(() => {
      this.ensureDemoUser().catch((error) => {
        this.logger.error(
          `Failed to seed demo user: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }, 1500);
  }

  async ensureDemoUser(): Promise<void> {
    const existing = await this.usersModel
      .findOne({ email: DEMO_USER.email })
      .exec();

    if (existing) {
      this.logger.log('Demo user ready (demo@example.com)');
      return;
    }

    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);

    await this.usersModel.create({
      email: DEMO_USER.email,
      password: hashedPassword,
      name: DEMO_USER.name,
      username: DEMO_USER.username,
    });

    this.logger.log(
      `Demo user created — ${DEMO_USER.email} / ${DEMO_USER.password}`,
    );
  }
}
