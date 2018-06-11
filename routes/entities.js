const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

function validEntity(entity){
  return entity && entity.name && entity.region;
}

function getEntities(mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .find()
    .project({"_id": false, "regions": false})
    .toArray()
    .then((results) => {
      return Promise.resolve(results);
    });
}

function getEntityById(entityId, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .find({_id: ObjectId(entityId)})
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

function insertEntity(mongoDB) {
  const entityCollection = mongoDB.collection('entity');
  const entityDocument = {
    name: entity.name,
    region: entity.region
  };
  return entityCollection.insertOne(entityDocument)
    .then((result) => {
      return Promise.resolve(result.insertedID);
    });
}

function deleteEntity(entityId, mongoDB) {
  const entityCollection = mongoDB.collection('entity');
  return entityCollection
    .remove({_id: ObjectId(endityId)}, {justOne: true})
    .then((results) => {
      return Promise.resolve(results);
    });
}


function getRegionsByEntity(entityId, regionId, mongoDB) {
  const entityCollection = mongoDB.collection('entity');
  return entityCollection
  .find(regionId)
  .toArray()
  .then((results) => {
    return Promise.resolve(results[0]);
  });
}

// Add new entity
router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  insertEntity(mongoDB)
  collection.insertOne({})
    .then((result) => {
      res.status(201).json({
        _id: result.insertedId
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to insert a new entity."
      });
    });
});


// Get all entities
router.get('/', function (req, res) {
  console.log("-- GET request /entities/");
  const mongoDB = req.app.locals.mongoDB;
  getEntities(mongoDB)
    .then((results) => {
      console.log(results);
      res.status(200).json({
        count: results.length,
        entities: results
      });
    })
    .catch((err) => {
      console.log("--err: ", err);
      res.status(500).json({
        error: "Unable to get entities."
      });
    });
});

// Get a specific entity by id.
router.get('/:id', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- GET request /entities/" + req.params.id);
  getEntityById(req.params.id, mongoDB)
  .then((results) => {
    res.status(200).json(results);
  })
  .catch((err) => {
    res.status(500).json({
      error: "Failed to fetch the entity."
    });
  });
});

// Update an existing entity by id.
router.put('/:id', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- PUT request /entities/" + req.params.id);
  getEntityById(req.params.id, mongoDB)
  .then((results) => {
    res.status(200).json(results);
  })
  .catch((err) => {
    res.status(500).json({
      error: "Failed to fetch the entity."
    });
  });
});

// Delete an existing entity by id.
router.delete('/:id', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- DELETE request /entities/id:" + req.params.id);
  getEntityById(req.params.id, mongoDB)
  .then((results) => {
    res.status(200).json(results);
  })
  .catch((err) => {
    res.status(500).json({
      error: "Failed to fetch the entity."
    });
  });
});


// Returns all entities associated with a region.
router.get('/:regionid', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- GET request /entities/:regionid:" + req.params.regionid);
  getRegionsByEntity(req.params.id, req.params.regionid, mongoDB)
  .then((results) => {
    res.status(200).json(results);
  })
  .catch((err) => {
    res.status(500).json({
      error: "Failed to fetch the requested regions."
    });
  });
});



exports.router = router;
exports.getEntityById = getEntityById;
