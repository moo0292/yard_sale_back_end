var express = require('express');
var router = express.Router();
var Browser = require('zombie');
var phantom = require('phantom');
var fs = require('fs');
var wordpress = require('wordpress');

// var wp = wordpress.createClient({
//     "url": '---',
//     "username": '---',
//     "password": '---'
// });


/* GET users listing. */
router.get('/', function(req, res) {

        res.send(200);
});



module.exports = router;
