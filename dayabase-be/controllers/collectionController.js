const CollectionService = require("../services/CollectionService");
const logger = require("../utils/logger");

class CollectionController {
  /**
   * @description Create a new collection
   * @route POST /api/collections
   */
  static async createCollection(req, res) {
    const { name, description, parent_collection_id } = req.body;
    const userId = req.user.id;

    try {
      const newCollection = await CollectionService.createCollection(userId, { name, description, parent_collection_id });
      res.status(201).json(newCollection);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error creating collection", error: error.message });
    }
  }

  /**
   * @description Get all top-level collections
   * @route GET /api/collections
   */
  static async getAllCollections(req, res) {
    try {
      const collections = await CollectionService.getAllCollections();
      res.status(200).json(collections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching collections", error: error.message });
    }
  }

  /**
   * @description Get a single collection's content (sub-collections, questions, dashboards)
   * @route GET /api/collections/:id
   */
  static async getCollectionById(req, res) {
    const { id } = req.params;
    try {
      const collection = await CollectionService.getCollectionById(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found." });
      }
      res.status(200).json(collection);
    } catch (error) {
      res.status(500).json({ message: "Error fetching collection details", error: error.message });
    }
  }

  /**
   * @description Update a collection's name or description
   * @route PUT /api/collections/:id
   */
  static async updateCollection(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
      const updated = await CollectionService.updateCollection(id, { name, description });
      if (!updated) {
        return res.status(404).json({ message: "Collection not found." });
      }
      res.status(200).json(updated);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating collection", error: error.message });
    }
  }

  /**
   * @description Delete a collection
   * @route DELETE /api/collections/:id
   */
  static async deleteCollection(req, res) {
    const { id } = req.params;
    try {
      const success = await CollectionService.deleteCollection(id);
      if (!success) {
        return res.status(404).json({ message: "Collection not found." });
      }
      res.status(200).json({ message: "Collection deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting collection", error: error.message });
    }
  }

  /**
   * @description Move a question or dashboard to a collection
   * @route PUT /api/collections/move
   */
  static async moveItemToCollection(req, res) {
    const { itemType, itemId, targetCollectionId } = req.body;
    try {
      const result = await CollectionService.moveItemToCollection({ itemType, itemId, targetCollectionId });
      if (!result) {
        return res.status(404).json({ message: `${itemType} not found.` });
      }
      res.status(200).json(result);
    } catch (error) {
      if (error.message.includes("Invalid itemType")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error moving item", error: error.message });
    }
  }
}

module.exports = CollectionController;
