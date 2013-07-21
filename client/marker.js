MK = window.MK = window.MK || {};

// Layout

Template.layout.rendered = function () {
  var height = window.innerHeight - 80;
  $('.loading-bar').css('line-height', height + 'px').height(height - 80);
};

Template.layout.showLoading = function () {
  return (Session.get('loading')) ? '' : 'hidden';
};

// Header

Template.header.showDeleteBtn = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (doc && doc.owner === Meteor.userId()) ? "" : "hide";
};

Template.header.events({
  'click .logo': function () {
    if (! Meteor.router.templateEquals('home')) return;
    Session.set('search', null);
    $('#search-box').val('');
  },
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
      public: $('#header input[type=checkbox]').is(':checked'),
      uri: MK.model.getDocUri(Session.get('title')),
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
        if (Meteor.router.templateEquals('new'))
          Meteor.go(Meteor.editPath({ns: doc.ns, docUri: doc.uri}));
      }
    }
  },
  'keyup #search-box': function (e) {
    if (e.which === 27) e.currentTarget.value = ''; // 27 === escape
    var search = $.trim(e.currentTarget.value), len = search.length;
    if (len === 0)
      Session.set('search', null);
    else if (len > 2) {
      Session.set('search', search);
      Meteor.go(Meteor.rootPath());
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
    MK.app.removeTagHighlight ();
    $('.tag').removeClass('display').addClass('write');
  },
  'click .tag': function (e) {
    e.stopDefault();
    MK.app.removeTagHighlight ();
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

Template.tags.tags = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  return (doc && doc.tags && doc.tags.length > 0) ? doc.tags : [];
};

Template.tags.rendered = function () {
  var doc = Documents.findOne({_id: Session.get('docId')});
  if (! (doc && doc.tags && doc.tags.length > 0))
    $('.tags').html('click to add tags');
};

// Sidebar

Template.sidebar.recentDocs = function () {
  return MK.app.recentDocs ? MK.app.recentDocs.getItems() : [];
};

Template.sidebar.recentNamespaces = function () {
  return MK.app.recentNamespaces ? MK.app.recentNamespaces.getItems() : [];
};

// Home

Template.list.docs = function () {
  var query = {}, ns = Session.get('namespace'), search = Session.get('search');
  if (ns && location.pathname !== '/')
    query['ns'] = new RegExp('^' + ns, 'i');
  if (Session.get('search')) {
    var rg = new RegExp(Session.get('search'), 'i');
    query['$or'] = [{title: rg}, {content: rg}, {ns: rg}];
    Session.set('currentPage', 1);
  }
  var pageIndex = Session.get('currentPage');
  var doc = Documents.findOne(query);
  if (doc)
    MK.app.setSessionVariables(doc);
  return Documents.find(query, {limit: pageIndex*MK.app.pageSize, sort: {updatedAt: -1, createdAt: -1} });
};

Template.list.events({
  'click .box': function (e) {
    var doc = Documents.findOne({_id: this._id});
    if (doc) MK.app.setSessionVariables(doc);
    $('.active').removeClass('active').addClass('inactive');
    $('#' + this._id).removeClass('inactive').addClass('active');
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
  return Meteor.router.templateEquals('new') ? document.location.pathname.replace(/\/new\/?$/, '') : Session.get('namespace');
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
  Session.set('loading', true);
  Meteor.subscribe('namespaces');
  Meteor.subscribe('documents', function () {
    Session.set('loading', false);
  });
});

// Startup

Meteor.startup(function () {
  console.log('Meteor.startup(client)');
  MK.app.init();
});