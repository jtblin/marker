MK = Meteor.MK = Meteor.MK || {};

Meteor.methods({
  createDocument: function (doc) {

    doc = MK.model.validate({
      owner: this.userId,
      title: doc.title.trim(),
      content: doc.content.trim(),
      public: !! doc.public,
      uri: doc.uri.trim(),
      createdAt: now(),
      updatedAt: now(),
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
    if (! (oldDoc = Documents.findOne({ _id : docId, $or : [{public: true}, {shared: this.userId}, {owner: this.userId}] })))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");

    doc.createdAt = oldDoc.createdAt;
    doc.updatedAt = now();
    doc.public = oldDoc.public;

    doc  = MK.model.validate(doc);

    return Documents.update({ _id : docId}, {$set : {content: doc.content, title: doc.title, public: doc.public, ns: doc.ns, updatedAt: doc.updatedAt} });
  },
  updateTags: function (docId, tags) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");
    if (! Documents.findOne({ _id : docId, $or : [{public: true}, {shared: this.userId}, {owner: this.userId}] }))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");

    return Documents.update({ _id : docId}, {$set : {tags: tags, updatedAt: now()} });
  },
  deleteDocument: function (docId) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");
    if (! Documents.findOne({ _id : docId, owner: this.userId }))
      throw new Meteor.Error(403, "You don't have the rights to modify this document");
    Documents.remove({_id : docId});
  },
  getS3Token: function (key) {
    // TODO: validate user etc.
    var s3 = new MK.S3Client(MK.config.s3.accessKey, MK.config.s3.secretKey);
    return s3.getWritePolicy(key, MK.config.s3.bucket, 5*60, MK.config.s3.maxFileSize, MK.config.s3.acl);
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