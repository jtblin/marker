MK = window.MK = window.MK || {};

MK.router = {
  init: function () {
    console.log('MK.router.init()');
    Meteor.pages({});

    add('/', {to: 'home', as: 'root', before: [MK.app.setAnalytics, MK.app.clearSession] });
    add(/(.*)\/new\/?$/, {to: 'new', before: [MK.app.setAnalytics, MK.app.clearSession] });
    add(/(.*)\/(.+)\/edit\/?$/, {to: 'edit', before: [MK.app.setAnalytics, MK.router.setParams] });
    add(/(.*)\/([^\/]+)\/?$/, {to: 'doc', before: [MK.app.setAnalytics, MK.router.setParams] });
  },
  getPath: function (page, options) {
    var path;
    switch (page) {
      case 'root':
        return '/';
        break;
      case 'new':
        if (document.location.pathname === '/')
          path = (typeof Session.get('namespace') !== 'undefined') ? Session.get('namespace') + '/new' : '/new';
        else
          path = document.location.pathname.replace(/\/(new|edit)\/?$/, '').replace(/\/&/, '') + '/new';
        break;
      case 'edit':
        path = options.ns + '/' + options.docUri + '/edit';
        break;
      case 'doc':
        path = options.ns + '/' + options.docUri;
        break;
      default:
        throw new Meteor.Error(500, 'Unknown page');
    }
    return path;
  },
  setParams: function (context) {
    var params = {};
    params.namespace = context.params[0];
    params.docUri = context.params[1];
    context.params = params;
    MK.app.setDoc(context);
  }
};

function add (path, options) {
  var name = options.as ? options.as : options.to;
  new Meteor.PageRouter.Page(Meteor.router, path, options);
  Meteor[name+'Path'] = function (options) {
    return MK.router.getPath(name, options);
  };
}
