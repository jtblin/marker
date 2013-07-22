var MK = window.MK = window.MK || {};

var stickyTop;

MK.events = {
  init: function () {
    $(window).off('scroll');
    window.onresize = MK.events.resizeCanvas;
    if (Meteor.router.templateEquals('home')) $(window).scroll(windowScroll);
  },
  resizeCanvas: function () {
    $('#input-pane').css('height', window.innerHeight - 100);
    $('#output-pane').css('height', window.innerHeight - 70);
    $('.info-wrapper').css({
      'top': window.innerHeight - 50,
      'width': '100%'
    });
  }
};

function windowScroll () {
  // what the y position of the scroll is
  var $sticky = $("#sticky"), y = $(this).scrollTop();

  // if that's below the header
  if (y >= getStickyTop($sticky)) {
    // if so, add the fixed class
    $sticky.addClass('fixed');
  } else {
    // otherwise remove it
    $sticky.removeClass('fixed');
  }

  // Infinite scroll
  if (y >= $(document).height() - $(window).height() - 300) {
    if (Session.get('currentPage')+1 <= MK.app.maxPage()) Session.set('currentPage', Session.get('currentPage')+1);
  }
}

function getStickyTop ($sticky) {
  if (typeof stickyTop === 'undefined' || stickyTop === 0)
    stickyTop = $sticky.offset().top - parseFloat($sticky.css('marginTop').replace(/auto/, 0));
  return stickyTop;
}

Event.prototype.stopDefault = function () {
  this.stopPropagation();
  this.preventDefault();
};
