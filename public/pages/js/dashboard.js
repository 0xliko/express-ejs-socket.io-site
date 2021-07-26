var mainChart;
let categoryCharts = {};
let categories = [];
$(document).ready(function () {


    function getChartData() {

        var mode = $(".mode").val();
        ajaxFn(location.href, {type: "chart-data", data: {mode: mode, category: "main"}}, "json", function (res) {

            mainChart.data[0].value = res.data[0];
            mainChart.data[1].value = res.data[1];

            if (res.data[0] == 0 && res.data[1] == 0)
                mainChart.values = [1, 1];//res.data;
            else
                mainChart.values = res.data;
            mainChart.redraw();
            $(".main-item .not-count").text(res.data[1]);
            $(".main-item .attend-count").text(res.data[0]);
            $(".main-item .total-count").text(res.data[0]+res.data[1]);
        },true);

        for (let i = 0; i < categories.length; i++) {

            ajaxFn(location.href, {
                type: "chart-data",
                data: {mode: mode, category: categories[i]}
            }, "json", function (res) {

                categoryCharts[res.category].data[0].value = res.data[0];
                categoryCharts[res.category].data[1].value = res.data[1];
                if (res.data[0] == 0 && res.data[1] == 0)
                    categoryCharts[res.category].values = [1, 1];
                else
                    categoryCharts[res.category].values = res.data;
                categoryCharts[res.category].redraw();

                $(`.category-item[categoryFor="${res.category}"] .not-count`).text(res.data[1]);
                $(`.category-item[categoryFor="${res.category}"] .attend-count`).text(res.data[0]);
                $(`.category-item[categoryFor="${res.category}"] .total-count`).text(res.data[0] + res.data[1]);



            },true);
        }

    }

    mainChart = Morris.Donut({
        element: $(".main-chart"),
        data:
            [{
                label: "",
                value: 100
            }, {
                label: "",
                value: 0
            }],
        resize: !0,
        colors: ["#0eca0e","#ff2f00"],
        formatter:function (y, data) { data.label = ""; return '';}
    });

    $(".category-chart").each(function (index, ele) {
        var chart = Morris.Donut({
            element: ele,
            data:
                [{
                    label: "",
                    value: 100
                }, {
                    label: "",
                    value: 0
                }],
            resize: !0,
            formatter:function (y, data) { data.label = ""; return '';},
            colors: ["#0eca0e","#ff2f00"]
        });
        var category = $(ele).attr("categoryFor");
        categories.push(category);
        categoryCharts[category] = chart;

    });

    $(".mode").change(getChartData);
    getChartData();
    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit("join","update");
    });
    socket.on('message',function(message){
      getChartData();
    });
});