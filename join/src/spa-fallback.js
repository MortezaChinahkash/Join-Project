// JavaScript fallback for SPA routing when server doesn't support URL rewriting
(function() {
    // Check if we're not on the main page and got a 404
    var path = window.location.pathname;
    var isSubRoute = path !== '/' && path !== '/Join/' && path !== '/Join/index.html';
    
    if (isSubRoute) {
        // Check if we can detect a 404 scenario
        var pageContent = document.documentElement.innerHTML;
        
        // Common 404 indicators
        var is404 = pageContent.includes('Not Found') || 
                   pageContent.includes('404') ||
                   pageContent.includes('File not found') ||
                   document.title.toLowerCase().includes('not found') ||
                   document.title.includes('404');
        
        if (is404) {
            // Redirect to main page with hash routing
            var newPath = path.replace('/Join/', '').replace('/', '');
            window.location.href = '/Join/#/' + newPath;
        }
    }
})();
