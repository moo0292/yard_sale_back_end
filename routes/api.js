var express = require('express');
var router = express.Router();
var async = require('async');
var models = require('../models/');

router.get('/', function(req, res) {
    //have to get 20 of each categories
    models.Item.find({}, function(err, data) {
        console.log(data.length);
        res.redirect('/');
    });
});

router.get('/twenty/:type/skip/:number', function(req, res) {
    var type = req.params.type;
    var numberString = req.params.number;
    var number = parseInt(numberString, 10);

    models.Item.find({
        category: type
    }).skip(number).limit(20).sort({
        date: -1
    }).exec(function(err, item) {
        res.jsonp(item);
    });
});

router.get('/search/:text', function(req, res) {
    var type = req.params.text;

    models.Item.find({
        $or: [{
            detail: new RegExp(" " + type + " ", "i")
        }, {
            detail: new RegExp(type + " ", "i")
        }, {
            detail: new RegExp(" " + type, "i")
        }, {
            name: new RegExp(" " + type + " ", "i")
        }, {
            name: new RegExp(type + " ", "i")
        }, {
            name: new RegExp(" " + type, "i")
        }]
    }).limit(100).sort({
        date: -1
    }).exec(function(err, item) {
        res.jsonp(item);
    });
});

router.get('/twenty_all', function(req, res) {
    models.Item.find({
        category: "Apartment"
    }).limit(20).sort({
        date: -1
    }).exec(function(err, apartment) {
        models.Item.find({
            category: "Book"
        }).limit(20).sort({
            date: -1
        }).exec(function(err, book) {
            models.Item.find({
                category: "Furniture"
            }).limit(20).sort({
                date: -1
            }).exec(function(err, furniture) {
                models.Item.find({
                    category: "Electronic"
                }).limit(20).sort({
                    date: -1
                }).exec(function(err, electronic) {
                    models.Item.find({
                        category: "Bike"
                    }).limit(20).sort({
                        date: -1
                    }).exec(function(err, bike) {
                        models.Item.find({
                            category: "Free"
                        }).limit(20).sort({
                            date: -1
                        }).exec(function(err, free) {
                            var allO = {
                                "Apartment": apartment,
                                "Book": book,
                                "Furniture": furniture,
                                "Electronic": electronic,
                                "Bike": bike,
                                "Free": free
                            };
                            // var allO = apartment.concat(pet, furniture, electronic, bike, free);
                            // console.log(allO);
                            res.jsonp(allO);
                        })
                    })
                })
            })
        })
    });
});

module.exports = router;