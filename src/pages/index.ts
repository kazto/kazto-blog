import { Context, Hono } from "hono";
import { Env } from "../index";

export type Title = {
    post_title: string;
    post_date: string;
};

export const index = async (
    c: Context<
        {
            Bindings: Env;
        },
        "/",
        {}
    >,
) => {
    const sql = `
    SELECT
      post_title, post_date
    FROM
      SERVMASK_PREFIX_posts
    WHERE
      post_type = 'post'
    ORDER BY post_date DESC;
    `;
    const { results }: D1Result<Title> = await c.env?.DB?.prepare(sql)?.all();
    return c.html(
        results
            .map((r) => {
                return `<p><a href="/posts/${r.post_date.replace(/[-: ]/g, "")}">${r.post_title}</a></p>`;
            })
            .join(""),
    );
};
