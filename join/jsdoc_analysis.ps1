# JSDoc Enhancement Script for all Services
$servicesPath = "src/app"
$allServices = Get-ChildItem -Path $servicesPath -Recurse -Filter "*.service.ts"

Write-Host "Found $($allServices.Count) service files to process for JSDoc enhancement"

foreach ($serviceFile in $allServices) {
    Write-Host "`nProcessing: $($serviceFile.FullName.Replace((Get-Location).Path + '\', ''))"
    
    $content = Get-Content $serviceFile.FullName -Raw
    
    # Check if this service already has comprehensive JSDoc
    $methods = [regex]::Matches($content, '(?:^\s*)(?:public\s+|private\s+|protected\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    $undocumentedMethods = @()
    
    foreach ($method in $methods) {
        $methodName = $method.Groups[1].Value
        $methodStart = $method.Index
        
        # Skip constructor and common patterns
        if ($methodName -eq "constructor" -or $methodName -eq "ngOnInit" -or $methodName -eq "ngOnDestroy") {
            continue
        }
        
        # Look backwards for JSDoc comment
        $beforeMethod = $content.Substring(0, $methodStart)
        $lastJSDocIndex = $beforeMethod.LastIndexOf("/**")
        $lastMethodIndex = [regex]::Matches($beforeMethod, '(?:^\s*)(?:public\s+|private\s+|protected\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{', [System.Text.RegularExpressions.RegexOptions]::Multiline) | Select-Object -Last 1
        
        # Check if there's a JSDoc comment right before this method
        $hasJSDoc = $false
        if ($lastJSDocIndex -ge 0) {
            $jsdocEnd = $content.IndexOf("*/", $lastJSDocIndex)
            if ($jsdocEnd -ge 0 -and $jsdocEnd -lt $methodStart) {
                # Check if there's any other method between JSDoc and current method
                if ($lastMethodIndex -eq $null -or $lastMethodIndex.Index -lt $lastJSDocIndex) {
                    $hasJSDoc = $true
                }
            }
        }
        
        if (-not $hasJSDoc) {
            $undocumentedMethods += $methodName
        }
    }
    
    Write-Host "  - Found $($undocumentedMethods.Count) undocumented methods: $($undocumentedMethods -join ', ')"
}

Write-Host "`nJSDoc analysis complete. Next step: Add missing JSDoc comments to specific methods."
