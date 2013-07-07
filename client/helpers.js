/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 28/10/12
 * Time: 10:06 PM
 * To change this template use File | Settings | File Templates.
 */

Handlebars.registerHelper('convert', function(input){
  return MK.app.converter.makeHtml(input).substr(0, 1000);
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