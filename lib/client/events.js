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
  resizeCanvas: function () {
      $('#input-pane, #output-pane').css('height', window.innerHeight - 50);
  },
	stickyPane: function () {
		if ($("#sticky").length) {
			var top = $('#sticky').offset().top - parseFloat($('#sticky').css('marginTop').replace(/auto/, 0));
			$(window).scroll(function (event) {
				// what the y position of the scroll is
				var y = $(this).scrollTop();

				// if that's below the form
				if (y >= top) {
					// if so, add the fixed class
					$('#sticky').addClass('fixed');
				} else {
					// otherwise remove it
					$('#sticky').removeClass('fixed');
				}
			});
		}
	}
};
