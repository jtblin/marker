/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 27/10/12
 * Time: 7:59 PM
 * To change this template use File | Settings | File Templates.
 */

Meteor.startup(function () {
//	Documents.remove({});
});

Meteor.publish("documents", function () {
    return Documents.find(
        {$or: [{public: true}, {shared: this.userId}, {owner: this.userId}]});
});
