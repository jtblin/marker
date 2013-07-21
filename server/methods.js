Meteor.methods({
  createDocument: function (doc) {
    var now = Date.now();

    doc = MK.model.validate({
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
    doc  = MK.model.validate(doc);

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