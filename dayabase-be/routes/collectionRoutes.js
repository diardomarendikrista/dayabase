const express = require("express");
const router = express.Router();
const CollectionController = require("../controllers/collectionController");

router.put("/move", CollectionController.moveItemToCollection);

router.post("/", CollectionController.createCollection);
router.get("/", CollectionController.getAllCollections);
router.get("/:id", CollectionController.getCollectionById);
router.put("/:id", CollectionController.updateCollection);
router.delete("/:id", CollectionController.deleteCollection);

module.exports = router;
