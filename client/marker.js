// Marker
var MK = MK || {};

MK.app = {
	init: function () {
		l('MK.app.init()');
	},
	clearSession: function () {
		Session.set("docId", null);
		Session.set("content", '');
		Session.set("docPage", 1);
		Session.set("docQuery", {});
	},
	converter: new Showdown.converter(),
	setDoc: function () {
		var doc = Documents.findOne({});
		if (doc) {
			l(doc.uri);
			Session.set("docId", doc._id);
			Session.set("content", doc.content);
		} else {
			l('TODO: error messaging');
			Session.set("docId", null);
			Session.set("content", '');
			Router.to('', true);
		}
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
			var title = Session.get('content').replace(/^\n*/, '').split('\n').first().replace('#', '');
			var doc = {
				title: title,
				content: Session.get('content'),
				public: true,
				uri: title.replace(/\s/g, '-')
			};
			Meteor.call("createDocument", doc, function (error, docId) {
				if (! error) Router.navigate(doc.uri + '/edit');
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

// Home

Template.home.docs = function () {
	return Documents.find();
};

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

Template.edit.created = function () {
	MK.app.setDoc();
};

Template.editor.events({
	'keyup #input-pane': function (e) {
		Session.set('content', e.target.value || "");
	}
});

Template.editor.input = function () {
	return Session.get('content');
};

Template.doc.content = function () {
	MK.app.setDoc();
	return MK.app.converter.makeHtml(Session.get('content') || "");
};

Template.preview.output = function () {
	return MK.app.converter.makeHtml(Session.get('content') || "");
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

Session.set("docPage", 1);
Session.set("docQuery", {});
Session.set("page", "home");

var historyStarted = false;

Meteor.autosubscribe(function () {
	Meteor.subscribe('documents', Session.get("docQuery"), Session.get("docPage"), function () {
		if (!historyStarted) {
			Backbone.history.start({pushState: true});
			historyStarted = true;
		}
	});
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
		Session.set("docQuery", {uri : docUri});
		Session.set("docPage", 1);
		this.goto("doc");
	},
	editDoc: function (docUri) {
		Session.set("docQuery", {uri : docUri});
		Session.set("docPage", 1);
		this.goto('edit');
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