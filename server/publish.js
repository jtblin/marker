/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 7:59 PM
 * To change this template use File | Settings | File Templates.
 */

var pageSize = 20;

Meteor.startup(function () {
//	Documents.remove({});
});

Meteor.publish("documents", function (query, pageIndex) {
  return Documents.find(
		  { $and: [{$or: [{public: true}, {shared: this.userId}, {owner: this.userId}]}, query] },
		  {skip: (pageIndex-1)*pageSize, limit: pageIndex*pageSize});
});

Meteor.publish("hp_docs", function () {

});