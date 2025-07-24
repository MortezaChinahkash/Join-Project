import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsoleProtectionService {

  constructor() {
    this.disableConsoleInput();
  }

  private disableConsoleInput(): void {
    // Blockiere eval() für manuelle Code-Ausführung
    if (typeof window !== 'undefined') {
      const originalEval = window.eval;
      window.eval = function(code: string) {
        const stack = new Error().stack || '';
        
        // Nur blockieren wenn von Console aufgerufen
        if (stack.includes('at eval') || stack.includes('<anonymous>')) {
          console.warn('🚫 eval() ist nicht erlaubt!');
          throw new Error('eval() ist nicht erlaubt!');
        }
        
        return originalEval.call(this, code);
      };

      // Blockiere Function Constructor
      const originalFunction = window.Function;
      window.Function = new Proxy(originalFunction, {
        construct(target, args) {
          const stack = new Error().stack || '';
          
          if (stack.includes('at eval') || stack.includes('<anonymous>')) {
            console.warn('🚫 Function Constructor ist nicht erlaubt!');
            throw new Error('Function Constructor ist nicht erlaubt!');
          }
          
          return Reflect.construct(target, args);
        }
      });

      // Überwache kritische Window-Properties
      this.protectCriticalFunctions();
    }
  }

  private protectCriticalFunctions(): void {
    // Schütze Zugriff auf Angular-spezifische Funktionen
    const criticalProps = ['angular', 'ng', 'getAllAngularRootElements'];
    
    criticalProps.forEach(prop => {
      if ((window as any)[prop]) {
        const original = (window as any)[prop];
        
        Object.defineProperty(window, prop, {
          get: () => {
            const stack = new Error().stack || '';
            
            if (stack.includes('at eval') || stack.includes('<anonymous>')) {
              console.warn(`🚫 Zugriff auf ${prop} von der Console ist nicht erlaubt!`);
              return undefined;
            }
            
            return original;
          },
          configurable: false
        });
      }
    });

    // Überwache document.querySelector für verdächtige Zugriffe
    const originalQuerySelector = document.querySelector;
    document.querySelector = function(selectors: string) {
      const stack = new Error().stack || '';
      
      if (stack.includes('at eval') || stack.includes('<anonymous>')) {
        console.warn('🚫 querySelector von der Console ist eingeschränkt!');
        // Erlaube nur einfache Selektoren, keine komplexen Manipulationen
        if (selectors.includes('*') || selectors.includes('[') || selectors.includes(':')) {
          return null;
        }
      }
      
      return originalQuerySelector.call(this, selectors);
    };
  }

  // Einfache Initialisierung nur für Console-Schutz
  public initializeProtection(): void {
    this.disableConsoleInput();
    
    // Zeige Warnung in der Console
    console.log('%c� Console-Schutz aktiviert', 'color: orange; font-size: 14px; font-weight: bold;');
    console.log('%cManuelle Code-Ausführung ist eingeschränkt!', 'color: orange; font-size: 12px;');
    console.log('%cDevTools und Debugging sind weiterhin erlaubt.', 'color: green; font-size: 12px;');
  }
}
