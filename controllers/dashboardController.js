const Attendant = require('../models/attendant');
const Category = require('../models/category');
const utils = require("../helper/Utils");
exports.getDashboard = (req, res, next) => {
    Category.find({}).then(categories => {
        res.render('pages/dashboard/dashboard', {
            pageTitle: 'Election Day | Dashboard',
            categories: categories
        });
    }).catch(err => {
        res.render('pages/dashboard/dashboard', {
            pageTitle: 'Election Day | Dashboard',
            categories: []
        });
    })

};


exports.postDashboard = (req, res, next) => {
    let type = req.body.type;
    let data = req.body.data;
    let category = data.category;
    let mode = data.mode;


    var countQuery = {};

    if(mode == 2 ){
        var date = utils.getThreeAgoDay();
        countQuery.$or  =  [
            { "attend_date":{$gte : date}},
            { "attend_date":""}
            ];
    }
    if (type == "chart-data") {
        if (category != "main")
            countQuery.categories = {$regex: `.*${category}.*`};


        var $query = Attendant.find(countQuery);

        $query.count({}, function (err, count) {

            $query.count({status: "Attended"},
                (error,statusCount) => {
                    res.write(JSON.stringify({data: [statusCount,count-statusCount],category:category}));
                    res.end();
                });
        });
    }
}