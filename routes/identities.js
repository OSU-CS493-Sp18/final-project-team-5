const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

const { requireAuthentication } = require('../lib/auth');
const { getEntityByName } = require('./entities');
const { getRegionByName, addIdentityToRegion, removeIdentityFromRegion } = require('./regions');
exports.router = router;

function validIdentity(character) {
    return character && character.name && character.title && character.appearance &&
        character.personality && character.entity && character.alignment && character.money && character.location;
}

function getIdentities(mongoDB) {
    const identityCollection = mongoDB.collection('identities');
    return identityCollection
        .find()
        .project({"appearance":false, "personality":false, "money":false})
        .toArray()
        .then((results) => {
            return Promise.resolve(results);
        });
}

// GET identities/
router.get('/', function (req, res) {
    console.log("-- GET request /identities/");
    const mongoDB = req.app.locals.mongoDB;
    getIdentities(mongoDB)
      .then((player) => {
        res.status(200).send(player);
      })
      .catch((err) => {
          console.log("--err: ", err);
          res.status(500).json({
              error: "Unable to access identities data."
          });
      });
});

function getIdentityById(identityId, mongodb) {
    const identityCollection = mongodb.collection('identities');
    return identityCollection
        .find( {_id: ObjectId(identityId)})
        .toArray()
        .then((results) => {
            return Promise.resolve(results[0]);
        });
}

function getIdentityByName(identityName, mongoDB){
  const identityCollection = mongoDB.collection('identities');
  return identityCollection
    .find({name: identityName})
    .toArray()
    .then((results) => {
      return Promise.resolve(results[0]);
    });
}

// GET identities by id
router.get('/:identityId', requireAuthentication , function (req, res) {
    const mongoDB = req.app.locals.mongoDB;
    return getIdentityById(req.params.identityId, mongoDB)
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
                    error: "Invalid identity request."
                });
            } else {
                console.log("--err: ", err);
                res.status(500).json({
                    error: "Failed to fetch identity."
                });
            }
        });
});

function insertIdentity(character, entity, mongoDB) {
    const identityDocument = {
        name: character.name,
        title: character.title,
        appearance: character.appearance,
        personality: character.personality,
        entity: entity,
        alignment: character.alignment,
        money: character.money
    };
    const identityCollection = mongoDB.collection('identities');
    return identityCollection.insertOne(identityDocument)
        .then((result) => {
            return Promise.resolve(result.insertedId);
        })
}

/*
 * POST '/': Add new identity
 */
router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  console.log(req.body);

  if (validIdentity(req.body)) {
    getIdentityByName(req.body.name, mongoDB)
      .then((exists) => {
        if(!exists) {
          // Verify chosen region
          return getRegionByName(req.body.location, mongoDB);
        } else {
          return Promise.reject(400);
        }
      })
      .then((exists) => {
        if(exists){
          //Great!
          console.log("-- Requested region exists");
          removeIdentityFromRegion(req.body.name, mongoDB);
          addIdentityToRegion(req.body.name, exists._id, mongoDB);
          // Get chosen entity
          return getEntityByName(req.body.entity, mongoDB);
        } else {
          return Promise.reject(401);
        }
      })
      .then((entityObject) => {
        if(entityObject) {
          return insertIdentity(req.body, entityObject, mongoDB);
        } else {
          return Promise.reject(401);
        }
      })
      .then((id) => {
        res.status(201).json({
          _id: id,
          links: {
            identity: `/identities/${id}`
          }
        });
      })
      .catch((err) => {
        if (err === 400) {
          res.status(400).json({
            error: "Identity already exists."
          });
        } else if (err === 401) {
          res.status(401).json({
            error: "Nonexistant location or entity."
          })
        } else {
          console.log("--err: ", err);
          res.status(500).json({
            error: "Failed to insert a new identity."
          });
        }
      });
  } else {
    res.status(400).json({
    error: "Request doesn't contain a valid identity"
    });
  }
});

function updateIdentity(character, identityId, entity, mongoDB){
    const identityCollection = mongoDB.collection('identities');
    const identityDocument = {
        name: character.name,
        title: character.title,
        appearance: character.appearance,
        personality: character.personality,
        entity: entity,
        alignment: character.alignment,
        money: character.money
    };
    return identityCollection
        .replaceOne({_id: ObjectId(identityId)}, identityDocument)
        .then((results) => {
            return Promise.resolve(results);
        });
}

// PUT identities/:id
router.put('/:identityId', requireAuthentication, function (req, res) {
    const mongoDB = req.app.locals.mongoDB;
    console.log(req.body);

    if (validIdentity(req.body)) {
      getIdentityByName(req.body.name, mongoDB)
        .then((exists) => {
          if(exists) {
            // Verify chosen region
            return getRegionByName(req.body.location, mongoDB);
          } else {
            return Promise.reject(400);
          }
        })
        .then((exists) => {
          if(exists){
            //Great!
            console.log("-- Requested region exists");
            removeIdentityFromRegion(req.body.name, mongoDB);
            addIdentityToRegion(req.body.name, exists._id, mongoDB);
            // Get chosen entity
            return getEntityByName(req.body.entity, mongoDB);
          } else {
            return Promise.reject(401);
          }
        })
        .then((entityObject) => {
          if(entityObject) {
            return updateIdentity(req.body, req.params.identityId, entityObject, mongoDB);
          } else {
            return Promise.reject(401);
          }
        })
        .then((id) => {
          res.status(200).json({
            _id: req.params.identityId,
            links: {
              identity: `/identities/${req.params.identityId}`
            }
          });
        })
        .catch((err) => {
            if (err === 401) {
                res.status(401).json({
                    error: "Invalid identity request"
                });
            } else {
                console.log("--err: ", err);
                res.status(500).json({
                    error: "Failed to fetch identity"
                });
            }
        });
    } else {
        res.status(400).json({
            error: "Request doesn't contain a valid identity"
        });
    }
});

function deleteIdentity(identityId, mongoDB) {
    const identityCollection = mongoDB.collection('identities');
    return identityCollection
        .remove({_id: ObjectId(identityId)}, {justOne: true})
        .then((results) => {
           return Promise.resolve(results);
        });
}

// DELETE identities/:id
router.delete('/:identityId', function (req, res) {
    const mongoDB = req.app.locals.mongoDB;
    getIdentityById(req.params.identityId, mongoDB)
        .then((exists) => {
            if(exists) {
                return removeIdentityFromRegion(exists.name, mongoDB);
            } else {
                return Promise.reject(401);
            }
        })
        .then((identityDeleted) =>  {
          if(identityDeleted) {
            return deleteIdentity(req.params.identityId, mongoDB);
          } else {
            return Promise.reject(500);
          }
        })
        .then((deleted) => {
            if(deleted) {
                res.status(204).end();
            } else {
                return Promise.reject(500);
            }
        })
        .catch((err) => {
            if (err === 401) {
                res.status(401).json({
                    error: "Invalid delete identity request."
                });
            } else {
                console.log("--err: ", err);
                res.status(500).json({
                    error: "Failed to fetch identity to delete."
                });
            }
        });
});
