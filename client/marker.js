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
		if (jQuery.isEmptyObject(Session.get("docQuery")))
			return false;
		var doc = Documents.findOne({});
		if (doc) {
			if (Session.get("docId") !== doc._id) {
				Session.set("docId", doc._id);
				Session.set("content", doc.content);
			}
		}
	},
	getDoc: function (context) {
		Session.set("docQuery", {uri : context.params.docUri});
		Session.set("docPage", 1);
	},
	setAnalytics: function () {
		_gaq.push(['_trackPageview']);
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
	'click #new-doc': function () {
		Meteor.go(Meteor.newPath());
	},
	'click #edit-doc': function () {
		var doc = Documents.findOne({_id: Session.get('docId')});
		if (doc)
			Meteor.go(Meteor.editPath({docUri: doc.uri}));
	},
	'click #cancel-edit': function () {
		var doc = Documents.findOne({_id: Session.get('docId')});
		if (doc)
			Meteor.go(Meteor.docPath({docUri: doc.uri}));
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
				if (! error) Meteor.go(Meteor.editPath({docUri: doc.uri}));
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

Template.editor.events({
	'keyup #input-pane': function (e) {
		Session.set('content', e.target.value || "");
	}
});

Template.editor.input = function () {
	return Session.get('content');
};

Template.doc.content = function () {
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

Meteor.autorun(function () {
	Meteor.subscribe('documents', Session.get("docQuery"), Session.get("docPage"), function () {
		Meteor.setTimeout(MK.app.setDoc, 100);
	});
});

// Router

Meteor.pages({
	'/new': {to: 'new', before: [MK.app.setAnalytics, MK.app.clearSession] },
	'/:docUri': {to: 'doc', before: [MK.app.setAnalytics, MK.app.getDoc]},
	'/:docUri/edit': {to: 'edit', before: [MK.app.setAnalytics, MK.app.getDoc]},
	'/': { to: 'home', as: 'root', before: [MK.app.setAnalytics, MK.app.clearSession] }
});

Meteor.startup(function () {
	l('Meteor.startup(client)');
	MK.app.init();
});