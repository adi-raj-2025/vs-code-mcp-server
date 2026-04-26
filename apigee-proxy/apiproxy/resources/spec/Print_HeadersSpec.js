var Print_HeadersVar = require('../jsc/Print_Headers/Print_Headers');
describe('print_Headers suit', function () {
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

    it('1. pendingResponse set to Failed when response is null', function () {
        context.setVariable('response', null);
        print_Headers();
        expect(context['pendingResponse']).toBe('Failed');
    });

});