import { Context, Hono } from "hono";
import { Env } from "../index";

export type Post = {
    post_title: string;
    post_date: string;
    post_content: string;
};

export const posts = async (
    c: Context<
        {
            Bindings: Env;
        },
        "/posts/:date",
        {}
    >,
) => {
    const date = c.req
        .param("date")
        .split("")
        .flatMap((_, i, a) => (i % 2 ? [] : [a.slice(i, i + 2)]))
        .map((a) => a.join(""));

    const post_date = [date[0], date.slice(1, 4).join("-"), " ", date.slice(4, 7).join(":")].join("");

    const sql = `
    SELECT
      post_title,
      post_date,
      post_content
    FROM
      SERVMASK_PREFIX_posts
    WHERE
      post_type = 'post'
      AND post_date = ?
    ORDER BY post_date DESC;
    `;
    const { results }: D1Result<Post> = await c.env?.DB?.prepare(sql).bind(post_date)?.all();

    return c.html(
        results
            .map((r) => {
                return `<main>
            <h1>${r.post_title}</h1>
            <p>${r.post_date}</p>
            <p>${r.post_content.replace(/\\n/g, "<br />").replace(/\\"/g, '"')}</p>
        </main>`;
            })
            .join(""),
    );
};
