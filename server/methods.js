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
			throw new Meteor.Error(400, "Required parameter missing");
		if (options.title.length > 100)
			throw new Meteor.Error(413, "Title too long");
		if (options.title.match(/_/))
			throw new Meteor.Error(413, "Title cannot contain underscore");
		if (options.content.length > 10000)
			throw new Meteor.Error(413, "Content too long");
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");

		return Documents.insert({
			owner: this.userId,
			title: options.title,
			content: options.content,
			public: !! options.public,
			shared: []
		});
	},
	updateDocument: function (docId, content) {
		if (content.length > 10000)
			throw new Meteor.Error(413, "Content too long");
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");
		if (! Documents.find({$and : [{_id : docId}, {$or : [{public: true}, {shared: this.userId}, {owner: this.userId}]}] }))
			throw new Meteor.Error(403, "You don't have the rights to modify this document");

		return Documents.update({_id : docId}, {$set : {content: content} });
	}
});
