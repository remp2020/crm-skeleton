$(document).ready(function() {
    $('.autosize').autosize();

    $('select.select2').select2();

    $('a.btn-danger').click(function(e) {
        e.preventDefault();

        if (confirm('Are you sure?')) {
            var url = $(this).attr('href');
            window.location.href = url;
        }
    });

    $('.add_note').click(function(ev) {
        ev.preventDefault();

        item_id = $(this).data('item-id');
        $('#frm-noteForm-item_id').val(item_id);

        var actual_value = $('#item-' + item_id + '-value');
        $('#frm-noteForm-note').val(actual_value.text());
        $('#frm-noteForm').insertBefore($(this));
        $('#frm-noteForm').show();
    });

    $('.changestatusok').click(function (ev) {
        ev.preventDefault();

        $('#sendnotificationbutton').attr('href', $(this).data('send-notification-link'))
        $('#dontsendnotificationbutton').attr('href', $(this).data('dont-send-notification-link'))

        $('#myModal').modal();

        return false;
    });

    $('.checkAll').on('change', function () {
        if ($(this).prop('checked')) {
            $(this).closest('form').find('input:checkbox').not('[disabled]').prop('checked', true);
        } else {
            $(this).closest('form').find('input:checkbox').not('[disabled]').prop('checked', false);
        }
    });

    $('[data-toggle="tooltip"]').tooltip( { html: true } );

    initAceEditor(false);
});

function initAceEditor(createDiv) {
    $('.ace').each(function () {
        var el_lang = $(this).attr('data-lang');
        var aceEditorId = $(this).attr('id') + '_div';
        if (createDiv && !$('#' + aceEditorId).length) {
            $(this).parent().prepend('<div id="' + aceEditorId + '"></div>');
        }
        if ($('#' + aceEditorId).length) {
            var editor = ace.edit(($(this)).attr('id') + '_div');
            var textarea = $('#' + ($(this)).attr('id'));
            editor.getSession().setValue(textarea.val());
            editor.getSession().on('change', function () {
                textarea.val(editor.getSession().getValue());
            });
            editor.setTheme("ace/theme/monokai");
            if (el_lang !== 'text') {
                editor.session.setMode("ace/mode/" + el_lang);
            }
        }
    })
}