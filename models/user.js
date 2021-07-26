const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({    
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true 
    },
    resetToken: String,
    resetTokenExpiration: Date,
    level:Number,
    name : String,
    sheet_num:Number

});

module.exports = mongoose.model('User', userSchema);

