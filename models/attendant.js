const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const attendantSchema = new Schema({
    no:Number,
    constraint:String,
    thigh:String,
    name: String,
    birthday:Date,
    reg_num: String,
    uid: Number,
    status:String,
    categories:String,
    attend_date:Date,
    sheet_num:Number
});

module.exports = mongoose.model('Attendant', attendantSchema);

