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
        $(".edit-modal-title").text("إضافة فئة");
        $(".form input").val("");
        new Custombox.modal({
            content: {
                effect: 'fadein',
                target: '#edit-modal',
                overlaySpeed: 200,
                overlayColor: "#36404a"

            }
        }).open();
    });

    $(".btn-save").click(function (e) {
        e.preventDefault();

        $('.form').parsley().whenValidate().then(function () {
            var data = {};
            $("#edit-modal .form input").each(function (index, ele) {
                data[$(ele).attr("name")] = $(ele).val();
            });
            ajaxFn(location.href, {type: "existing", data: data}, "json", function (res) {
                if (res.exists) {
                    showMessage("warning", "الفئة مكررة");
                    return;
                }
                ajaxFn(location.href, {type: "save", data: data}, "json", function (res) {
                    if (res.success) {
                        showMessage("success", "حفظ بنجاح!");
                        Custombox.modal.close();
                        searchTable();

                    } else {
                        showMessage("error", "خطأ في الخادم!")
                    }
                });
            });

        })
    });

    function deleteCategory(ele) {
        var _id = $(ele).parents("tr").attr("row_id");
        ajaxFn(location.href, {type: "remove", data: {_id: _id}}, "json", function (res) {
            if (res.success) {
                showMessage("success", "تمت إزالة الفئة بنجاح");
                searchTable();
            } else {
                showMessage("error", "خطأ في الخادم!")
            }
        });
    }

    $(".table-container").on("click", ".btn-remove", function () {
        var self = this;
        bootbox.dialog(
            {
                message: "هل أنت متأكد من إزالة هذه الفئة؟",
                buttons: {
                    confirm: {
                        label: 'نعم',
                        className: 'btn-outline-success pull-right',
                        callback: function () {
                            deleteCategory(self);
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
        $(".edit-modal-title").text("تحرير الفئة");
        $("#edit-modal .form input[name=_id]").val($(tr).attr("row_id"));
        $("#edit-modal .form input[name=name]").val($('td:nth-child(1)', tr).text());
        new Custombox.modal({
            content: {
                effect: 'fadein',
                target: '#edit-modal',
                overlaySpeed: 200,
                overlayColor: "#36404a"

            }
        }).open();


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
                    showMessage("success","Successfully imported");
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
    searchTable();


});