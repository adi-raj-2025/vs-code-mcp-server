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

    it('1. Positive : message.header.Content-Language is from NB', function() {
        context.setVariable("request.header.Content-Language", "en-US");
        addContentLanguageHeader();
        expect(context["message.header.Content-Language"]).toBe("en-US");
    });

    
});