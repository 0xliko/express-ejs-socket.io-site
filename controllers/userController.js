const User = require('../models/user');
const Attendant = require('../models/attendant');
const bcrypt = require('bcryptjs');
const xlsxFile = require('read-excel-file/node');
var tou8 = require('buffer-to-uint8array');
const fs = require("fs");

var TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

exports.admins = (req, res, next) => {
    User.find({}).exec((err, users) => {

        res.render('pages/users/admins', {
            pageTitle: 'Election Day | Admins',
            admins: users
        });
    });
};

exports.adminsAjax = (req, res, next) => {
    var type = req.body.type;
    var data = req.body.data;

    if (type == "save") {

        if (data._id == 0) {

            bcrypt
                .hash(data["password"], 12)
                .then(hashedPassword => {

                    const user = new User({
                        email: data["email"],
                        name: data["name"],
                        password: hashedPassword,
                        sheet_num:data["sheet_num"],
                        level: 1
                    });
                    return user.save();
                }).then(result => {

                res.write(JSON.stringify({success: true, data: result}));
                res.end();
            });

        } else {
            var user = {
                email: data["email"],
                name: data["name"],
                sheet_num: data["sheet_num"]
            };
            if (data.password)
                user.password = bcrypt.hashSync(data.password, 12);
            User.findByIdAndUpdate(data._id,
                user
            ).then(result => {
                res.write(JSON.stringify({success: true, data: result}));
                res.end();
            }).catch(err => {
                res.write(JSON.stringify({success: false}));
                res.end();
            })
        }

    }
    else if (type == "existing") {
        User.find({email: data.email}).then(users => {

            var exists = users.find(function (user) {
                return user.email == data.email && user._id != data._id
            });
            res.write(JSON.stringify({exists: exists}));
            res.end();
        });
    }
    else if (type == "remove") {
        User.findByIdAndDelete(data._id).then(result => {
            res.write(JSON.stringify({success: result}));
            res.end();
        });
    }
    else {
        res.write("ok");
        res.end();
    }
};

exports.attendants = (req, res, next) => {

    res.render('pages/users/attendants', {
        pageTitle: 'Election Day | Attendants'
    });

};
exports.attendantAjax = (req, res, next) => {

    var type = req.body.type;
    var data = req.body.data;

    if (type == "save") {
        if (data._id == 0) {

            delete data._id;
            data.status = LANGS[CUR_LANG]["not_attend"];
            data.categories = "";
            new Attendant(
                data
            ).save()
                .then(result => {
                    res.write(JSON.stringify({success: true, data: result}));
                    res.end();
                }).catch(err => {
                res.write(JSON.stringify({success: false}));
                res.end();
            });

        }
        else {
            var _id = data._id;
            delete data._id;

            Attendant.findByIdAndUpdate(_id,
                data
            ).then(result => {
                res.write(JSON.stringify({success: true, data: result}));
                res.end();
            }).catch(err => {
                res.write(JSON.stringify({success: false}));
                res.end();
            });
        }
    }
    else if (type == "existing") {
                Attendant.find({uid: data.uid}).then(attendants => {
                    const exists = attendants.find(function (attendant) {
                        return attendant.uid == data.uid && attendant._id != data._id
                    });
                    res.write(JSON.stringify({exists: exists}));
                    res.end();
                });
    } else if (type == "make-did-not") {
                Attendant.updateMany({},{status:LANGS[CUR_LANG]["not_attend"]})
                    .then(result=>{
                        if(SOCKETSERVER) {
                            SOCKETSERVER.to("check").emit('message', {
                                type: "clear"
                            })
                        }
                    res.write(JSON.stringify({success:true}));
                    res.end();
                }).catch(err=>{
                    res.write(JSON.stringify({success:false}));
                    res.end();
                })
    }
    else if (type == "remove") {
        Attendant.findByIdAndDelete(data._id).then(result => {
            res.write(JSON.stringify({success: result}));
            res.end();
        }).catch(err => {
            res.write(JSON.stringify({success: false}));
            res.end();
        })
    }
    else if (type == "list") {
        res.render('pages/users/attendant-table', {});
    }
    else if (type == "file") {
        const uploadPath = __dirname + '/../uploads/users.xls';
        Attendant.find({}).select('uid')
            .then(attendents => {
                var old_uids = attendents.map(function (item) {
                    return "" + item.uid;
                });
                req.files.file.mv(uploadPath, function () {
                    xlsxFile(uploadPath, { getSheets: true }).then(sheets=>{
                        var sheetCount = sheets.length;
                        var data = [];
                        var uids = [];
                        var dataInvalid = [];
                        var curCount = 0;
                        sheets.forEach((obj)=> {

                            xlsxFile(uploadPath,{sheet:obj.name}).then((rows) => {


                                for (let i = 0; i < rows.length; i++) {
                                    var item = rows[i];

                                    let pattern1 = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{1,4}$/; // dd/mm/yyyy
                                    let pattern2 = /^(0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-]\d{1,4}$/; // mm/dd/yyyy

                                    if (isNaN(item[0] * 1) || isNaN(item[18] * 1) || uids.indexOf(item[18]) > -1
                                        || old_uids.indexOf(item[18]) > -1) continue;
                                    if(!item[3] || typeof item[3] != "string") {
                                        dataInvalid.push({uid: item[18],birthday:item[3],reason: "birthday invalid"});
                                        continue;
                                    }
                                    try{
                                        item[3] = item[3].replace(/\s/g,"").replace(/\(/g,"/").replace(/\)/g,"/").replace(/\-/g,"/");
                                    }catch (e) {
                                        console.log(e)
                                    }
                                    if (!pattern2.test(item[3])) {
                                        if (!pattern1.test(item[3])) {
                                            dataInvalid.push({uid: item[18],birthday:item[3],reason: "birthday invalid"});
                                            continue;
                                        }
                                        else {
                                            var birthdays;
                                            birthdays = item[3].split("/");
                                            item[3] = birthdays[1] + "/" + birthdays[0] + "/" + birthdays[2];
                                        }
                                    }

                                    data.push({
                                        no: item[0],
                                        constraint: item[1],
                                        name: item[11],
                                        birthday: item[3] || "00/00/0000",
                                        thigh: item[5],
                                        uid: item[18],
                                        reg_num: item[14] || "",
                                        status: LANGS[CUR_LANG]["not_attend"],
                                        categories: "",
                                        attend_date: "",
                                        sheet_num: obj.name
                                    });

                                    uids.push(item[18]);
                                }
                                curCount++;
                                if(curCount == sheetCount){

                                    Attendant.insertMany(data, ret => {
                                        console.table(ret);
                                        res.write(JSON.stringify({success: true, failed: dataInvalid}));
                                        res.end();
                                    });
                                }


                            });
                        });





                    });
                });
            });

    }
    else {
        res.write("ok");
        res.end();
    }

}
;
exports.attendantTable = (req, res) => {


    const draw = req.body.draw;
    const columns = req.body.columns;
    const start = req.body.start;
    const length = req.body.length;
    const orderFiled = ['no', 'constraint', 'birthday','thigh','name', 'reg_num', 'uid'][req.body.order[0].column];

    let sort = {};
    let search = {};
    for (let i = 0; i < 7; i++) {
        if (columns[i].search.value !== "") {
            const searchFiled = ['no', 'constraint', 'birthday','thigh','name', 'reg_num', 'uid'][i];
            if(i==0)
                search[searchFiled] = 1*columns[i].search.value;
            else if(i==5)
              search[searchFiled] = columns[i].search.value;
            else
              search[searchFiled] = {$regex: '.*' + columns[i].search.value + '.*'};
        }
    }
    sort[orderFiled] = req.body.order[0].dir == "desc" ? 1 : -1;


    const $query = [
        {$sort: sort},
        {
            $project: {
                birthday: {$dateToString: {format: "%Y/%m/%d", date: "$birthday", timezone: TIMEZONE}},
                name: 1,
                thigh: 1,
                reg_num: 1,
                constraint: 1,
                no: 1,
                uid: {$convert: {input: "$uid", to: "string"}}
            }
        }, {
            $match: search
        }
    ];
    Attendant.count({}, (err, count) => {
        Attendant
            .aggregate($query).count("filteredCount").then(result => {
            result = result[0] || {filteredCount: 0}
            $aggregate = Attendant.aggregate($query);
            $aggregate.skip(start * 1).limit(length * 1).then(attendants => {
                res.write(JSON.stringify({
                    draw: draw,
                    recordsTotal: count | 0,
                    recordsFiltered: result.filteredCount,
                    data: attendants
                }));
                res.end();
            }).catch(error => {
                res.write(JSON.stringify({
                    draw: draw,
                    recordsFiltered: 0,
                    data: []
                }));
                res.end();
                console.log("select error");
            });
        }).catch(error => {
            res.write(JSON.stringify({
                draw: draw,
                recordsFiltered: 0,
                data: []
            }));
            res.end();
            console.log(error)
            console.log("counter error");
        })


    });


};