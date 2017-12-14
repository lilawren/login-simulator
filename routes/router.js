var express = require('express');
var router = express.Router();

// GET /
router.get('/', function (req, res) {
    res.send('Audi, BMW, Mercedes')
});

module.exports = router