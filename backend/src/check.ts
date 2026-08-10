import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const authService = app.get(AuthService);
  
  const user = await userRepo.findOne({ where: { email: 'tester@tenanta.com' } });
  if (user) {
    const payload = await authService.buildUserPayload(user);
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log("User not found!");
  }
  
  await app.close();
}
bootstrap().catch(console.error);
