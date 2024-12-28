import pgClient from "./pgClient.js";

async function addCombination(combination, element1, element2) {
  const client = await pgClient.connect();
  try {
    const result = await client.query(
      `INSERT INTO combinationstoring (combination, element1, element2) 
       VALUES ($1, $2, $3) RETURNING *;`,
      [combination, element1, element2], // Pass individual elements
    );

    return result.rows[0];
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    client.release();
  }
}

export default addCombination;
