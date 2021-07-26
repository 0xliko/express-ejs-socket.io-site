const Category = require('../models/category');
const Attendant = require('../models/attendant');
var TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;


exports.categories = (req, res, next) => {
    res.render('pages/category/categories', {
        pageTitle: 'Election Day | Category Management'
    });
};


exports.categoryAjax = (req, res, next) => {
    var type = req.body.type;
    var data = req.body.data;

    if (type == "save") {

        if (data._id == 0) {
            delete data._id;
            new Category(
                data
            ).save()
                .then(result => {
                    res.write(JSON.stringify({success: true, data: result}));
                    res.end();
                }).catch(err => {
                res.write(JSON.stringify({success: false}));
                res.end();
            });
        } else {
            var _id = data._id;
            delete data._id;
            Category.findByIdAndUpdate(_id,
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
        Category.find({name: data.name}).then(categories => {

            var exists = categories.find(function (category) {
                return category.name == data.name && category._id != data._id
            });
            res.write(JSON.stringify({exists: exists}));
            res.end();
        });
    }
    else if (type == "remove") {
        Category.findByIdAndDelete(data._id).then(result => {
            res.write(JSON.stringify({success: result}));
            res.end();
        });
    }
    else if (type == "list"){
         Category.find({}).then(categories=>{
            res.render('pages/category/categories-table', {
                categories:categories
            });
        });
    }
    else{
        res.write("ok");
        res.end();
    }

};

exports.adding_users = (req, res, next) => {
    res.render('pages/category/adding_users', {
        pageTitle: 'Election Day | Add Users to Category'
    });
};



exports.addingUserAjax = (req, res, next) => {
    var type = req.body.type;
    var data = req.body.data;

    if (type == "save") {
    }
    else if(type == "category-change"){
        Attendant.findByIdAndUpdate(data._id,{categories:data.categories})
            .then(result=>{
                if(SOCKETSERVER) {
                    SOCKETSERVER.to("adding-user").emit('message', {
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
            .catch(err=>{
                res.write(JSON.stringify({success: false}));
                res.end();
            });
    }
    else if (type == "list"){
        Category.find({})
            .then(categories=>{
            res.render('pages/category/adding-user-table', {
                categories:categories
            });
        });

    }
    else{
        res.write("ok");
        res.end();
    }

};



exports.userCategoryTable = (req, res) => {
    const draw = req.body.draw;
    const columns = req.body.columns;
    const start = req.body.start;
    const length = req.body.length;
    const orderFiled = ['no', 'constraint', 'birthday','thigh','name', 'reg_num', 'uid','category'][req.body.order[0].column];

    let sort = {};
    let search = {};
    for (let i = 0; i < 8; i++) {
        if (columns[i].search.value !== "") {
            const searchFiled = ['no', 'constraint', 'birthday','thigh','name', 'reg_num', 'uid', 'categories'][i];
            if(i==7){
                if(columns[i].search.value=="uncategoried")
                    search[searchFiled] = "";
                else
                 search[searchFiled] = {$regex: `.*,${columns[i].search.value},.*`,$options:"m"};
            }
            else if(i==5)
                search[searchFiled] = columns[i].search.value;
            else
                search[searchFiled] = {$regex: '.*' + columns[i].search.value + '.*'};
        }

    }
    sort[orderFiled] = req.body.order[0].dir == "desc" ? 1 : -1;

    var sheet_num = req.user.sheet_num;
    if(sheet_num!=0) search.sheet_num = 1*sheet_num;
    const $query = [
        {$sort: sort},
        {
            $project: {
                birthday: {$dateToString: {format: "%Y/%m/%d", date: "$birthday", timezone: TIMEZONE}},
                name: 1,
                thigh: 1,
                reg_num: 1,
                constraint: 1,
                categories:1,
                sheet_num: 1,
                no: {$convert: {input: "$no", to: "string"}},
                uid: {$convert: {input: "$uid", to: "string"}}
            }
        }, {
            $match: search
        }
    ];

    var mainQuery = {};
    if(sheet_num!=0) mainQuery.sheet_num = sheet_num;
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
