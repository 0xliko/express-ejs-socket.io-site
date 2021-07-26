

var ajaxFn = function(url, data, type, callback, hideOverlay) {
    data._csrf = $('meta[name="_csrf"]').attr('content');
    if (!hideOverlay) $('.rightbar-overlay').show();
    $.ajax({
        url: url,
        data: data,
        type: 'post',
        dataType: type,
        success: function(res) {
            if (!hideOverlay) $('.rightbar-overlay').hide();
            callback(res);
        },
        error: function(err) {
            $('.rightbar-overlay').hide();
            callback();

        },
        beforeSend:function (xhr){
            xhr.overrideMimeType( "text/plain; charset=UTF-8" );
        }
    });
}



var showMessage = function(type,message){

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }
    if(toastr[type])
        toastr[type](message);
}