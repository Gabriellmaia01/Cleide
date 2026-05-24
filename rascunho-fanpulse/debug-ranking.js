const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const cats = await sql`SELECT * FROM vote_categories`;
    console.log('Categories:', cats);
    const players = await sql`SELECT id, name FROM players LIMIT 5`;
    console.log('Players:', players);
    const votes = await sql`SELECT * FROM votes`;
    console.log('Votes:', votes);
    const vr = await sql`SELECT * FROM v_ranking WHERE category_slug = 'melhor-jogador'`;
    console.log('v_ranking:', vr);
  } catch (err) {
    console.error(err);
  }
}
main();
