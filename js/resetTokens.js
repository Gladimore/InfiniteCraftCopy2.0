import pgClient from "./pgClient.js";

async function runSQL() {
  const client = await pgClient.connect();
  try {
    const result = await client.query(
      `UPDATE counters SET count = 0 WHERE id = $1 RETURNING *;`,
      [1], // The id of the row to update
    );

    console.log(result.rows);
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    client.release();
  }
}

runSQL();