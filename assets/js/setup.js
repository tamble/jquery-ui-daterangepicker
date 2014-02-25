var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
$.fn.bootstrapBtn = bootstrapButton;            // give $().bootstrapBtn the Bootstrap functionality

$(document).ready(function () {
    if (navigator.appVersion.indexOf("Chrome/") === -1) {
        $('body').scrollspy({ target: '.navbar-collapse' });
    }

    function setupExampleCode(id) {
        var s = $("#script_" + id).html();
        s = s.replace(/^\s+|\s+$/g, ''); // trim
        s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var lines = s.split(/\n/);
        lines.shift();
        lines.pop();
        var indent = lines[0].substr(0, lines[0].search(/\S/));
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].replace(indent, ' '); // space req by IE
        }
        s = lines.join('\n');
        $("#code_" + id).html(s);
    }

    var i, e;
    for (i = 2; ; i++) {
        e = $("#script_e" + i);
        if (e.length == 0) {
            break;
        }
        setupExampleCode("e" + i);
    }

    prettyPrint();
});