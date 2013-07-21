Handlebars.registerHelper('convert', function (input) {
  return MK.app.getHtmlContent(input).substr(0, 1000);
});

Handlebars.registerHelper('docLink', function () {
  var opts = {ns: this.ns, docUri: this.uri};
  return (Meteor.userId() === this.owner) ? Meteor.editPath(opts) : Meteor.docPath(opts);
});

Handlebars.registerHelper('nsLink', function () {
  return Meteor.nsPath({ns: this._id});
});

Handlebars.registerHelper('highlightKeyword', function (text) {
  return Session.get('search') ? MK.app.highlightSearchKeyword(text, Session.get('search')) : text;
});

Handlebars.registerHelper('activeBox', function (id) {
  return (id === Session.get('docId')) ? 'active' : 'inactive';
});

Handlebars.registerHelper('pageTemplateIn', function (/* arguments */) {
  //	Transform handlebar object into array, discarding the last element
  var args = Array.prototype.slice.call(arguments, 0, -1);
  return args.indexOf(Meteor.router.template()) > -1;
});

Handlebars.registerHelper('showContent', function () {
  return (Session.get('loading')) ? 'hide' : '';
});