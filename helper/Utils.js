
const util = {};
util.dateFormat = function(date){
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if(month<10) month="0"+month;
    if(day<10) day="0"+day;
    return `${year}/${month}/${day}`;
}
util.getThreeAgoDay = function(){
    let date = new Date();
    date.setHours(0,0,0,0);
    date = new Date(date.getTime()-3*24*3600*1000);
    return date;

}
module.exports = util;

