const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

const { requireAuthentication } = require('../lib/auth');

exports.router = router;

function validIdentity(character) {
    return character && character.name && character.title && character.appearance &&
        character.personality && character.classes && character.alignment && character.money;
}

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
// POST identities/
router.post('/', function (req, res) {
    const mongoDB = req.app.locals.mongoDB;
    console.log(req.body);

    if (validIdentity(req.body)) {
        getIdentityById(req.params.identityId, mongoDB)
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
                        user: '/identities/${id}'
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
        })
    }

});

// PUT identities/:id
router.put('/:id', function (req, res) {


});

// DELETE identities/:id
router.delete('/:id', function (req, res) {


});

function getIdentity(mongoDB) {
    const identityCollection = mongoDB.collection('identities');
    return identityCollection
        .find()
        .project({ "_id": false })
        .toArray()
        .then((results) => {
            return Promise.resolve(results);
        });
}

function getIdentityById(identityId, mongodb) {
    const identityCollection = mongodb.collection('identities');
    return identityCollection
        .find( { _id: ObjectId(identityId) })
        .toArray()
        .then((results) => {
            return Promise.resolve(results[0]);
        });
}

// GET identities/
router.get('/', function (req, res) {
    console.log("-- GET request /identities/");
    const mongoDB = req.app.locals.mongoDB;
    getIdentity(mongoDB)
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

// GET identities by id
router.get('/:id', function (req, res) {


});
