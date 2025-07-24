/**
 * Console Input Protection Module
 * Blockiert nur manuelle Console-Eingaben, lässt DevTools und normale Nutzung zu
 */

(function() {
  'use strict';

  // Aktiviere auch in Development (localhost) zum Testen
  if (typeof window !== 'undefined') {
    
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      console.log('%c🧪 Development: Console-Protection zum Testen aktiviert', 'color: blue; font-size: 16px; font-weight: bold;');
      console.log('%cDu kannst jetzt eval(), Function() etc. testen', 'color: blue; font-size: 12px;');
    } else {
      console.log('%c🔒 Production: Console-Protection aktiviert', 'color: orange; font-size: 16px; font-weight: bold;');
    }
    
    console.log('%cManuelle Code-Ausführung ist eingeschränkt.', 'color: orange; font-size: 12px;');
    console.log('%cDevTools, Rechtsklick und normale Nutzung sind weiterhin erlaubt.', 'color: green; font-size: 12px;');

    // 1. Blockiere eval() für manuelle Ausführung
    const originalEval = window.eval;
    window.eval = function(code) {
      const stack = new Error().stack || '';
      
      if (stack.includes('at eval') || stack.includes('<anonymous>')) {
        console.warn('🚫 eval() von der Console ist nicht erlaubt!');
        throw new Error('eval() ist nicht erlaubt!');
      }
      
      return originalEval.call(this, code);
    };

    // 2. Blockiere Function Constructor für manuelle Ausführung
    const originalFunction = window.Function;
    window.Function = new Proxy(originalFunction, {
      construct: function(target, args) {
        const stack = new Error().stack || '';
        
        if (stack.includes('at eval') || stack.includes('<anonymous>')) {
          console.warn('🚫 Function Constructor von der Console ist nicht erlaubt!');
          throw new Error('Function Constructor ist nicht erlaubt!');
        }
        
        return Reflect.construct(target, args);
      }
    });

    // 3. Schütze kritische DOM-Manipulationen
    const originalQuerySelector = document.querySelector;
    document.querySelector = function(selectors) {
      const stack = new Error().stack || '';
      
      if (stack.includes('at eval') || stack.includes('<anonymous>')) {
        // Erlaube nur einfache Selektoren von der Console
        if (selectors.includes('*') || selectors.includes('[') || selectors.includes(':not') || selectors.includes('~')) {
          console.warn('🚫 Komplexe Selektoren von der Console sind eingeschränkt!');
          return null;
        }
      }
      
      return originalQuerySelector.call(this, selectors);
    };

    // 4. Überwache kritische Window-Properties
    const criticalProps = ['angular', 'ng'];
    criticalProps.forEach(function(prop) {
      if (window[prop]) {
        const original = window[prop];
        
        Object.defineProperty(window, prop, {
          get: function() {
            const stack = new Error().stack || '';
            
            if (stack.includes('at eval') || stack.includes('<anonymous>')) {
              console.warn('🚫 Zugriff auf ' + prop + ' von der Console ist eingeschränkt!');
              return undefined;
            }
            
            return original;
          },
          configurable: false
        });
      }
    });

    // 5. Informative Nachricht für Benutzer
    setTimeout(function() {
      if (isDevelopment) {
        console.log('%c🧪 Development-Info: Console-Protection ist aktiv zum Testen.', 'color: blue; font-size: 12px;');
        console.log('%cVersuche: eval("alert(\'test\')"), new Function("alert(\'test\')")(), ng.getComponent()', 'color: blue; font-size: 11px;');
      } else {
        console.log('%cInfo: Diese Anwendung hat einen Console-Schutz aktiviert.', 'color: blue; font-size: 12px;');
        console.log('%cSie können die DevTools weiterhin normal nutzen, aber manuelle Code-Ausführung ist eingeschränkt.', 'color: blue; font-size: 11px;');
      }
    }, 2000);

  }
})();
