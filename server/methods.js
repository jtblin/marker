/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 8:17 PM
 * To change this template use File | Settings | File Templates.
 */

Meteor.methods({
	createDocument: function (doc) {
    doc = validate(doc);

		var docId = Documents.insert({
			owner: this.userId,
			title: doc.title,
			content: doc.content,
			public: !! doc.public,
			uri: doc.uri,
			createdAt: Date.now(),
      ns: doc.ns,
			shared: [],
      tags: []
		});

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

		if (! Documents.findOne({$and : [{_id : docId}, {$or : [{public: true}, {shared: this.userId}, {owner: this.userId}]}] }))
			throw new Meteor.Error(403, "You don't have the rights to modify this document");

		return Documents.update({_id : docId}, {$set : {content: doc.content, title: doc.title, public: doc.public, ns: doc.ns, updatedAt: Date.now()} });
	},
  updateTags: function (docId, tags) {
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");
		if (! Documents.findOne({$and : [{_id : docId}, {$or : [{public: true}, {shared: this.userId}, {owner: this.userId}]}] }))
			throw new Meteor.Error(403, "You don't have the rights to modify this document");

		return Documents.update({_id : docId}, {$set : {tags: tags, updatedAt: Date.now()} });
	},
	deleteDocument: function (docId) {
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");
		if (! Documents.findOne({_id : docId, owner: this.userId }))
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
};

function validate (doc) {
  // TODO: validation on both client and server
  doc = doc || {};
  if (isBlank(doc.title) || isBlank(doc.content) || isBlank(doc.ns))
    throw new Meteor.Error(400, "Title, content and namespace can't be blank");
  if (doc.title.length > 100)
    throw new Meteor.Error(413, "Title too long");
  if (doc.title.match(/(_|\?)/))
    throw new Meteor.Error(413, "Title cannot have `_` or `?` characters");
  if (doc.content.length > 10000)
    throw new Meteor.Error(413, "Content too long");
  if (! Meteor.userId())
    throw new Meteor.Error(403, "You must be logged in");
  // TODO: add validation for reserved words, namespaces, etc.

  if (! doc.ns.match(/^\//)) doc.ns = '/' + doc.ns;
  return doc;
}

function isBlank (string) {
  return typeof string === "undefined" || string.trim().length === 0;
}
