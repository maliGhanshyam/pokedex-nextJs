import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { UserSchema } from '../entities/user.entity';
import { DEMO_USER } from '../users/demo-user.seed.service';

config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pokedex';

  try {
    await mongoose.connect(mongoUri);
    console.log('Database connected');

    const UserModel = mongoose.model('User', UserSchema);

    const existingUser = await UserModel.findOne({ email: DEMO_USER.email });

    if (existingUser) {
      console.log('Dummy user already exists');
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);

    await UserModel.create({
      email: DEMO_USER.email,
      password: hashedPassword,
      name: DEMO_USER.name,
      username: DEMO_USER.username,
    });

    console.log('Dummy user created successfully!');
    console.log(`Email: ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
