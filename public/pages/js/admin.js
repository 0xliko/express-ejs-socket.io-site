$(document).ready(function () {
    window.Parsley.addValidator('iff', {

        validateString: function (value, requirement, instance) {
            return $(requirement).val() == value;
        },
        messages: {
            en: "كلمة المرور غير متطابقة"
        }
    });

    $("#password,#confirm").keyup(function () {
    });

    const dataTable = $("#data_table").DataTable({
        keys: !0,
        rowCallback: function (row, data, index) {
            if (data[6])
                $(row).attr("row_id", data[6])
        },
        oLanguage:
            {
                "sEmptyTable": "ليست هناك بيانات متاحة في الجدول",
                "sLoadingRecords": "جارٍ التحميل...",
                "sProcessing": "جارٍ التحميل...",
                "sLengthMenu": "أظهر _MENU_ مدخلات",
                "sZeroRecords": "لم يعثر على أية سجلات",
                "sInfo": "إظهار _START_ إلى _END_ من أصل _TOTAL_ مدخل",
                "sInfoEmpty": "يعرض 0 إلى 0 من أصل 0 سجل",
                "sInfoFiltered": "(منتقاة من مجموع _MAX_ مُدخل)",
                "sInfoPostFix": "",
                "sSearch": "ابحث:",
                "sUrl": "",
                "oPaginate": {
                    "sFirst": "الأول",
                    "sPrevious": "السابق",
                    "sNext": "التالي",
                    "sLast": "الأخير"
                },
                "oAria": {
                    "sSortAscending": ": تفعيل لترتيب العمود تصاعدياً",
                    "sSortDescending": ": تفعيل لترتيب العمود تنازلياً"
                }
            }

    });

    $(".btn-add").click(function () {
        $(".edit-modal-title").text("إضافة مشرف");
        $(".form input").val("");
        $('#edit-modal').modal();
        $(".form input[name=password]").attr("required", true);
        $(".form input[name=confirm]").attr("required", true);
        $(".form input[name='sheet_num']").attr("disabled", false);
    });

    $(".btn-save").click(function (e) {
        e.preventDefault();

        $('.form').parsley().whenValidate().then(function () {
            var data = {};
            $("#edit-modal .form input").each(function (index, ele) {
                data[$(ele).attr("name")] = $(ele).val();
            });
            if (!data.password)
                delete data.password;
            delete data.confirm;

            ajaxFn(location.href, {type: "existing", data: data}, "json", function (res) {
                if (res.exists) {
                    showMessage("warning", "البريد الإلكتروني مكرر");
                    return;
                }
                ajaxFn(location.href, {type: "save", data: data}, "json", function (res) {
                    if (res.success) {
                        var count = dataTable.rows().count() + 1;
                        var btn = `<button type="button" class="btn btn-sm btn-outline-success waves-effect waves-light btn-edit">Edit</button>
                               <button type="button" class="btn btn-sm btn-outline-danger waves-effect waves-light btn-remove">Remove</button>`
                        if (data._id == 0)
                            dataTable.row.add([count, res.data.name, res.data.email, "مشرف عام",res.data.sheet_num, btn, res.data._id]).draw(false);
                        else {
                            var tr = $(`tr[row_id=${data._id}]`);

                            var row = dataTable.row( tr ).data();
                            row[4] = data.sheet_num || "";
                            row[2] = data.email;
                            row[1] = data.name;
                            dataTable.row(tr).data(row).draw();
                        }
                        showMessage("success", "حفظ المسؤول بنجاح!");
                        $('#edit-modal').modal('hide');

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
                var tr = $(`tr[row_id=${_id}]`);
                dataTable.row(tr).remove();
                dataTable.draw(false);
                showMessage("success", "تمت إزالة المسؤول بنجاح");
            } else {
                showMessage("error", "خطأ في الخادم!")
            }
        });
    }

    $(".data_list").on("click", ".btn-remove", function () {
        var self = this;
        bootbox.dialog(
            {
                message: "هل أنت متأكد من إزالة هذا المسؤول?",
                buttons: {
                    confirm: {
                        label: 'نعم',
                        className: 'btn-outline-success pull-right',
                        callback: function () {
                            deleteUser(self);
                        }
                    },
                    cancel: {
                        label: 'لا',
                        className: 'btn-outline-danger pull-right'
                    }
                }

            });
    });

    $(".data_list").on("click", ".btn-edit", function () {
        var tr = $(this).parents('tr');
        $(".edit-modal-title").text("تحرير المشرف");
        $(".form input[name=_id]").val($(tr).attr("row_id"));
        var sheet_num = $('td:nth-child(5)', tr).text() || 0;
        console.log(sheet_num)
        $(".form input[name='sheet_num']").val(sheet_num);
        if(!sheet_num)$(".form input[name='sheet_num']").attr('disabled',true);
        $(".form input[name=email]").val($('td:nth-child(3)', tr).text());
        $(".form input[name=name]").val($('td:nth-child(2)', tr).text());
        $(".form input[name=password]").attr("required", false).val("");
        $(".form input[name=confirm]").attr("required", false).val("");

        $('#edit-modal').modal();

    });


});