var express = require('express');
var router = express.Router();
var Browser = require('zombie');
var phantom = require('phantom');
var fs = require('fs');
var wordpress = require('wordpress');

// var wp = wordpress.createClient({
//     "url": 'http://yardsalecu.wordpress.com/',
//     "username": 'rodch100',
//     "password": 'Mo029240362@'
// });


/* GET users listing. */
router.get('/', function(req, res) {

        res.send(200);
});



module.exports = router;