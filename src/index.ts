import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { bearerAuth } from 'hono/bearer-auth'
import { Env as BaseEnv } from "hono/dist/types/types";
import { index } from "./pages/index";
import { posts } from "./pages/posts";
import { serveStatic } from 'hono/cloudflare-workers'

export type Env = BaseEnv & {
	DB: D1Database;
	BUCKET: R2Bucket;
	KV: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/admin/*", async (c, next) => {
	const auth = basicAuth({
		username: (await c.env.KV.get("USERNAME")) ?? "",
		password: (await c.env.KV.get("PASSWORD")) ?? ""
	});
	return auth(c, next);
});

app.use("/api/*", async (c, next) => {
	const token = (await c.env.KV.get("API_TOKEN")) ?? "";
	const bearer = bearerAuth({ token });
	return bearer(c, next);
});

app.get("/", (c) => index(c));
app.get("/posts/:date", (c) => posts(c));
app.get('/static/*', serveStatic({ root: './' }))
app.get('/favicon.ico', serveStatic({ path: './favicon.ico' }))

app.get("/test/get", async (c) => {
	return c.json({
		success: true,
		username: (await c.env.KV.get("USERNAME")) ?? "not found",
		password: (await c.env.KV.get("PASSWORD")) ?? "not found",
		token: (await c.env.KV.get("API_TOKEN")) ?? "not found",
	});
});

app.get("/admin", (c) => {
	return c.json({
		success: true,
		message: "/admin/index",
	});
});

app.post(
	"/api/upload/:path{\\d+/\\d+/.+$}",
 	async (c) => {

		console.log(await c.env.KV.get("API_TOKEN") ?? "");

		const contents = await c.req.arrayBuffer();
		const name = c.req.param("path");
		await c.env.BUCKET.put(`uploads/${name}`, contents);
		return c.json({ success: true, name });
	});

app.get("/get-image/:path{\\d+/\\d+/.+$}", async (c) => {
	const name = c.req.param("path");
	const contents = await c.env.BUCKET.get(`uploads/${name}`);
	if (!contents) {
		return c.text("not found", 404);
	}
	return c.body((await contents.arrayBuffer()));
});

app.get("/setup", async (c) => {
	await c.env.KV.put("USERNAME", "xxxhonoooo");
	await c.env.KV.put("PASSWORD", "xxxhonohonoooo");
	await c.env.KV.put("API_TOKEN", "xxxhonohonohonoooo");
	return c.json({
		success: true,
		message: "/setup/index",
	});
});


export default app;
