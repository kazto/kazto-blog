import { Hono } from 'hono';
import { html } from 'hono/html';
import { Env as BaseEnv } from "hono/dist/types/types";
import { index } from './pages/index';
import { posts } from './pages/posts';

export type Env = BaseEnv & {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => index(c));
app.get('/posts/:date', (c) => posts(c));

export default app;
