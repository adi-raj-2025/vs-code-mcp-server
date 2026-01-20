addContentLanguageHeader = function addContentLanguageHeader() {
    var contentLanguage = context.getVariable("request.header.Content-Language");
    context.setVariable("message.header.Content-Language", contentLanguage);
    var defaultContentLanguage = context.getVariable("ContentLanguage");
    if(!contentLanguage) {
        context.setVariable("message.header.Content-Language", defaultContentLanguage);
    }
};