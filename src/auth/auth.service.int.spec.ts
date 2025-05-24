import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as dotenv from 'dotenv';
import { Task } from '../tasks/task.entity';
import { validate } from 'class-validator';

dotenv.config({ path: '.env.stage.test' });

describe('AuthService Integration', () => {
  let authService: AuthService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.stage.test'],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: +process.env.DB_PORT!,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, Task],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should throw error if the password is too weak', async () => {
    const dto: AuthCredentialsDto = {
      username: 'weak_password_user',
      password: '123', // Weak password
    };
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should create a user successfully', async () => {
    // const dto = new AuthCredentialsDto();
    const dto: AuthCredentialsDto = {
      username: 'integration_test_user',
      password: 'StrongPassword123',
    };
    await expect(authService.createUser(dto)).resolves.toBeUndefined();
  });

  it('should throw ConflictException if username already exists', async () => {
    const dto: AuthCredentialsDto = {
      username: 'duplicate_user',
      password: 'Password123',
    };

    // First creation should work
    await authService.createUser(dto);

    // Second should fail
    await expect(authService.createUser(dto)).rejects.toThrow(
      'Username already exists',
    );
  });
});

