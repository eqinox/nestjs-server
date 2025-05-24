import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env.stage.test' });

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await resetDatabase(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sign up a new user', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ username: 'testuser1', password: 'StrongPassword123' })
      .expect(201);
  });

  it('should login and return JWT', async () => {
    // Signup first
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ username: 'testuser2', password: 'StrongPassword123' })
      .expect(201);

    // Then login
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ username: 'testuser2', password: 'StrongPassword123' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('should reject signup with weak password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ username: 'weakuser', password: '123' }) // too short
      .expect(400);

    expect(res.body.message).toContain('password is too weak');
    expect(res.body.message).toContain(
      'password must be longer than or equal to 6 characters',
    );
  });
});

// ✅ Helper function to reset the DB
async function resetDatabase(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  await queryRunner.query(`TRUNCATE TABLE "user" RESTART IDENTITY CASCADE`);

  await queryRunner.release();
}
