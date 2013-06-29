/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 2:30 PM
 * To change this template use File | Settings | File Templates.
 */


MK = window.MK || {};

MK.events = {
  resizeCanvas: function () {
    $('#input-pane').css('height', window.innerHeight - 80);
    $('#output-pane').css('height', window.innerHeight - 50);
    $('.save').
      css('top', window.innerHeight - 50).
      css('left', window.innerWidth/2 - 25);
  },
  stickyPane: function () {
    var $sticky = $("#sticky");
    if ($sticky.length) {
      var top = $sticky.offset().top - parseFloat($sticky.css('marginTop').replace(/auto/, 0));
      $(window).scroll(function (event) {
        // what the y position of the scroll is
        var y = $(this).scrollTop();

        // if that's below the form
        if (y >= top) {
          // if so, add the fixed class
          $sticky.addClass('fixed');
        } else {
          // otherwise remove it
          $sticky.removeClass('fixed');
        }
      });
    }
  },
  infiniteScroll: function () {
    $(window).scroll(function (event) {
      // what the y position of the scroll is
      var y = $(this).scrollTop();

      // Infinite scroll
      if (y >= $(document).height() - $(window).height() - 300) {
        if (Session.get('currentPage')+1 <= MK.app.maxPage()) Session.set('currentPage', Session.get('currentPage')+1);
      }
    });
  }
};

Event.prototype.stopDefault = function () {
    this.stopPropagation();
    this.preventDefault();
};
