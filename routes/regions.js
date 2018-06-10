const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

const { requireAuthentication } = require('../lib/auth');

exports.router = router;

function validPopulationObject(population) {
  return population && population.faction && population.language && population.religion && population.disposition;
}

function validateRegionObject(region) {
  return region && region.name && region.climate && validPopulationObject(region.population);
}

function getRegions(mongoDB) {
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .find()
    .project({"entities":false, "cities":false})
    .toArray()
    .then((results) => {
      return Promise.resolve(results);
    });
}

/*
 * GET '/': Retrieves a list of regions
 */
router.get('/', function(req, res) {
  console.log("-- GET request /regions/");
  const mongoDB = req.app.locals.mongoDB;
  getRegions(mongoDB)
    .then((results) => {
      res.status(200).json({
        count: results.length,
        regions: results
      });
    })
    .catch((err) => {
      console.log("--err: ", err);
      res.status(500).json({
        error: "Unable to access regions data."
      });
    });
});

function getRegionByName(regionName, mongoDB){
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .find({name: regionName})
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

function insertRegion(region, mongoDB) {
  const regionDocument = {
    name: region.name,
    climate: region.climate,
    populationData : {
      faction: region.population.faction,
      language: region.population.language,
      religion: region.population.religion,
      disposition: region.population.disposition
    },
    cities: region.cities,
    entities: []
  };
  const regionCollection = mongoDB.collection('regions');
  return regionCollection.insertOne(regionDocument)
    .then((result) => {
      return Promise.resolve(result.insertedId);
  });
}

/*
 * POST '/': Add new region
 */
router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log(req.body);

  if (validateRegionObject(req.body)) {
    getRegionById(req.body.name, mongoDB)
      .then((exists) => {
        if (!exists) {
          return insertRegion(req.body, mongoDB);
        } else {
          return Promise.reject(400);
        }
      })
      .then((id) => {
        res.status(201).json({
          _id: id,
          links: {
            user: `/regions/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Failed to insert a new region."
        });
      });
  } else {
    res.status(400).json({
      error: "Request doesn't contain a valid region."
    });
  }
});

function getRegionById(regionId, mongoDB){
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .find({_id: ObjectId(regionId)})
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

//GET specific region
router.get('/:regionId', requireAuthentication, function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  return getRegionById(req.params.regionId, mongoDB)
    .then((results) => {
      if (results) {
        res.status(200).send(results);
      } else {
        return Promise.reject(401);
      }
    })
    .catch((err) => {
      console.log("--error: ", err);
      if (err === 401) {
        res.status(401).json({
          error: "Invalid region request."
        });
      } else {
        console.log("--err: ", err);
        res.status(500).json({
          error: "Failed to fetch regions."
        });
      }
    });
});

function updateRegion(region, regionId, mongoDB){
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .replaceOne({_id: regionId}, region)
    .then((results) => {
      return Promise.resolve(results);
    });
}

//PUT update
router.put('/:regionId', requireAuthentication, function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if(validateRegionObject(req.body)){
    getRegionById(req.params.regionId, mongoDB)
      .then((exists) => {
        if(exists) {
          return updateRegion(req.body, ObjectId(req.params.regionId), mongoDB);
        } else {
          return Promise.reject(401);
        }
      })
      .then((updateResult) => {
        res.status(200).json({
          links: {
            region: `/regions/${req.params.regionId}`
          }
        });
      })
      .catch((err) => {
        if (err === 401) {
          res.status(401).json({
            error: "Invalid region request."
          });
        } else {
          console.log("--err: ", err);
          res.status(500).json({
            error: "Failed to fetch regions."
          });
        }
      });
    } else {
      res.status(400).json({
        error: "Invalid region object."
      });
    }
});

function deleteRegion(regionId, mongoDB){
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .remove({_id: ObjectId(regionId)}, {justOne: true})
    .then((results) => {
      return Promise.resolve(results);
    });
}

//DEL delete region
router.delete('/:regionId', requireAuthentication, function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  getRegionById(req.params.regionId, mongoDB)
    .then((exists) => {
      if(exists) {
        return deleteRegion(req.params.regionId, mongoDB);
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
          error: "Invalid region request."
        });
      } else {
        console.log("--err: ", err);
        res.status(500).json({
          error: "Failed to fetch regions."
        });
      }
    });
});

function getRegionEntities(entities, mongoDB) {
  const entityCollection = mongoDB.collection('entities');
  return entityCollection
    .find({_id: {$in: entities}})
    .toArray()
    .then((results) => {
      return Promise.resolve(results);
    });
}

//GET/entities gets a regions entities
router.get('/:regionId/entities', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  getRegionById(req.params.regionId, mongoDB)
    .then((region) => {
      if (region) {
        return region.entities.map(x => ObjectId(x));
      } else {
        return Promise.reject(401);
      }
    })
    .then((entityIds) => {
      getRegionEntities(entityIds, mongoDB);
    })
    .then((entities) => {
      if(entities) {
        res.status(200).json({
          _id: req.params.regionId,
          entities: entities
        });
      }
    })
    .catch((err) => {
      if (err === 401) {
        res.status(401).json({
          error: "Region does not exist or has no entities."
        });
      } else {
        console.log("--err: ", err);
        res.status(500).json({
          error: "Failed to fetch regions."
        });
      }
    });
});

//add entity to region
  // Make sure to check region existance via getRegionById
function addEntityToRegion(entityId, regionId, mongoDB) {
  const regionCollection = mongoDB.collection('regions');
  return regionCollection
    .update(
      { _id: regionId},
      { $addToSet: {entities: entityId} })
    .then((results) => {
      return Promise.resolve(results);
    });
}

exports.router = router;
exports.getRegionById = getRegionById;
exports.addEntityToRegion = addEntityToRegion;
