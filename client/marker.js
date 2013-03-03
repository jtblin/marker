// Marker
var MK = MK || {};

MK.app = {
	init: function () {
		l('MK.app.init()');
		MK.events.stickyPane();
	},
	clearSession: function () {
		Session.set("docId", null);
		Session.set("content", '');
		Session.set("currentPage", 1);
	},
	converter: new Showdown.converter(),
	setDoc: function (context) {
		var doc = Documents.findOne({uri : context.params.docUri});
		if (doc) {
			if (Session.get("docId") !== doc._id) {
				Session.set("docId", doc._id);
				Session.set("content", doc.content);
			}
		}
	},
	setAnalytics: function () {
		_gaq.push(['_trackPageview']);
	},
	pageSize: 12,
	hideLoader: function () {
		$('#header .loading').addClass('hidden');
	},
	showLoader: function () {
		$('#header .loading').removeClass('hidden');
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
			Meteor.go(Meteor.editPath({docUri: doc.uri}));
	},
	'click #cancel-edit': function () {
		var doc = Documents.findOne({_id: Session.get('docId')});
		if (doc)
			Meteor.go(Meteor.docPath({docUri: doc.uri}));
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
		if (! Session.get('docId')) {
			var title = Session.get('content').replace(/^\n*/, '').split('\n').first().replace('#', '');
			var doc = {
				title: title,
				content: Session.get('content'),
				public: true,
				uri: title.replace(/\s/g, '-')
			};
			Meteor.call("createDocument", doc, function (error, docId) {
				if (! error)
					Meteor.go(Meteor.editPath({docUri: doc.uri}));
				else
					alert(error.reason);
			});
		} else {
			Meteor.call("updateDocument", Session.get('docId'), Session.get('content'), function (error) {
				if (error) alert(error.reason);
			});
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

Template.list.docs = function () {
	var pageIndex = Session.get("currentPage"),
			doc = Documents.findOne({});
	if (doc) {
		Session.set('content', doc.content);
		Session.set('docId', doc._id);
	}
	return Documents.find({}, {skip: (pageIndex-1)*MK.app.pageSize, limit: pageIndex*MK.app.pageSize});
};

Template.list.events({
	'click .box': function (e) {
		var doc = Documents.findOne({_id: this._id});
		if (doc) {
			Session.set('content', doc.content);
			Session.set('docId', doc._id);
		}
		$('.active').removeClass('active').addClass('inactive');
		$('#' + this._id).removeClass('inactive').addClass('active');
	}
});

// Search (not implemented)

Template.search.results = function () {
	l('Template.search.results not implemented');
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

Session.set("currentPage", 1);

Meteor.autorun(function () {
	Meteor.subscribe('documents', MK.app.hideLoader);
});

// Router

Meteor.pages({
	'/new': {to: 'new', before: [MK.app.setAnalytics, MK.app.clearSession] },
	'/:docUri': {to: 'doc', before: [MK.app.setAnalytics, MK.app.setDoc]},
	'/:docUri/edit': {to: 'edit', before: [MK.app.setAnalytics, MK.app.setDoc]},
	'/': { to: 'home', as: 'root', before: [MK.app.setAnalytics, MK.app.clearSession] }
});

Meteor.startup(function () {
	l('Meteor.startup(client)');
	MK.app.init();
});