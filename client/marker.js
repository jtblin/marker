// Marker
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
  }};

// Global events

window.onresize = MK.events.resizeCanvas;

window.onclick = function (e) {
  $('#search').addClass('hide');
};

// Header

Template.header.canDelete = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (doc && doc.owner === Meteor.userId()) ? "" : "hide";
};

Template.header.events({
  'click #new-doc': function () {
    Meteor.go(Meteor.newPath());
  },
  'click #edit-doc': function () {
    var doc = Documents.findOne({_id: Session.get('docId')});
    if (doc)
      Meteor.go(Meteor.editPath({ns: doc.ns, docUri: doc.uri}));
  },
  'click #cancel-edit': function () {
    var doc = Documents.findOne({_id: Session.get('docId')});
    if (doc)
      Meteor.go(Meteor.docPath({ns: doc.ns, docUri: doc.uri}));
    else
      Meteor.go(Meteor.rootPath());
  },
  'click #delete-doc': function () {
    Meteor.call("deleteDocument", Session.get('docId'), function (error) {
      if (! error)
        Meteor.go(Meteor.rootPath());
      else
        alert(error.reason);
    });
  },
  'click #save-doc': function () {
    MK.app.showLoader();
    $('#save-msg').html('Saving...').fadeIn();
    var doc = {
      title: Session.get('title'),
      content: Session.get('content'),
      public: !!($('#header input[type=checkbox]').attr('checked') === 'checked'),
      uri: Session.get('title').replace(/\s/g, '-'),
      ns: $.trim($('#input-namespace').val())
    };
    if (! doc.ns.match(/^\//)) doc.ns = '/' + doc.ns;
    if (! Session.get('docId'))
      Meteor.call("createDocument", doc, callback);
    else
      Meteor.call("updateDocument", Session.get('docId'), doc, callback);

    function callback (error) {
      MK.app.hideLoader();
      if (error)
        MK.app.showSaveMsg('Error: ' + error.reason);
      else {
        MK.app.showSaveMsg('Saved.');
        Meteor.go(Meteor.editPath({ns: doc.ns, docUri: doc.uri}));
      }
    }
  },
  'keyup #search-text': function (e) {
    if (e.which === 27) {
      // 27 = escape
      $('#search').addClass('hide');
    } else {
      $('.loading').removeClass('hidden');
      Session.set('searchText', e.target.value);
      $('#search').removeClass('hide');
    }
  },
  'click #search-text': function (e) {
    e.stopDefault();
    if (e.target.value !== '') {
      $('#search').removeClass('hide');
    }
  }
});

Template.toolbar.checked = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  if (doc)
    return doc.public ? 'checked' : '';
  else
    return "checked";
};

Template.toolbar.canPublish = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (! doc || doc.owner === Meteor.userId()) ? '' : 'hide';
};

Template.toolbar.tags = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (doc && doc.tags && doc.tags.length > 0) ? doc.tags : 'click to add tags';
};

Template.toolbar.events({
  'click span': function (e) {
    if (typeof e.target.checked === 'undefined')
      e.target.children[0].checked = e.target.children[0].checked ? false : true;
  },
  'click .tags': function (e) {
    if (e.target.innerHTML === 'click to add tags')
      e.target.innerHTML = '';
    removeTagHighlight ();
    $('.tag').removeClass('display').addClass('write');
  },
  'click .tag': function (e) {
    e.stopDefault();
    removeTagHighlight ();
    var $tag = $(e.target), html = $tag.html();
    $tag.addClass('highlight');
    $tag.html('<div>'+html+'</div><a class="box-close"></a>');
  },
  'blur .tags': function (e) {
    if ($.trim(e.target.innerHTML) === '')
      e.target.innerHTML = 'click to add tags';
    $('.tag').removeClass('write').addClass('display');
    var tags = $('.tags').text().replace(/\n/g, '').split(' ').filter(function (tag) {
      return ($.trim(tag) !== '');
    });
    Meteor.call("updateTags", Session.get('docId'), tags, function (error) {
      if (error) alert(error.reason);
    });
  },
  'click .box-close': function (e) {
    e.stopDefault();
    $(e.target.parentElement).remove();
    $('.tags').trigger('blur');
  }
});

function removeTagHighlight () {
  $('.highlight').each(function (idx, tag) {
    tag = $(tag);
    tag.html($.trim(tag.text()));
  });
  $('.tag').removeClass('highlight');
}

Template.tags.tags = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (doc && doc.tags && doc.tags.length > 0) ? doc.tags : [];
};

Template.tags.rendered = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  if (! (doc && doc.tags && doc.tags.length > 0))
    $('.tags').html('click to add tags');
};

// Home

Template.list.docs = function () {
  var pageIndex = Session.get('currentPage'),
    doc = Documents.findOne({});
  if (doc) {
    MK.app.setSessionVariables(doc);
  }
  return Documents.find({}, {limit: pageIndex*MK.app.pageSize});
};

Template.list.events({
  'click .box': function (e) {
    var doc = Documents.findOne({_id: this._id});
    if (doc) MK.app.setSessionVariables(doc);
    $('.active').removeClass('active').addClass('inactive');
    $('#' + this._id).removeClass('inactive').addClass('active');
  }
});

Template.list.rendered = function () {
  var height = window.innerHeight - 80;
  $('.loading-bar').css('line-height', height + 'px').height(height - 80);
};

// Search (not implemented)

Template.search.results = function () {
  console.log('Template.search.results not implemented');
  return [];
};

Template.search.rendered = function () {
  MK.app.hideLoader();
};

Template.search.events({
  'mouseover li, mouseleave li': function (e) {
    e.currentTarget.className = (e.type == 'mouseover') ? 'hover' : '';
  },
  'click li': function (e) {
    console.log('Template.search.events click li not implemented');
  }
});

// Document

Template.editor.events({
  'keyup #input-pane': function (e) {
    Session.set('content', e.target.value || "");
  },
  'keyup #input-title': function (e) {
    Session.set('title', e.target.value || "");
  }
});

Template.editor.title = function () {
  return Session.get('title');
};

Template.editor.namespace = function () {
  return Meteor.router.template() === 'new' ? document.location.pathname.replace(/\/new\/?$/, '') : Session.get('namespace');
};

Template.editor.input = function () {
  return Session.get('content');
};

Template.doc.content = function () {
  return MK.app.getHtmlContent();
};

Template.preview.output = function () {
  return MK.app.getHtmlContent();
};

Template.editor.rendered = function () {
  MK.events.resizeCanvas();
  $('#output-pane').scrollTop($('#input-pane').scrollTop());
};

Template.preview.rendered = function () {
  MK.events.resizeCanvas();
  $('#output-pane').scrollTop($('#input-pane').scrollTop());
};

// Subscriptions

Meteor.autorun(function () {
  Meteor.subscribe('documents', MK.app.hideLoader);
});

// Startup

Meteor.startup(function () {
  console.log('Meteor.startup(client)');
  MK.app.init();
});