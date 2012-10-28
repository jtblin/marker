/**
 * Created with JetBrains WebStorm.
 * User: jtouffeblin
 * Date: 28/10/12
 * Time: 10:06 PM
 * To change this template use File | Settings | File Templates.
 */

Handlebars.registerHelper('session', function (input) {
	return Session.get(input);
});

Handlebars.registerHelper('isCurrentPage', function (page) {
	if (typeof Router !== 'undefined')
		return (Router.current_page() === page);
});
