/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 8:17 PM
 * To change this template use File | Settings | File Templates.
 */

Meteor.methods({
	// options should include: title, content
	createDocument: function (options) {
		options = options || {};
		if (! (typeof options.title === "string" && options.title.length &&
				typeof options.content === "string" && options.content.length))
			throw new Meteor.Error(400, "Title and/or content missing");
		if (options.title.length > 100)
			throw new Meteor.Error(413, "Title too long");
		if (options.title.match(/(_|\?)/))
			throw new Meteor.Error(413, "Title cannot have `_` or `?` characters");
		if (options.content.length > 10000)
			throw new Meteor.Error(413, "Content too long");
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");
//		var uri = options.title.replace(/\s/g, '-');

		var docId = Documents.insert({
			owner: this.userId,
			title: options.title,
			content: options.content,
			public: !! options.public,
			uri: options.uri,
			shared: []
		});

		try {
			// TODO: find a way to render templates on server side
			Email.send({
				from: "noreply@marker.meteor.com",
				to: contactEmail(Meteor.users.findOne(this.userId)),
				subject: "Congratulations - Your document is created at " + Meteor.absoluteUrl(options.uri),
				html: "<html><body>Your document has been created and you can access it at any time at this url: <a href='" +
						Meteor.absoluteUrl(options.uri) + "'>" + Meteor.absoluteUrl(options.uri) + "</a></body></html>"
			});
		}
		catch (e) {
			l('====== Cannot send email for document ' + docId + '======')
		}

		return docId;
	},
	updateDocument: function (docId, content) {
		if (content.length > 10000)
			throw new Meteor.Error(413, "Content too long");
		if (content.length === 0)
			throw new Meteor.Error(413, "Content can't be blank");
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");
		if (! Documents.findOne({$and : [{_id : docId}, {$or : [{public: true}, {shared: this.userId}, {owner: this.userId}]}] }))
			throw new Meteor.Error(403, "You don't have the rights to modify this document");

		return Documents.update({_id : docId}, {$set : {content: content} });
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
var contactEmail = function (user) {
	if (user.emails && user.emails.length)
		return user.emails[0].address;
	if (user.services && user.services.facebook && user.services.facebook.email)
		return user.services.facebook.email;
	return null;
};
