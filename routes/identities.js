const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

const { requireAuthentication } = require('../lib/auth');

exports.router = router;

function validIdentity(character) {
    return character && character.name && character.title && character.appearance &&
        character.personality && character.classes && character.alignment && character.money;
}

function getIdentities(mongoDB) {
    const identityCollection = mongoDB.collection('identities');
    return identityCollection
        .find()
        .project({"_id": false })
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
            res.status(200).json({
                name: player.name,
                title: player.title,
                classes: player.classes,
                alignment: player.alignment
            });
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

function insertIdentity(character, mongoDB) {
    const identityDocument = {
        name: character.name,
        title: character.title,
        appearance: character.appearance,
        personality: character.personality,
        classes: character.classes,
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
        getIdentityById(req.body.name, mongoDB)
            .then((exists) => {
                if(!exists) {
                    return insertIdentity(req.body, mongoDB);
                } else {
                    return Promise.reject(400);
                }
            })
            .then((id) => {
                res.status(201).json({
                    _id: id,
                    links: {
                        user: `/identities/${id}`
                    }
                });
            })
            .catch((err) => {
                res.status(500).json({
                    error: "Failed to insert a new identity."
                });
            });
    } else {
        res.status(400).json({
            error: "Request doesn't contain a valid identity"
        });
    }

});

function updateIdentity(character, identityId, mongoDB){
    const identityCollection = mongoDB.collection('identities');
    return identityCollection
        .replaceOne({_id: identityId}, character)
        .then((results) => {
            return Promise.resolve(results);
        });
}

// PUT identities/:id
router.put('/:identityId', requireAuthentication, function (req, res) {
    const mongoDB = req.app.locals.mongoDB;
    console.log(req.body);

    if (validIdentity(req.body)) {
        getIdentityById(req.params.identityId, mongoDB)
            .then((exists) => {
                if(!exists) {
                    return updateIdentity(req.params.identityId, mongoDB);
                } else {
                    return Promise.reject(400);
                }
            })
            .then((updateIdentity) => {
                res.status(200).json({
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
                return deleteIdentity(req.params.identityId, mongoDB);
            } else {
                return Promise.reject(401);
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
