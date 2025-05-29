import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App E2E', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sign up a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        id: 'test@example.com',
        password: 'test@12345678',
        username: '홍길동',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
  });

  it('should login and receive JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: 'test@example.com',
        password: 'test@12345678',
      })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    jwtToken = res.body.access_token;
  });

  it('should update user info', async () => {
    await request(app.getHttpServer())
      .patch('/auth/update')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        username: '김철수',
      })
      .expect(200);
  });

  it('should create a post', async () => {
    await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        title: 'Test Title',
        content: 'Test Content',
      })
      .expect(201);
  });

  it('should list posts with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/posts?page=1')
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
  });

  it('should get post detail', async () => {
    const postList = await request(app.getHttpServer()).get('/posts?page=1');
    const postId = postList.body.posts[0].id;

    const res = await request(app.getHttpServer())
      .get(`/posts/${postId}`)
      .expect(200);

    expect(res.body).toHaveProperty('content');
  });

  it('should add a comment to post', async () => {
    const postList = await request(app.getHttpServer()).get('/posts?page=1');
    const postId = postList.body.posts[0].id;

    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        postId,
        content: 'Nice post!',
      })
      .expect(201);
  });

  it('should list comments with cursor', async () => {
    const postList = await request(app.getHttpServer()).get('/posts?page=1');
    const postId = postList.body.posts[0].id;

    const res = await request(app.getHttpServer())
      .get(`/comments?postId=${postId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
  });

  it('should fetch login records', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/login-records')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get login rankings', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/login-rankings')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
