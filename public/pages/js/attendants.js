/*
Upload.prototype.progressHandling = function (event) {
    var percent = 0;
    var position = event.loaded || event.position;
    var total = event.total;
    var progress_bar_id = "#progress-wrp";
    if (event.lengthComputable) {
        percent = Math.ceil(position / total * 100);
    }
    // update progressbars classes so it fits your code
    $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
    $(progress_bar_id + " .status").text(percent + "%");
};

*/

$(document).ready(function () {


    function searchTable() {
        ajaxFn(location.href, {type: "list"}, "html", function (res) {
            $('.table-container').html(res);
        })
    }

    $(".btn-add").click(function () {
        $("#modal-title").text("إضافة المصاحبة");
        $(".form input").val("");
        $("#edit-modal").modal();
    });

    $(".btn-save").click(function (e) {
        e.preventDefault();

        $('.form').parsley().whenValidate().then(function () {
            var data = {};
            $("#edit-modal .form input,#edit-modal .form select").each(function (index, ele) {
                data[$(ele).attr("name")] = $(ele).val();
            });
            ajaxFn(location.href, {type: "existing", data: data}, "json", function (res) {
                if (res.exists) {
                    showMessage("warning", "UID Duplicated");
                    return;
                }
                ajaxFn(location.href, {type: "save", data: data}, "json", function (res) {
                    if (res.success) {
                        showMessage("success", "حفظ بنجاح!");
                        $("#edit-modal").modal("hide");
                        dataTable.ajax.reload();

                    } else {
                        showMessage("error", "خطأ في الخادم!")
                    }
                });
            });

        })
    });

    function deleteUser(ele) {
        var _id = $(ele).parents("tr").attr("row_id");
        ajaxFn(location.href, {type: "remove", data: {_id: _id}}, "json", function (res) {
            if (res.success) {
                dataTable.ajax.reload();
                showMessage("success", "Attendant successfully removed");
            } else {
                showMessage("error", "خطأ في الخادم!")
            }
        });
    }

    $(".table-container").on("click", ".btn-remove", function () {
        var self = this;
        bootbox.dialog(
            {
                message: "هل أنت متأكد من إزالة هذا المصاحب?",
                buttons: {
                    confirm: {
                        label: 'نعم',
                        className: 'btn-outline-success pull-right',
                        callback: function () {
                            deleteUser(self);
                        }
                    },
                    cancel: {
                        label: 'رقم',
                        className: 'btn-outline-danger pull-right'
                    }
                }

            });
    });

    $(".table-container").on("click", ".btn-edit", function () {
        var tr = $(this).parents('tr');
        $("#modal-title").text("تحرير المصاحبة");
        $("input,select", "#edit-modal .form").each(function (index, ele) {
            if (index == 0) return;
            ele.value = $("td", tr)[index - 1].innerText;
        });
        $("input[name=_id]").val($(tr).attr("row_id"));
        $("input[name=uid]").val($(tr).attr("uid"));
        $("#edit-modal").modal();
    });

    function uploadProgress(event) {
        var percent = 0;
        var position = event.loaded || event.position;
        var total = event.total;

        if (event.lengthComputable) {
            percent = Math.ceil(position / total * 100);
        }
        console.log(percent)
    }

    function parseFile(file) {
        var data = new FormData();
        data.append("file", file);
        data.append("type", "file");
        data.append("_csrf", $('meta[name="_csrf"]').attr('content'));



        $('.rightbar-overlay').show();

        $.ajax({
            url: location.href,
            data: data,
            type: 'post',
            dataType: "json",
            contentType:false,
            processData: false,
            xhr: function () {
                let myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    myXhr.upload.addEventListener('progress', uploadProgress, false);
                }
                return myXhr;
            },
            success: function (res) {
                $('.rightbar-overlay').hide();
                if(!res.success){
                    showMessage("error",res.reason);
                } else {
                    var message = "فشل استيراد المستخدمين التاليين! ";
                    res.failed.forEach(function(item,i){
                       message += `<br>
                         uid:${item.uid} invalid birthday type-${item.birthday}
                       `
                    });
                    showMessage("success","Successfully imported");
                    if(res.failed.length){
                        bootbox.dialog(
                            {
                                message: message,
                                buttons: {
                                    close: {
                                        label: 'أغلق',
                                        className: 'btn-outline-danger pull-right'
                                    }
                                }

                            });
                    }
                    searchTable();
                }

            },
            error: function (err) {
                $('.rightbar-overlay').hide();
                showMessage("error","خطأ في الشبكة!")
            }
        });
    }

    $(".btn-import").click(function () {
        $("<input type='file'accept='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'  style='display:none' />")
            .appendTo($("body"))
            .change(function (e) {
                var file = this.files[0];
                parseFile(file);
                $(this).remove();
            })
            .click();
    });

    function makeDidNot(){

        ajaxFn(location.href, {type: "make-did-not", data: {}}, "json", function (res) {
            if (res.success) {
                showMessage("success", "All attendants became to 'did not attend' status");
            } else {
                showMessage("error", "خطأ في الخادم!")
            }
        });
    }
    $(".btn-to-not").click(e=>{

        bootbox.dialog(
            {
                message: `هل أنت متأكد من جعل جميع الحاضرين "لم يحضروا"?`,
                buttons: {
                    confirm: {
                        label: 'نعم',
                        className: 'btn-outline-success pull-right',
                        callback: function () {
                            makeDidNot();
                        }
                    },
                    cancel: {
                        label: 'رقم',
                        className: 'btn-outline-danger pull-right'
                    }
                }

            });
    });
    searchTable();


});