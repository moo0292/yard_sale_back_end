var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

mongoose.connect('mongodb://heroku_app28817905:r5o4dl99dfglmnvg70opchtsn@ds063809.mongolab.com:63809/heroku_app28817905');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error:'));

var User, Item;
var Schema = mongoose.Schema;

var userSchema = new Schema({
    firstname: String,
    lastname: String,
    local: {
        email: String,
        password: String
    },
    currentlocation: String,
    isAuthenticated: Boolean,
    isFacebookLogin: Boolean,
    authenticationKey: String,
    current_sell: [{
        type: Schema.Types.ObjectId,
        ref: 'Item'
    }]
});

var itemSchema = new Schema({
    name: String,
    price: Number,
    category: String,
    image: [String],
    email: String,
    detail: String,
    date: {
        type: Date,
        default: Date.now
    },
    source: String,
    weblink: String,
    location: String,
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};


userSchema.methods.validPassword = function(password) {
    console.log("password: ", password);
    console.log("local password: ", this.local.password);
    console.log("bcrypt: ", bcrypt.compareSync(password, this.local.password));
    return bcrypt.compareSync(password, this.local.password);
};

User = mongoose.model('User', userSchema);
Item = mongoose.model('Item', itemSchema);

module.exports = {
    "User": User,
    "Item": Item
};