(function() {
    var path = window.location.pathname;
    var isSubRoute = path !== '/' && path !== '/Join/' && path !== '/Join/index.html';
    
    if (isSubRoute) {
        var pageContent = document.documentElement.innerHTML;
        
        var is404 = pageContent.includes('Not Found') || 
                   pageContent.includes('404') ||
                   pageContent.includes('File not found') ||
                   document.title.toLowerCase().includes('not found') ||
                   document.title.includes('404');
        
        if (is404) {
            var newPath = path.replace('/Join/', '').replace('/', '');
            window.location.href = '/Join/#/' + newPath;
        }
    }
})();
