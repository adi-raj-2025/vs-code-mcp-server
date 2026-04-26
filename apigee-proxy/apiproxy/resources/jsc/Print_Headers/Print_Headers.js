print_Headers = function print_Headers() {
    var response = context.getVariable('response');
    // set the pending request into a context variable
    if(response === null || response === undefined){
        context.setVariable('pendingResponse', "Failed"); 
    } else if (typeof response !== 'string') {
        context.setVariable('pendingResponse', response); 
    }
    
};