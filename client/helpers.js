Handlebars.registerHelper('convert', function(input){
  return MK.app.getHtmlContent(input).substr(0, 1000);
});

Handlebars.registerHelper('highlightKeyword', function(text){
  return Session.get('search') ? MK.app.highlightSearchKeyword(text, Session.get('search')) : text;
});

Handlebars.registerHelper('activeBox', function(id){
  return (id === Session.get('docId')) ? 'active' : 'inactive';
});

Handlebars.registerHelper('pageTemplateIn', function(/* arguments */){
  //	Transform handlebar object into array, discarding the last element
  var args = Array.prototype.slice.call(arguments, 0, -1);
  return args.some(function (arg) {
    if (arg === Meteor.router.template()) return true;
  });
});