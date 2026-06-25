import 'reflect-metadata';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { UserSchema } from '../entities/user.entity';

config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pokedex';

  try {
    await mongoose.connect(mongoUri);
    console.log('Database connected — no seed data required (guest users are created on demand)');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
