MK = window.MK = window.MK || {};

MK.router = {
  init: function () {
    console.log('MK.router.init()');
    Meteor.pages({});

    add('/', {to: 'home', as: 'root', before: [MK.app.pageInit, MK.app.clearSession] });
    add(/(.*)\/new\/?$/, {to: 'new', before: [MK.app.pageInit, MK.app.clearSession] });
    add(/(.*)\/(.+)\/edit\/?$/, {to: 'edit', before: [MK.app.pageInit, MK.router.setParams] });
    add(/(.*)\/([^\/]+)$/, {to: 'doc', before: [MK.app.pageInit, MK.router.setParams] });
    add(/(.*)\/([^\/]+)\/$/, {to: 'namespace', as: 'ns', before: [MK.app.pageInit, MK.router.setNamespace] });
  },
  getPath: function (page, options) {
    var path;
    switch (page) {
      case 'root':
        return '/';
        break;
      case 'new':
        // TODO: review
        if (document.location.pathname === '/')
          path = '/new'; // Session.get('namespace') ? Session.get('namespace') + '/new' : '/new';
        else
          path = document.location.pathname.replace(/\/(new|edit)\/?$/, '').replace(/\/&/, '') + '/new';
        break;
      case 'edit':
        path = nsFullPath(options.ns) + options.docUri + '/edit';
        break;
      case 'doc':
        path = nsFullPath(options.ns) + options.docUri;
        break;
      case 'ns':
        path = nsFullPath(options.ns);
        break;
      default:
        throw new Meteor.Error(500, 'Unknown page');
    }
    return path;
  },
  setParams: function (context) {
    var params = {};
    params.namespace = context.params.first();
    params.docUri = context.params.second();
    context.params = params;
    MK.app.setDoc(context);
  },
  setNamespace: function (context) {
    var params = {};
    params.namespace = context.params.first() ? context.params.first() :  context.params.second();
    if (! params.namespace.match(/^\//)) params.namespace = '/' + params.namespace;
    context.params = params;
    MK.app.setNamespace(context);
  }
};

function add (path, options) {
  var name = options.as ? options.as : options.to;
  new Meteor.PageRouter.Page(Meteor.router, path, options);
  Meteor[name+'Path'] = function (options) {
    return MK.router.getPath(name, options);
  };
}

function nsFullPath (ns) {
  return (ns === '/') ? '/' : ns + '/';
}
