addContentLanguageHeader = function addContentLanguageHeader() {
    var contentLanguage = context.getVariable("request.header.Content-Language");
    context.setVariable("message.header.Content-Language", contentLanguage);
    var status = context.getVariable("status");
    var res = "";
    var defaultContentLanguage = context.getVariable("ContentLanguage");
    if(!contentLanguage) {
        context.setVariable("message.header.Content-Language", defaultContentLanguage);
    }

    if(status == 200){
        res = "Success";
    }

    else if(status == 401){
        res = "Unauthorized";
    }

    else if(status == 403){
        res = "Forbidden";
    }
    else if(status == 404){
        res = "Not Found";
    }
    else if(status == 500){
        res = "Server Error";
    }
    else if(status == 502){
        res = "Bad Gateway";
    }
    context.setVariable("response.reason.phrase", res);
};