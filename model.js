const mongoose = require('mongoose');

const UserSchema = {
    name:String,
    email:String,
    password:String
}

const User = mongoose.model('User', UserSchema);

module.exports = User