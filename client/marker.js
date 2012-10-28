// Marker
var MK = MK || {};

MK.app = {
	init: function () {
		l('MK.app.init()');
	},
	clearSession: function () {
		Session.set("docId", null);
		Session.set("content", '');
	}
};

// Window

window.onresize = function (e) {
	MK.events.resizeCanvas();
};

window.onclick = function (e) {
	$('#search').addClass('hide');
};

// Header

Template.header.events({
	'click #home': function () {
		Router.to('', true);
	},
	'click #new-doc': function () {
		Router.to('new', true);
	},
	'click #edit-doc': function () {
		var doc = Documents.findOne({_id: Session.get('docId')});
		if (doc)
			Router.to(doc.uri + '/edit', true);
	},
	'click #cancel-edit': function () {
		var doc = Documents.findOne({_id: Session.get('docId')});
		if (doc)
			Router.to(doc.uri, true);
	},
	'click #save-doc': function () {
		if (!Session.get('docId')) {
			var doc = {
				title: Session.get('content').replace(/^\n*/, '').split('\n').first().replace('#', ''),
				content: Session.get('content'),
				public: true
			};
			Meteor.call("createDocument", doc, function (error, docId) {
				if (! error) {
					// HACK: find a better way as this is not reliable,
					// what happen is that the client hasn't finished
					// refreshed the data when the router queries for the doc
					Meteor.setTimeout(function () { Router.goToDoc(docId) }, 1000);
				}
			});
		} else {
			Meteor.call("updateDocument", Session.get('docId'), Session.get('content'));
		}
	},
	'keyup #search-text': function (e) {
		if (e.which === 27) {
			// 27 = escape
			$('#search').addClass('hide');
		} else {
			$('#header .loading').removeClass('hidden');
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

// Search

Template.search.results = function () {
	l('Template.search.results not implemented');
	return [];
};

Template.search.rendered = function () {
	$('#header .loading').addClass('hidden');
};

Template.search.events({
	'mouseover li, mouseleave li': function (e) {
		e.currentTarget.className = (e.type == 'mouseover') ? 'hover' : '';
	},
	'click li': function (e) {
		l('Template.search.events click li not implemented');
	}
});

// Document

Template.editor.events({
	'keyup #input-pane': function (e) {
		Session.set('content', e.target.value || "");
	}
});

Template.editor.input = function () {
	return Session.get('content');
};

Template.preview.output = function () {
	var converter = new Showdown.converter();
	return converter.makeHtml(Session.get('content') || "");
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

Meteor.subscribe('documents', function () {
	Backbone.history.start({pushState: true});
});

// Router

var mkRouter = ReactiveRouter.extend({
	routes: {
		'new': 'newDoc',
		':docUri': 'getDoc',
		':docUri/edit': 'editDoc',
		'': 'home'
	},
	home: function() {
		MK.app.clearSession();
		this.goto('home');
	},
	newDoc: function () {
		MK.app.clearSession();
		this.goto('new');
	},
	getDoc: function (docUri) {
		var doc = Documents.findOne({uri : docUri});
		if (doc) {
			Session.set("docId", doc._id);
			Session.set("content", doc.content);
			this.goto("doc");
		} else {
			l('TODO: error messaging');
			Session.set("docId", null);
			Session.set("content", '');
			this.to('', true);
		}
	},
	editDoc: function (docUri) {
		var doc = Documents.findOne({uri : docUri});
		if (doc) {
			Session.set("docId", doc._id);
			Session.set("content", doc.content);
			this.goto("edit");
		} else {
			l('TODO: error messaging');
			Session.set("docId", null);
			Session.set("content", '');
			this.to('', true);
		}
	},
	goToDoc: function (docId) {
		l(Meteor.status());
		var doc = Documents.findOne({_id: docId});
		if (doc)
			this.to(doc.uri, true);
		else
			l('TODO: error handling and messaging');
	},
	to: function(uri, options) {
		this.navigate(uri, options);
		_gaq.push(['_trackPageview']);
		Session.set("currentPage", uri);
	}
});

Router = new mkRouter;

Meteor.startup(function () {
	l('Meteor.startup(client)');
	MK.app.init();
});