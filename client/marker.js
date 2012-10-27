// Marker

var MK = MK || {};

MK.app = {
    init: function () {
        l('MK.app.init()');
    }
};

Meteor.startup(function () {
    l('Meteor.startup(client)');
    MK.app.init();
});

var clear = function () {
    Session.set('content', '');
}

// Window

window.onresize = function (e) {
    l('onresize');
    MK.events.resizeBoard();
};

window.onclick = function (e) {
    $('#search').addClass('hide');
};

// Header

Template.header.events({
    'click #new-doc': function () {
        l('Template.header.events click #new-doc not implemented');
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

Template.doc.events({
    'keyup #input-pane': function (e) {
        l('Template.doc.events keyup #input-pane');
        Session.set('content', e.target.value || "");
    }
});

Template.doc.input = function () {
    return Session.get('content');
};

Template.doc.output = function () {
    var converter = new Showdown.converter();
    return converter.makeHtml(Session.get('content') || "");
};

Template.doc.rendered = function () {
    $('#output-pane').scrollTop($('#input-pane').scrollTop());
    MK.events.resizeBoard();
};