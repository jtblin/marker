MK = window.MK = window.MK || {};

MK.app = {
  init: function () {
    console.log('MK.app.init()');
    Session.set("currentPage", 1);
    MK.router.init();
    MK.app.recentDocs = new MK.Collection('recent_documents', 5);
    MK.app.recentNamespaces = new MK.Collection('recent_namespaces', 5);
  },
  pageInit: function () {
    MK.events.init();
    MK.app.setAnalytics();
    if (! Meteor.router.templateEquals('home')) $(window).scrollTop(0);
  },
  clearSession: function () {
    Session.set("content", '');
    Session.set("title", '');
    Session.set("namespace", null);
    if (! Meteor.router.templateEquals('home')) {
      Session.set("currentPage", 1);
      Session.set("docId", null);
    }

  },
  converter: new Showdown.converter(),
  setDoc: function (context) {
    var doc = Documents.findOne({ns: context.params.namespace, uri: context.params.docUri});
    if (doc) {
      if (Session.get("docId") !== doc._id)
        MK.app.setSessionVariables(doc);
      MK.app.recentDocs.save({_id: doc._id, uri: doc.uri, ns: doc.ns, title: doc.title, owner: doc.owner});
      MK.app.recentNamespaces.save({_id: doc.ns});
    } else {
      // TODO: 404
      console.log(404, context.params, location.pathname);
    }
  },
  setNamespace: function (context) {
    if (Namespaces.findOne({ns: MK.model.nsRoot(context.params.namespace)})) {
      Session.set("namespace", context.params.namespace );
    } else {
      // TODO: 404
      console.log(404, context.params.namespace, location.pathname);
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