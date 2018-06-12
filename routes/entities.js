const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;
const { requireAuthentication } = require('../lib/auth');

function validActions(actions) {
  return actions && actions[0].attack && actions[0].weapon && actions[0].damage;
}

function validEntity(entity){
  return entity && entity.name && entity.health && entity.actions && validActions(entity.actions);
}

function getEntities(mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .find()
    .project({})
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

function getEntityByName(entityName, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .find({name: entityName})
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

function insertEntity(entity, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  const entityDocument = {
    name: entity.name,
    health: entity.health,
    actions: entity.actions
  };
  return entityCollection.insertOne(entityDocument)
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}

function updateEntity(entityId, entity, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .replaceOne({_id: ObjectId(entityId)}, entity)
    .then((result) => {
      return Promise.resolve(result.upsertedId);
    });
}

function deleteEntity(entityId, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .remove({_id: ObjectId(entityId)}, {justOne: true})
    .then((results) => {
      return Promise.resolve(results);
    });
}

// Unnecessary
function getRegionsByEntity(entityId, regionId, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
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
  getEntityByName(req.body.name, mongoDB)
    .then((exists) => {
      if(!exists) {
        return insertEntity(req.body, mongoDB);
      } else {
        return Promise.reject(400);
      }
    })
    .then((id) => {
      res.status(201).json({
        _id: id
      });
    })
    .catch((err) => {
      if (err === 400) {
        res.status(400).json({
          error: "Entity exists already."
        });
      } else {
        console.log("--err:", err);
        res.status(500).json({
          error: "Failed to insert a new entity."
        });
      }
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
      console.log("--err:", err);
      res.status(500).json({
        error: "Failed to fetch the entity."
      });
    });
});

function updateEntityOfIdentity(entity, mongoDB) {
  const identityCollection = mongoDB.collection('identities');
  const entityDocument = {
    name: entity.name,
    health: entity.health,
    actions: entity.actions
  };
  return identityCollection
    .update(
      { 'entity.name': entity.name },
      { $set: {"entity.actions": entity.actions, "entity.health": entity.health }}
    )
    .then((results) => {
       return Promise.resolve(results);
    });
}

// Update an existing entity by id.
router.put('/:id', requireAuthentication, function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- PUT request /entities/" + req.params.id);
  getEntityById(req.params.id, mongoDB)
  .then((exists) => {
    if(exists) {
      return updateEntity(req.params.id, req.body, mongoDB);
    } else {
      return Promise.reject(401);
    }
  })
  .then((id) => {
    return updateEntityOfIdentity(req.body, mongoDB);
  })
  .then((results) => {
    res.status(200).json({
      links: {
        entity: `/entities/${req.params.id}`
      }
    });
  })
  .catch((err) => {
    if (err === 401) {
      res.status(401).json({
        error: "Entity not found."
      });
    } else {
      console.log("--err:", err);
      res.status(500).json({
        error: "Failed to fetch the entity."
      });
    }
  });
});

// Delete an existing entity by id.
router.delete('/:id', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log("-- DELETE request /entities/id:" + req.params.id);
  getEntityById(req.params.id, mongoDB)
  .then((exists) => {
    if (exists) {
      return deleteEntity(req.params.id, mongoDB);
    } else {
      return Promise.reject(401);
    }
  })
  .then((deleted) => {
    if(deleted){
      res.status(204).end();
    } else {
      return Promise.reject(500);
    }
  })
  .catch((err) => {
    if (err === 401) {
      res.status(401).json({
        error: "Entity not found"
      });
    } else {
      console.log("--err:", err);
      res.status(500).json({
        error: "Failed to fetch the entity."
      });
    }
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
    console.log("--err:", err);
    res.status(500).json({
      error: "Failed to fetch the requested regions."
    });
  });
});



exports.router = router;
exports.getEntityById = getEntityById;
exports.getEntityByName = getEntityByName;
