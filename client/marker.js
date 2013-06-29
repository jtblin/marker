// Marker
MK = window.MK || {};

MK.app = {
	init: function () {
		l('MK.app.init()');
		Session.set("currentPage", 1);
		MK.events.stickyPane();
		MK.events.infiniteScroll();
	},
	clearSession: function () {
		Session.set("docId", null);
		Session.set("content", '');
		Session.set("title", '');
		Session.set("currentPage", 1);
	},
	converter: new Showdown.converter(),
	setDoc: function (context) {
		var doc = Documents.findOne({uri : context.params.docUri});
		if (doc) {
			if (Session.get("docId") !== doc._id) {
				MK.app.setSessionVariables(doc);
			}
		}
	},
	setSessionVariables: function (doc) {
		Session.set("docId", doc._id);
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
		$('#header .loading').addClass('hidden');
	},
	showLoader: function () {
		$('#header .loading').removeClass('hidden');
	},
	getHtmlContent: function () {
		return "<h1>" + Session.get('title') + "</h1><hr/>" + MK.app.converter.makeHtml(Session.get('content') || "");
	},
	showSavedMsg: function () {
		$('#save-msg').html('Saved.');
		setTimeout(function () {
			$('#save-msg').fadeOut();
		}, 3000);
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
		MK.app.showLoader();
		$('#save-msg').html('Saving...');
		$('#save-msg').fadeIn();
		var isPublic = $('#header input[type=checkbox]').attr('checked') === 'checked' ? true : false;
		if (! Session.get('docId')) {
			var doc = {
				title: Session.get('title'),
				content: Session.get('content'),
				public: isPublic,
				uri: Session.get('title').replace(/\s/g, '-')
			};
			Meteor.call("createDocument", doc, function (error, docId) {
				MK.app.hideLoader();
				MK.app.showSavedMsg();
				if (! error)
					Meteor.go(Meteor.editPath({docUri: doc.uri}));
				else
					alert(error.reason);
			});
		} else {
			Meteor.call("updateDocument", Session.get('docId'), Session.get('title'), Session.get('content'), isPublic, function (error) {
				MK.app.hideLoader();
				MK.app.showSavedMsg();
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

Template.toolbar.checked = function () {
	var doc = Documents.findOne({_id: Session.get('docId')});
	if (doc)
		return doc.public ? "checked" : "";
	else
		return "checked";
};

Template.toolbar.events({
	'click span': function (e) {
		if (typeof e.target.checked === 'undefined')
			e.target.children[0].checked = e.target.children[0].checked ? false : true;
	}
});

Template.toolbar.canPublish = function () {
	var doc = Documents.findOne({_id: Session.get('docId')});
	return (doc && doc.owner === Meteor.userId()) ? "" : "hide";
};

// Home

Template.list.docs = function () {
	var pageIndex = Session.get("currentPage"),
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
	},
	'keyup #input-title': function (e) {
		Session.set('title', e.target.value || "");
	}
});

Template.editor.title = function () {
	return Session.get('title');
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

// Router

Meteor.pages({
	'/new': {to: 'new', before: [MK.app.setAnalytics, MK.app.clearSession] },
	'/:docUri': {to: 'doc', before: [MK.app.setAnalytics, MK.app.setDoc]},
	'/:docUri/edit': {to: 'edit', before: [MK.app.setAnalytics, MK.app.setDoc]},
	'/': { to: 'home', as: 'root', before: [MK.app.setAnalytics, MK.app.clearSession] }
});

// Startup

Meteor.startup(function () {
	l('Meteor.startup(client)');
	MK.app.init();
});