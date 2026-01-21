const pool = require("../config/db");
const logger = require("../utils/logger");

class CollectionController {
  /**
   * @description Create a new collection
   * @route POST /api/collections
   */
  static async createCollection(req, res) {
    const { name, description, parent_collection_id } = req.body;
    const userId = req.user.id;
    if (!name) {
      return res.status(400).json({ message: "Collection name is required." });
    }
    const newCollection = await pool.query(
      "INSERT INTO collections (name, description, parent_collection_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description || null, parent_collection_id || null, userId]
    );
    res.status(201).json(newCollection.rows[0]);
  }

  /**
   * @description Get all top-level collections
   * @route GET /api/collections
   */
  static async getAllCollections(req, res) {
    // Removed try-catch, errors will bubble up
    const collections = await pool.query(
      "SELECT * FROM collections WHERE parent_collection_id IS NULL ORDER BY name ASC",
      []
    );
    res.status(200).json(collections.rows);
  }

  /**
   * @description Get a single collection's content (sub-collections, questions, dashboards)
   * @route GET /api/collections/:id
   */
  static async getCollectionById(req, res) {
    const { id } = req.params;
    // Removed try-catch, errors will bubble up
    // Get collection details
    const collectionRes = await pool.query(
      "SELECT * FROM collections WHERE id = $1",
      [id]
    );
    if (collectionRes.rows.length === 0) {
      return res.status(404).json({ message: "Collection not found." });
    }

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

    const response = {
      ...collectionRes.rows[0],
      items: [
        ...subCollectionsRes.rows.map((c) => ({ ...c, type: "collection" })),
        ...dashboardsRes.rows.map((d) => ({ ...d, type: "dashboard" })),
        ...questionsRes.rows.map((q) => ({ ...q, type: "question" })),
      ],
    };
    res.status(200).json(response);
  }

  /**
   * @description Update a collection's name or description
   * @route PUT /api/collections/:id
   */
  static async updateCollection(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Collection name is required." });
    }
    const updated = await pool.query(
      "UPDATE collections SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, description, id]
    );
    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "Collection not found." });
    }
    res.status(200).json(updated.rows[0]);
  }

  /**
   * @description Delete a collection
   * @route DELETE /api/collections/:id
   */
  static async deleteCollection(req, res) {
    const { id } = req.params;
    // This try-catch is for transaction management, not general error handling.
    // The error is re-thrown to bubble up.
    try {
      // Note: Items inside will have their collection_id set to NULL
      const deleted = await pool.query(
        "DELETE FROM collections WHERE id = $1",
        [id]
      );
      if (deleted.rowCount === 0) {
        return res.status(404).json({ message: "Collection not found." });
      }
      res.status(200).json({ message: "Collection deleted successfully." });
    } catch (error) {
      logger.error(`Failed to delete collection ${id}:`, error); // Replaced console.error
      throw error; // Re-throw to ensure async errors bubble up
    }
  }

  /**
   * @description Move a question or dashboard to a collection
   * @route PUT /api/collections/move
   */
  static async moveItemToCollection(req, res) {
    const { itemType, itemId, targetCollectionId } = req.body;

    let tableName;
    if (itemType === "question") {
      tableName = "questions";
    } else if (itemType === "dashboard") {
      tableName = "dashboards";
    } else {
      return res.status(400).json({
        message: "Invalid itemType. Must be 'question' or 'dashboard'.",
      });
    }

    const query = `UPDATE ${tableName} SET collection_id = $1 WHERE id = $2 RETURNING id, collection_id`;
    const result = await pool.query(query, [targetCollectionId, itemId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `${itemType} not found.` });
    }
    res.status(200).json(result.rows[0]);
  }
}

module.exports = CollectionController;
