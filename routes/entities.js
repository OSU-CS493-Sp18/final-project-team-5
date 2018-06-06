const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

router.post('/', function (req, res) {
  const collection = req.app.locals.mongoDB.collection('entities');
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

router.get('/', function (req, res) {
  const collection = req.app.locals.mongoDB.collection('entities');
  collection.find()
  .toArray()
  .then((results) => {
    console.log(results);
    res.status(200).json(results);
  });
});

router.get('/:id', function (req, res) {
  const collection = req.app.locals.mongoDB.collection('entities');
  console.log(req.params.id);
  collection.find({ _id: ObjectId(req.params.id) })
  .toArray()
  .then((results) => {
    res.status(200).json(results);
  })
  .catch((err) => {
    res.status(500).json({
      error: "Failed to fetch an entity."
    });
  });
});

exports.router = router;
