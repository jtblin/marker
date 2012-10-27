/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 2:30 PM
 * To change this template use File | Settings | File Templates.
 */

Event.prototype.stopDefault = function () {
    this.stopPropagation();
    this.preventDefault();
};

var MK = $.extend({}, MK || {});

MK.events = {
    resizeBoard: function () {
        $('#input-pane, #output-pane').css('height', window.innerHeight - 60);
    }
};
