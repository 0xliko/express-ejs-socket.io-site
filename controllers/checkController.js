const Attendant = require('../models/attendant');
const Category = require('../models/category');
var TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;


const util = require("../helper/Utils");
console.log(util)
exports.attend_check = (req, res, next) => {
    res.render('pages/attend/check', {
        pageTitle: 'Election Day | Attendant Check'
    });
};


exports.attendAjax = (req, res, next) => {
    var type = req.body.type;
    var data = req.body.data;

    if (type == "attend-change") {
        var attend_date = new Date();
        if (data.attend_type == "Did not attend")
            attend_date = "";
        Attendant.findByIdAndUpdate(data._id, {status: data.attend_type, attend_date: attend_date})
            .then(result => {
                if (typeof attend_date != "string") {
                    attend_date = util.dateFormat(attend_date);
                }
                if (SOCKETSERVER) {
                    SOCKETSERVER.to("check").emit('message', {
                        type: "attend_change",
                        _csrf: req.body._csrf,
                        attend_type: data.attend_type,
                        date: attend_date,
                        _id: data._id,
                    });
                    SOCKETSERVER.to("update").emit('message');

                }
                res.write(JSON.stringify({success: true, date: attend_date}));
                res.end();
            })
            .catch(err => {
                console.log(err)
                res.write(JSON.stringify({success: false}));
                res.end();
            });
    }
    else if (type == "category-change") {
        Attendant.findByIdAndUpdate(data._id, {categories: data.categories})
            .then(result => {
                if (SOCKETSERVER) {
                    SOCKETSERVER.to("check").emit('message', {
                        type: "category_change",
                        _csrf: req.body._csrf,
                        categories: data.categories,
                        _id: data._id,
                    })
                    SOCKETSERVER.to("update").emit('message');
                }

                res.write(JSON.stringify({success: true}));
                res.end();
            })
            .catch(err => {
                res.write(JSON.stringify({success: false}));
                res.end();
            });
    }
    else if (type == "list") {
        Category.find({})
            .then(categories => {
                res.render('pages/attend/check-table', {
                    categories: categories,level:req.user.level
                });
            });
    }
    else {
        res.write("ok");
        res.end();
    }

};


exports.attendTable = (req, res) => {


    const draw = req.body.draw;
    const columns = req.body.columns;
    const start = req.body.start;
    const length = req.body.length;
    const orderFiled = ['no', 'constraint', 'birthday', 'thigh', 'name', 'reg_num', '', '', 'attend_date', 'sheet_num'][req.body.order[0].column];

    let sort = {};
    let search = {};

    for (let i = 0; i < 10 - req.user.level; i++) {
        if (columns[i].search.value !== "") {
            const searchFiled = ['no', 'constraint', 'birthday', 'thigh', 'name', 'reg_num', 'categories', 'status', 'attend_date', 'sheet_num'][i];
            if (i == 0) {
                search[searchFiled] = 1*columns[i].search.value;
            } else if (i == 7 || i==5) {
                search[searchFiled] = columns[i].search.value;
            }
            else if (i == 9) {
                if(columns[i].search.value.length)
                search[searchFiled] = 1 * columns[i].search.value;
            }
            else if (i == 6) {

                if (columns[i].search.value == "uncategoried")
                    search[searchFiled] = "";
                else
                    search[searchFiled] = {$regex: `.*,${columns[i].search.value},.*`, $options: "m"};
            }
            else
                search[searchFiled] = {$regex: '.*' + columns[i].search.value + '.*'};
        }

    }
    sort[orderFiled] = req.body.order[0].dir == "desc" ? 1 : -1;

    var sheet_num = req.user.sheet_num;
    if (sheet_num != 0) search.sheet_num = 1 * sheet_num;

    const $query = [
        {$sort: sort},
        {
            $project: {
                birthday: {$dateToString: {format: "%Y/%m/%d", date: "$birthday", timezone: TIMEZONE}},
                name: 1,
                thigh: 1,
                reg_num: 1,
                no:1,
                constraint: 1,
                categories: 1,
                status: 1,
                sheet_num: 1, //{$convert: {input: "$sheet_num", to: "string"}},
                uid: {$convert: {input: "$uid", to: "string"}},
                attend_date: {$dateToString: {format: "%Y/%m/%d", date: "$attend_date", timezone: TIMEZONE}}
            }
        }, {
            $match: search
        }
    ];
    var mainQuery = {};
    if (sheet_num != 0) mainQuery.sheet_num = sheet_num;
    Attendant.count(mainQuery, (err, count) => {
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

