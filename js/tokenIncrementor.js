import pgClient from "./pgClient.js";

//const res = await pgClient.query("SELECT count FROM counters;"); --  get count

async function updateUsedTokenCount(incrementor) {
  const client = await pgClient.connect();
  try {
    const incrementResult = await client.query(
      `UPDATE counters SET count = count + ${incrementor} WHERE id = $1 RETURNING *;`,
      [1], // The id of the row to update
    );

    return incrementResult.rows[0].count;
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    client.release();
  }
}

export default updateUsedTokenCount;
