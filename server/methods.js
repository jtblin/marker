var RESERVED_KEYWORDS = ['new', 'edit'], reservedKeywords = RESERVED_KEYWORDS.join(', ');

Meteor.methods({
  createDocument: function (doc) {
    doc = validate({
      owner: this.userId,
      title: doc.title.trim(),
      content: doc.content.trim(),
      public: !! doc.public,
      uri: doc.uri.trim(),
      createdAt: now,
      updatedAt: now,
      ns: doc.ns.trim(),
      shared: [],
      tags: []
    });

    var docId = Documents.insert(doc);

    try {
      // TODO: find a way to render templates on server side
      var url = Meteor.absoluteUrl(doc.ns + '/' + doc.uri);
      Email.send({
        from: "noreply@marker.meteor.com",
        to: contactEmail(Meteor.users.findOne(this.userId)),
        subject: "Congratulations - Your document is created at " + url,
        html: "<html><body>Your document has been created and you can access it at any time at this url: <a href='" +
          url + "'>" + url + "</a></body></html>"
      });
    }
    catch (e) {
      console.log('====== Cannot send email for document ' + docId + '======')
    }

    return docId;
  },
  updateDocument: function (docId, doc) {
    doc  = validate(doc);

    if (! Documents.findOne({ _id : docId, $or : [{public: true}, {shared: this.userId}, {owner: this.userId}] }))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");

    return Documents.update({ _id : docId}, {$set : {content: doc.content, title: doc.title, public: doc.public, ns: doc.ns, updatedAt: Date.now()} });
  },
  updateTags: function (docId, tags) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");
    if (! Documents.findOne({ _id : docId, $or : [{public: true}, {shared: this.userId}, {owner: this.userId}] }))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");

    return Documents.update({ _id : docId}, {$set : {tags: tags, updatedAt: Date.now()} });
  },
  deleteDocument: function (docId) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");
    if (! Documents.findOne({ _id : docId, owner: this.userId }))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");
    Documents.remove({_id : docId});
  }
});

// TODO: structure
function contactEmail (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
}

function validate (doc) {
  // TODO: validation on both client and server
  doc = doc || {};

  if (! doc.ns.match(/^\//)) doc.ns = '/' + doc.ns;
  if (isBlank(doc.title) || isBlank(doc.content) || isBlank(doc.ns))
    throw new Meteor.Error(400, "Title, content and namespace can't be blank");
  if (! isUriUnique(doc.ns, doc.uri))
    throw new Meteor.Error(413, "URI is already taken in this namespace, change the title or use a different namespace");
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
  if (isNewNamespace(doc.ns))
    Namespaces.insert({ns: nsRoot(doc.ns), owner: doc.owner, public: doc.public, createdAt: doc.createdAt, shared: []});

  return doc;
}

function isUriUnique (ns, uri) {
  return ! Documents.findOne({ ns: ns, uri: uri, public: false, shared: {$ne: Meteor.userId() }, owner: {$ne: Meteor.userId()} });
}

function isNamespaceWritable (ns) {
  return Namespaces.findOne({ ns: nsRoot(ns), $or: [{public: true}, {shared: Meteor.userId()}, {owner: Meteor.userId()}] });
}

function nsRoot(ns) {
  return '/' + ns.split('/').second();
}

function isNewNamespace (ns) {
  return ! Namespaces.findOne({ ns: nsRoot(ns) });
}

function reservedWords (name) {
  return RESERVED_KEYWORDS.indexOf(name) > -1;
}

function isBlank (string) {
  return typeof string === "undefined" || string.trim().length === 0;
}
