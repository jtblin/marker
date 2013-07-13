MK = window.MK = window.MK || {};

MK.app = {
  init: function () {
    console.log('MK.app.init()');
    Session.set("currentPage", 1);
    MK.router.init();
  },
  pageInit: function () {
    MK.events.init();
    MK.app.setAnalytics();
  },
  clearSession: function () {
    Session.set("docId", null);
    Session.set("search", null);
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
    $('.loading').addClass('hidden');
  },
  showLoader: function () {
    $('.loading').removeClass('hidden');
  },
  getHtmlContent: function (input) {
    var markdown = input || Session.get('content') || "";
    var html = input ? MK.app.converter.makeHtml(markdown) :
      "<h1>" + Session.get('title') + "</h1><hr/>" + MK.app.converter.makeHtml(markdown);
    if (Session.get('search')) html = MK.app.highlightSearchKeyword(html, Session.get('search'));
    return html;
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
  },
  highlightSearchKeyword: function (html, keyword) {
    var el = document.createElement('div'), len = keyword.length;
    el.innerHTML = html;
    return findTextNode(el.childNodes, keyword);

    function findTextNode (items, keyword) {
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.nodeType === 3) { // 3 === text
          html += replaceKeywordByHtml(item.nodeValue, keyword);
        } else {
          item.innerHTML = findTextNode(item.childNodes, keyword);
          html += item.outerHTML;
        }
      }
      return html;
    }

    function replaceKeywordByHtml (text, keyword) {
      var index = text.toLowerCase().indexOf(keyword.toLowerCase());
      return (index > -1) ?
        text.substr(0, index) + '<span class="search-highlight">' + text.substr(index, len) + '</span>' + text.substr(index + len) :
        text;
    }
  }
};