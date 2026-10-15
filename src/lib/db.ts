import { sql } from '@vercel/postgres';

export async function getProjects(userId: number) {
  const { rows } = await sql`
    SELECT * FROM projects WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows;
}

export async function createProject(userId: number, name: string, url: string) {
  const { rows } = await sql`
    INSERT INTO projects (user_id, name, url)
    VALUES (${userId}, ${name}, ${url})
    RETURNING *
  `;
  return rows[0];
}
