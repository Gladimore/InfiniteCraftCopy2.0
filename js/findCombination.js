import pgClient from "./pgClient.js";

async function findCombination(element1, element2) {
  const client = await pgClient.connect();
  try {
    // Search for a combination where either element1 or element2 is in the combination
    const query = `
      SELECT * FROM combinationstoring
      WHERE (element1 = $1 AND element2 = $2) 
         OR (element1 = $2 AND element2 = $1);
    `;

    const result = await client.query(query, [element1, element2]);

    if (result.rows.length > 0) {
      console.log("Combination found");
      return result.rows[0]; // Return the first matching combination
    } else {
      console.log("No combination found with the provided elements.");
      return null; // Explicitly return null instead of undefined
    }
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    client.release();
  }
}

export default findCombination;
