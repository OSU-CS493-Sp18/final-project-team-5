const router = module.exports = require('express').Router()

router.use('/users', require('./users').router)
router.use('/identities', require('./identities').router)
router.use('/entities', require('./entities').router)
router.use('/regions', require('./regions').router)
