$(document).ready(function () {


    function searchTable() {
        ajaxFn(location.href, {type: "list"}, "html", function (res) {
            $('.table-container').html(res);
        })
    }

    searchTable();

    $(".table-container").on('change', '.attend-change', function () {
        let tr = $(this).parents("tr");
        var _id = $(tr).attr("row_id");
        var attend_type = this.value;
        ajaxFn(location.href, {
            type: "attend-change",
            data: {attend_type: attend_type, _id: _id}
        }, 'json', function (res) {
            if (res.success) {
                $('td:nth-child(9)', tr).text(res.date);
                showMessage("success", "تم تغيير نوع الحضور بنجاح!");
            }
            else {
                showMessage("error", "خطأ تغيير نوع الحضور!");
            }
        });
    });

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


    function getAttendantInfo(tr){
        var name = $("td:nth-child(5)",tr).text();
        var reg_num = $("td:nth-child(6)",tr).text();
        return name + "-" + reg_num;
    }

    var socket = io.connect();
    socket.on('connect',function(){
        socket.emit("join","check");
    });
    socket.on('message',function(message){

        var _csrf = $('meta[name="_csrf"]').attr('content');

        if(message.type == "attend_change" && _csrf !=  message._csrf){

            if($(`tr[row_id=${message._id}]`).length){

                var tr = $(`tr[row_id="${message._id}"]`);
                $(".attend-change",tr).val(message.attend_type);
                $("td:nth-child(9)",tr).text(message.date);
                var uid = $("td:nth-child(7)",tr).text();
                var name = getAttendantInfo(tr);
                showMessage("success",`${name} تغير نوع الحضور!`);
            }
        }
        if(message.type == "clear"){
            $("tr td .attend-change").val("Did not attend");
            $("tr td:nth-child(9)").text("");
            showMessage("success","تم تعيين جميع أنواع الحضور على أنها \"لم يحضر\" بواسطة المشرف المتميز");
        }

        if(message.type == "category_change" && _csrf !=  message._csrf){



            if($(`tr[row_id=${message._id}]`).length){

                var tr = $(`tr[row_id="${message._id}"]`);
                var categories = message.categories.split(",");
                categories.pop();
                categories.shift();
                $(".category-setting",tr).val(categories).select2();
                var name = getAttendantInfo(tr);
                showMessage("success",`${name} تغيرت الفئة!`);
            }
        }
    });


});