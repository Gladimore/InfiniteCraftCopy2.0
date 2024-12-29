import pgClient from "./pgClient.js";

async function addCombination(combination, element1, element2, emoji) {
  const client = await pgClient.connect();
  try {
    const result = await client.query(
      `INSERT INTO combinationstoring (combination, element1, element2, emoji) 
       VALUES ($1, $2, $3, $4) RETURNING *;`,
      [combination, element1, element2, emoji], // Pass individual elements
    );

    return result.rows[0];
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    client.release();
  }
}

export default addCombination;
