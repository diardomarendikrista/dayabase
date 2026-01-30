const pool = require("../config/db");
const logger = require("../utils/logger");

class CollectionService {
  /**
   * Create Collection
   */
  async createCollection(userId, { name, description, parent_collection_id }) {
    if (!name) {
      throw new Error("Collection name is required.");
    }
    const newCollection = await pool.query(
      "INSERT INTO collections (name, description, parent_collection_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description || null, parent_collection_id || null, userId]
    );
    return newCollection.rows[0];
  }

  /**
   * Get Top Level Collections
   */
  async getAllCollections() {
    const collections = await pool.query(
      "SELECT * FROM collections WHERE parent_collection_id IS NULL ORDER BY name ASC",
      []
    );
    return collections.rows;
  }

  /**
   * Get Collection By ID (with contents)
   */
  async getCollectionById(id) {
    const collectionRes = await pool.query(
      "SELECT * FROM collections WHERE id = $1",
      [id]
    );
    if (collectionRes.rows.length === 0) return null;

    // Get sub-collections
    const subCollectionsRes = await pool.query(
      "SELECT * FROM collections WHERE parent_collection_id = $1 ORDER BY name ASC",
      [id]
    );

    // Get questions in this collection
    const questionsRes = await pool.query(
      `SELECT 
            q.id, q.name, q.chart_type, q.updated_at,
            u.full_name AS updated_by_user
          FROM questions q
          LEFT JOIN users u ON q.updated_by_user_id = u.id
          WHERE q.collection_id = $1 
          ORDER BY q.name ASC`,
      [id]
    );

    // Get dashboards in this collection
    const dashboardsRes = await pool.query(
      `SELECT 
            d.id,
            d.name,
            d.description,
            d.updated_at,
            u.full_name AS updated_by_user
          FROM dashboards d
          LEFT JOIN users u ON d.updated_by_user_id = u.id
          WHERE collection_id = $1
          ORDER BY d.updated_at DESC, d.created_at DESC`,
      [id]
    );

    return {
      ...collectionRes.rows[0],
      items: [
        ...subCollectionsRes.rows.map((c) => ({ ...c, type: "collection" })),
        ...dashboardsRes.rows.map((d) => ({ ...d, type: "dashboard" })),
        ...questionsRes.rows.map((q) => ({ ...q, type: "question" })),
      ],
    };
  }

  /**
   * Update Collection
   */
  async updateCollection(id, { name, description }) {
    if (!name) {
      throw new Error("Collection name is required.");
    }
    const updated = await pool.query(
      "UPDATE collections SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, description, id]
    );
    if (updated.rowCount === 0) return null;
    return updated.rows[0];
  }

  /**
   * Delete Collection
   */
  async deleteCollection(id) {
    try {
      const deleted = await pool.query(
        "DELETE FROM collections WHERE id = $1",
        [id]
      );
      return deleted.rowCount > 0;
    } catch (error) {
      logger.error(`Failed to delete collection ${id}:`, error);
      throw error;
    }
  }

  /**
   * Move Item
   */
  async moveItemToCollection({ itemType, itemId, targetCollectionId }) {
    let tableName;
    if (itemType === "question") {
      tableName = "questions";
    } else if (itemType === "dashboard") {
      tableName = "dashboards";
    } else {
      throw new Error("Invalid itemType. Must be 'question' or 'dashboard'.");
    }

    const query = `UPDATE ${tableName} SET collection_id = $1 WHERE id = $2 RETURNING id, collection_id`;
    const result = await pool.query(query, [targetCollectionId, itemId]);

    if (result.rowCount === 0) return null;
    return result.rows[0];
  }
}

module.exports = new CollectionService();
