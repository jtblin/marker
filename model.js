Documents = new Meteor.Collection("documents");
Namespaces = new Meteor.Collection("namespaces");

if (Meteor.isClient) var MK = window.MK = window.MK || {};
else var MK = Meteor.MK = Meteor.MK || {};

MK = (function (MK) {

  var RESERVED_KEYWORDS = ['new', 'edit'], reservedKeywords = RESERVED_KEYWORDS.join(', ');

  function isUriUnique (ns, uri) {
    return ! Documents.findOne({ ns: ns, uri: uri, public: false, shared: {$ne: Meteor.userId() }, owner: {$ne: Meteor.userId()} });
  }

  function isNamespaceWritable (ns) {
    return Namespaces.findOne({ ns: MK.model.nsRoot(ns), $or: [{public: true}, {shared: Meteor.userId()}, {owner: Meteor.userId()}] });
  }

  function isNewNamespace (ns) {
    return ! Namespaces.findOne({ ns: MK.model.nsRoot(ns) });
  }

  function reservedWords (name) {
    return RESERVED_KEYWORDS.indexOf(name) > -1;
  }

  function isBlank (string) {
    return typeof string === "undefined" || string.trim().length === 0;
  }

  MK.model = {
    validate: function (doc) {
      // TODO: implement on client side
      doc = doc || {};

      if (! doc.ns.match(/^\//)) doc.ns = '/' + doc.ns;
      if (isBlank(doc.title) || isBlank(doc.content) || isBlank(doc.ns))
        throw new Meteor.Error(400, "Title, content and namespace cannot be blank");
      if (! isUriUnique(doc.ns, doc.uri))
        throw new Meteor.Error(413, "URI is already taken in this namespace. <br>Change the title or use a different namespace");
      if (doc.title.length > 100)
        throw new Meteor.Error(413, "Title too long");
      if (doc.title.match(/(_|\?|\/)/))
        throw new Meteor.Error(413, "Title cannot have `_`, `/` or `?` characters");
      if (doc.content.length > 10000)
        throw new Meteor.Error(413, "Content too long");
      if (! Meteor.userId())
        throw new Meteor.Error(403, "You must be logged in");
      if (! isNewNamespace (doc.ns) && ! isNamespaceWritable(doc.ns))
        throw new Meteor.Error(403, "You don't have the rights to use this namespace");
      if (reservedWords(doc.title))
        throw new Meteor.Error(413, reservedKeywords + "are reserved keywords and cannot be used as title");
      if (isNewNamespace(doc.ns) && reservedWords(doc.ns))
        throw new Meteor.Error(413, reservedKeywords + "are reserved keywords and cannot be used as namespace");
      if (isNewNamespace(doc.ns)) {
        Namespaces.insert(
          {ns: MK.model.nsRoot(doc.ns), owner: Meteor.userId(), public: doc.public, createdAt: doc.createdAt, updatedAt: doc.updatedAt, shared: []}
        );
      }

      return doc;
    },
    nsRoot: function (ns) {
      return (ns === '/') ? '/' : '/' + ns.split('/').second();
    },
    getDocUri: function (title) {
      return title.replace(/\s/g, '-');
    }
  };

  return MK;

})(MK);

