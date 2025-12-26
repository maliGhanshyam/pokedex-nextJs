import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';

config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pokedex',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(User);

    // Check if dummy user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'demo@example.com' },
    });

    if (existingUser) {
      console.log('Dummy user already exists');
      await dataSource.destroy();
      return;
    }

    // Create dummy user with encrypted password
    const hashedPassword = await bcrypt.hash('password123', 10);

    const dummyUser = userRepository.create({
      email: 'demo@example.com',
      password: hashedPassword,
    });

    await userRepository.save(dummyUser);
    console.log('Dummy user created successfully!');
    console.log('Email: demo@example.com');
    console.log('Password: password123');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

