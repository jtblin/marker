MK = window.MK = window.MK || {};

MK.app = {
  init: function () {
    console.log('MK.app.init()');
    Session.set("currentPage", 1);
    MK.events.stickyPane();
    MK.events.infiniteScroll();
    MK.router.init();
  },
  clearSession: function () {
    Session.set("docId", null);
    Session.set("content", '');
    Session.set("title", '');
    Session.set("currentPage", 1);
  },
  converter: new Showdown.converter(),
  setDoc: function (context) {
    var doc = Documents.findOne({ns: context.params.namespace, uri: context.params.docUri});
    if (doc) {
      if (Session.get("docId") !== doc._id) {
        MK.app.setSessionVariables(doc);
      }
    } else {
      // TODO: 404
    }
  },
  setSessionVariables: function (doc) {
    Session.set("docId", doc._id);
    Session.set("namespace", doc.ns);
    Session.set("content", doc.content);
    Session.set("title", doc.title);
  },
  setAnalytics: function () {
    _gaq.push(['_trackPageview']);
  },
  pageSize: 12,
  maxPage: function () {
    return Math.ceil(Documents.find().count()/MK.app.pageSize);
  },
  hideLoader: function () {
    $('.loading, .loading-bar').addClass('hidden');
    $('#content').removeClass('hide');
  },
  showLoader: function () {
    $('.loading').removeClass('hidden');
  },
  getHtmlContent: function () {
    return "<h1>" + Session.get('title') + "</h1><hr/>" + MK.app.converter.makeHtml(Session.get('content') || "");
  },
  showSaveMsg: function (msg) {
    $('#save-msg').html(msg);
    setTimeout(function () {
      $('#save-msg').fadeOut();
    }, 3000);
  },
  removeTagHighlight: function () {
    $('.highlight').each(function (idx, tag) {
      tag = $(tag);
      tag.html($.trim(tag.text()));
    });
    $('.tag').removeClass('highlight');
  }
};