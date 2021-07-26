$(document).ready(function () {


    function searchTable() {
        ajaxFn(location.href, {type: "list"}, "html", function (res) {
            $('.table-container').html(res);
        })
    }

    searchTable();

    $(".table-container").on('change','.category-setting',function(){
        let tr = $(this).parents("tr");
        var _id = $(tr).attr("row_id");
        var categories = $(this).val().join(",");
        categories = "," + categories + ","
        ajaxFn(location.href,{type:"category-change",data:{categories:categories,_id:_id}},'json',function(res){
           if(res.success)
           {
               showMessage("success","تم تغيير الفئة بنجاح!");
           }
           else{
               showMessage("error","تغيير فئة الخطأ!");
           }
        });
    });



    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit("join","adding-user");
    });
    socket.on('message',function(message){

        var _csrf = $('meta[name="_csrf"]').attr('content');

        if(message.type == "category_change" && _csrf !=  message._csrf){



            if($(`tr[row_id=${message._id}]`).length){

                var tr = $(`tr[row_id="${message._id}"]`);
                var categories = message.categories.split(",");
                categories.pop();
                categories.shift();
                $("select",tr).val(categories).select2();
                var uid = $("td:nth-child(7)",tr).text();
                showMessage("success",`${uid} تغيرت الفئة!`);
            }
        }
    });


});