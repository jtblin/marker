Meteor.startup(function () {
//	Development utilities area
//	Documents.remove({owner: null});
//	Documents.find().forEach(function (doc) {
//		Documents.update({_id: doc._id}, {$set : {owner: '9dbe9d09-c4dd-4a50-8db9-61d3a82bf2f5'}});
//		Documents.update({_id: doc._id}, {$set : {createdAt: Date.now()}});
//		Documents.update({_id: doc._id}, {$set : {ns: '/me'}});
//	});
//	Documents.update({_id : '53109163-28b0-4609-a8aa-46980a831e27'}, {$set: {owner : null, public: true}});
//	for (var i = 0; i < 100; i++) {
//		Documents.insert({
//			owner: null,
//			title: "title " + i,
//			content: "content " + i,
//			public: true,
//			uri: "title-" + i,
//			shared: []
//		});
//	}
//  Namespaces.update({ns: '/'}, {$set: {public: false} });
//  Namespaces.remove({ns: '/'});
//  Namespaces.remove({});
//  console.log(Namespaces.findOne({ns: '/'}))
//  console.log(Namespaces.find().fetch());
});

Meteor.publish("documents", function () {
  return Documents.find(
    { $or: [{public: true}, {shared: this.userId}, {owner: this.userId}] }
  );
});

Meteor.publish("namespaces", function () {
  return Namespaces.find(
    { $or: [{public: true}, {shared: this.userId}, {owner: this.userId}] }
  );
});