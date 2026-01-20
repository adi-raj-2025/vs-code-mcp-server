var AddContentlanguageHeaderVar = require('../jsc/AddContentLanguageHeader/AddContentLanguageHeader');
describe('AddContentLanguageHeader suit', function() {
    beforeEach(function() {
        var Context = function() {
        };
        Context.prototype = {
            setVariable: function(propertName, propertyValue){
                this[propertName] = propertyValue;
            },
            getVariable: function(propertyName){
                return this[propertyName];
            }
        };
        context = new Context();
    });

    it('1. POsitive : message.header.Content-Language is from NB', function() {
        context.setVariable("request.header.Content-Language", "en-US");
        addContentLanguageHeader();
        expect(context["message.header.Content-Language"]).toBe("en-US");
    });

    it('2. Positive : message.header.Content-Language is from default when request not set', function() {
        context.setVariable("ContentLanguage", "default-lang");
        addContentLanguageHeader();
        expect(context["message.header.Content-Language"]).toBe("default-lang");
    });

});