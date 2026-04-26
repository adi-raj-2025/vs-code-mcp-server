var AddContentlanguageHeaderVar = require('../jsc/AddContentLanguageHeader/AddContentLanguageHeader');
describe('AddContentLanguageHeader suit', function () {
    beforeEach(function () {
        var Context = function () {
        };
        Context.prototype = {
            setVariable: function (propertName, propertyValue) {
                this[propertName] = propertyValue;
            },
            getVariable: function (propertyName) {
                return this[propertyName];
            }
        };
        context = new Context();
    });

    it('1. Positive : message.header.Content-Language is from NB', function () {
        context.setVariable("request.header.Content-Language", "en-US");
        context.setVariable("status", 200);
        addContentLanguageHeader();
        expect(context["message.header.Content-Language"]).toBe("en-US");
        expect(context["response.reason.phrase"]).toBe("Success");
    });

    it('T01 : status 401 returns Unauthorized', function () {
        context.setVariable("status", 401);
        addContentLanguageHeader();
        expect(context["response.reason.phrase"]).toBe("Unauthorized");
    });

    it('T02 : status 403 returns Forbidden', function () {
        context.setVariable("status", 403);
        addContentLanguageHeader();
        expect(context["response.reason.phrase"]).toBe("Forbidden");
    });

    it('T03 : status 500 returns Server Error', function () {
        context.setVariable("status", 500);
        addContentLanguageHeader();
        expect(context["response.reason.phrase"]).toBe("Server Error");
    });

    it('T04 : status 502 returns Bad Gateway', function () {
        context.setVariable("status", 502);
        addContentLanguageHeader();
        expect(context["response.reason.phrase"]).toBe("Bad Gateway");
    });


});