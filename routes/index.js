var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var crypto = require('crypto');
var async = require('async');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var Filepicker = require('node-filepicker')
var filepicker = new Filepicker('ApKzfHYdYR1uxCjZ79hZyz');
var AWS = require('aws-sdk');
var models = require('../models/');
var nodemailer = require("nodemailer");
var allObject = []
var isDone = false;
var linkPage = 'http://orangecounty.craigslist.org/'
var number = 100;
var categories = ['fua'];
var fs = require('fs');
var numbers = [0];
var _ = require('underscore');
var wordpress = require('wordpress');



//setting up AWS
var accessKeyId = process.env.ACCESSKEYID;
var secretAccessKey = process.env.SECRET_ACCESS_KEY;

AWS.config.update({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

var s3 = new AWS.S3();

var wp = wordpress.createClient({
    "url": 'http://www.yardsalecu.com/',
    "username": 'rodch100@mail.chapman.edu',
    "password": process.env.EMAIL_PASSWORD
});


/* GET home page. */
var what_cat = function(input) {
    if (input == 'apa') {
        return "Apartment";
    } else if (input == 'pet') {
        return "Pet";
    } else if (input == 'fua') {
        return "Furniture";
    } else if (input == 'ela') {
        return "Electronic";
    } else if (input == 'bia') {
        return "Bike";
    } else if (input == 'zip') {
        return "Free";
    }
}

var secret = process.env.SECRET_ACCESS_KEY;
var policy;
var policyBase64;
var signature;


router.get('/', function(req, res) {
    res.render('index', {
        title: 'Express'
    });
});

router.post('/upload_image', multipartMiddleware, function(req, res) {
    console.log("upload");

    var file = req.files.file,
        filePath = file.path,
        //        fileName = file.name, file name passed by client. Not used here. We use the name auto-generated by Node
        lastIndex = filePath.lastIndexOf("/"),
        tmpFileName = filePath.substr(lastIndex + 1),
        image = req.body;

    image.fileName = tmpFileName;
    console.log(tmpFileName);

    console.log(image);
    res.send(200);
});

router.post('/submit', multipartMiddleware, function(req, res) {
    console.log("ok");
    if (req.body.hasImage) {
        var file = req.files.file,
            filePath = file.path,
            //        fileName = file.name, file name passed by client. Not used here. We use the name auto-generated by Node
            lastIndex = filePath.lastIndexOf("/"),
            tmpFileName = filePath.substr(lastIndex + 1),
            image = req.body;

        image.fileName = req.body.email + "/" + tmpFileName;
        // console.log(image.fileName);

        var path = file.path;
        fs.readFile(path, function(err, file_buffer) {
            var params = {
                Bucket: "yard_sale_product_image",
                Key: image.fileName,
                Body: file_buffer,
                ContentType: file.headers["content-type"]
            };

            s3.putObject(params, function(perr, pres) {
                if (perr) {
                    console.log("Error uploading data: ", perr);
                    res.send(500);
                } else {
                    console.log("Successfully uploaded data to myBucket/myKey");

                    //this adds to wordpress
                    wp.newPost({
                            title: image.title,
                            status: 'publish', //'publish, draft...',
                            content: '<strong> Detail: ' + image.info + '</strong> \n' + '<strong> Email: ' + image.email + '</strong> \n' + '<strong> Location: ' + image.location + '</strong> \n' + '<img src="' + 'https://s3.amazonaws.com/yard_sale_product_image/' + image.fileName + '"> \n',
                            author: 1, // author id
                            terms: {
                                'category': [1]
                            }
                        },
                        function() {
                            console.log(arguments);
                            res.send(200);
                        });

                    //this finds the person and 
                    models.User.find({
                        "local.email": image.email
                    }).exec(function(err, user) {
                        var p = new models.Item({
                            "name": image.title,
                            "weblink": "none",
                            "price": image.price,
                            "category": image.category,
                            "image": "https://s3.amazonaws.com/yard_sale_product_image/" + image.fileName,
                            "email": image.email,
                            "detail": image.info,
                            "location": image.location,
                            "source": 'yardsale',
                            "userId": image.userId
                        });
                        p.save(function(err, product, numberAffected) {
                            user[0].current_sell.push(product._id);
                            user[0].save();
                            res.send(200);
                        });
                    });
                    res.send(200);
                }
            });
        });
        console.log("This is done");
    } else if (!req.body.hasImage) {

        models.User.find({
            "local.email": req.body.email
        }).exec(function(err, user) {
            var p = new models.Item({
                "name": req.body.title,
                "weblink": "none",
                "price": req.body.price,
                "category": req.body.category.name,
                "image": 'http://topcars.ie/wp-content/uploads/2014/04/businessmanager/no-image-available2.jpg',
                "email": req.body.email,
                "detail": req.body.info,
                "location": req.body.location,
                "source": 'yardsale',
                "userId": req.body.userId
            });
            p.save(function(err, product, numberAffected) {

                user[0].current_sell.push(product._id);
                user[0].save();
                res.send(200);
            });
        });


        res.send(200);
    }
});

router.post('/addObjectToUser', function(req, res) {
    var userId = req.body.userId;
    var objectId = req.body.objectId;
    models.User.find({
        _id: userId
    }).exec(function(err, user) {
        user[0].current_sell.push(objectId);
        user[0].save();
        res.send(200);
    });
});

router.get('/user_sell/:id', function(req, res) {
    var id = req.params.id;

    models.User.findOne({
        _id: id
    }).populate('current_sell').exec(function(err, data) {
        res.json(data);
    });
});

router.get('/no_login/:token', function(req, res) {
    var token = req.params.token;
    models.User.findOne({
        authenticationKey: token
    }).exec(function(err, data) {
        res.json(data);
    });
});

router.get('/delete_item/:id/person_id/:id_two', function(req, res) {
    var id = req.params.id;
    var person_id = req.params.id_two;

    //also needs to remove from the user current sell array
    models.Item.findOneAndRemove({
        _id: id
    }).exec(function(err, data) {
        //remove from the user array
        models.User.findOne({
            _id: person_id
        }).exec(function(err, user) {
            var sellArray = user.current_sell;

            sellArray = sellArray.map(function(element) {
                return element.toString();
            });

            // console.log("This is the id", id);

            // console.log("This is before the splice");
            // console.log(sellArray);

            // var idIndex = _.indexOf(sellArray, "53f4dc7da562af0000d5d386");
            var index = _.indexOf(sellArray, id);
            sellArray.splice(index, 1);

            console.log("This is after the splice");
            console.log(sellArray);

            user.current_sell = sellArray;
            user.save();
            //console.log("This is the index " + idIndex);
            //splice at the index
            res.send(200);
        });
    });
})

router.get('/sendmail/:email/title/:title/body/:body/usermail/:usermail', function(req, res) {
    var email = req.params.email;
    var title = req.params.title;
    var body = req.params.body;
    var usermail = req.params.usermail;

    console.log(title);

    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "yardsalecu@gmail.com",
            pass: process.env.EMAIL_PASSWORD
        }
    });

    smtpTransport.sendMail({
        from: "Yardsale auto", // sender address
        to: email, // comma separated list of receivers
        subject: "The user " + usermail + " is interested in " + title, // Subject line
        text: "This is an automated email from Yardsale \n" + body // plaintext body
    }, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            res.send(200);
            console.log("Message sent: " + response.message);
        }
    });
});

router.get('/sendabuse/email/:email/item/:item/reporter/:reporter', function(req, res) {
    var email = req.params.email;
    var item = req.params.item;
    var reporter = req.params.reporter;


    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "yardsalecu@gmail.com",
            pass: process.env.EMAIL_PASSWORD
        }
    });

    smtpTransport.sendMail({
        from: "Yardsale auto", // sender address
        to: "yardsalecu@gmail.com", // comma separated list of receivers
        subject: "Abuse report", // Subject line
        text: "The object " + item + " by " + email + " is being reported for abuse from " + reporter // plaintext body
    }, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            res.send(200);
            console.log("Message sent: " + response.message);
        }
    });
});


router.get('/get_base', function(req, res) {
    policy = {
        "expiration": "2020-12-31T12:00:00.000Z",
        "conditions": [{
                "bucket": "yard_sale_product_image"
            },
            ["starts-with", "$key", ""], {
                "acl": 'public-read'
            },
            ["starts-with", "$Content-Type", ""],
            ["content-length-range", 0, 524288000]
        ]
    };
    policyBase64 = new Buffer(JSON.stringify(policy), 'utf8').toString('base64');
    console.log("Policy Base64:");
    console.log(policyBase64);

    signature = crypto.createHmac('sha1', secret).update(policyBase64).digest('base64');
    console.log("Signature:");
    console.log(signature);

    var returnObject = {
        "policyBase": policyBase64,
        "signature": signature
    };
    res.json(returnObject);
});

//scrapes data from craiglist
router.get('/populate', function(req, res) {
    var resq = res;

    async.eachSeries(categories, function(category, callbackFinal) {

        async.eachSeries(numbers, function(number, callbackAll) {
            async.series([

                    function(callback) {
                        if (number > 0) {
                            linkPage = 'http://orangecounty.craigslist.org/' + category + '/index' + number + '.html';
                            console.log(linkPage);
                        } else {
                            linkPage = 'http://orangecounty.craigslist.org/' + category + '/'
                            console.log(linkPage);
                        }
                        objectArray = [];
                        request(linkPage, function(error, response, html) {
                            if (!error && response.statusCode == 200) {
                                var $ = cheerio.load(html);
                                $('.row').each(function(i, element) {
                                    var row = $(this);
                                    var newObject = {};
                                    //this
                                    newObject.category = what_cat(category);
                                    newObject.name = row.children('.txt').children('.pl').children('a').text();
                                    newObject.link = 'http://orangecounty.craigslist.org/' + row.children('.txt').children('.pl').children('a').attr("href");
                                    newObject.price = row.children('.txt').children('.l2').children('.price').text();
                                    //var priceText = row.children('.txt').children('.l2').children('.price').text();
                                    //var priceTextSub = priceText.substring(1);
                                    //var priceNumber = parseInt(priceTextSub, 10);
                                    //newObject.price = priceNumber;
                                    objectArray.push(newObject);
                                    console.log("One");
                                });
                                callback(null, "1");
                            }
                        });
                    },
                    function(callback) {
                        //you have to go through all object using async 

                        async.eachSeries(objectArray, function(entry, callbackT) {
                            request(entry.link, function(error, response, htmlTwo) {
                                if (!error && response.statusCode == 200) {
                                    var $ = cheerio.load(htmlTwo);
                                    var picArray = [];
                                    $('#thumbs').children()
                                    var picArray = [];

                                    $('#thumbs').children('a').each(function(i, element) {
                                        var pic = $(this);
                                        picArray.push(pic.attr("href"));
                                    });
                                    if (picArray.length > 0) {
                                        entry.picture = picArray;
                                    } else {
                                        picArray.push('http://topcars.ie/wp-content/uploads/2014/04/businessmanager/no-image-available2.jpg');
                                        entry.picture = picArray;
                                    }
                                    entry.body = $('#postingbody').text();
                                    console.log("two");
                                }
                                if ($('#replylink').attr("href") != undefined) {
                                    var link = 'http://orangecounty.craigslist.org' + $('#replylink').attr("href");
                                    entry.contact = link;
                                    console.log("three");
                                } else {
                                    entry.contact = null;
                                    entry.email = null;
                                };

                                callbackT();
                            });
                        }, function(err) {
                            callback(null, "2");
                        });
                    },
                    //this is getting the email
                    function(callback) {
                        async.eachSeries(objectArray, function(entry, callbackA) {
                            if (entry.contact != null) {
                                request(entry.contact, function(error, response, htmlThree) {
                                    var $ = cheerio.load(htmlThree);
                                    entry.email = $('.anonemail').attr("value");
                                    console.log("four");
                                    callbackA();
                                });
                            } else {
                                callbackA();
                            }
                        }, function(err) {
                            console.log("five");
                            callback(null, "3");
                        });
                    }
                ],
                function() {
                    allObject = allObject.concat(objectArray);
                    console.log("six");
                    callbackAll();
                });
        }, function(err) {
            console.log("seven");
            callbackFinal();
        });
    }, function(err) {
        //this gets call when go through all categories and page
        console.log(allObject.length);
        for (var i = 0; i < allObject.length; i++) {
            //You want to add the data to the model
            var p = new models.Item({
                "name": allObject[i].name,
                "weblink": allObject[i].link,
                "price": allObject[i].price,
                "category": allObject[i].category,
                "image": allObject[i].picture,
                "email": allObject[i].email,
                "detail": allObject[i].body,
                "location": 'orange',
                "source": 'craiglist'
            });
            p.save();
            console.log(allObject[i]);

        }
        console.log(allObject.length);
        allObject = [];
        resq.redirect('/');
    });
});

module.exports = router;