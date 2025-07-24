/**
 * Advanced Browser Security Module
 * Implementiert erweiterte Sicherheitsmaßnahmen gegen Client-seitige Manipulation
 */

(function() {
  'use strict';

  // Nur in Production aktivieren
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    
    // 1. Console-Hijacking verhindern
    const originalConsole = window.console;
    const noop = function() {};
    
    try {
      Object.defineProperty(window, 'console', {
        get: function() {
          return {
            log: noop, warn: noop, error: noop, info: noop, debug: noop,
            trace: noop, dir: noop, dirxml: noop, table: noop, clear: noop,
            count: noop, countReset: noop, group: noop, groupCollapsed: noop,
            groupEnd: noop, time: noop, timeEnd: noop, timeLog: noop, assert: noop
          };
        },
        set: noop
      });
    } catch(e) {
      // Fallback
      window.console = {
        log: noop, warn: noop, error: noop, info: noop, debug: noop,
        trace: noop, dir: noop, dirxml: noop, table: noop, clear: noop,
        count: noop, countReset: noop, group: noop, groupCollapsed: noop,
        groupEnd: noop, time: noop, timeEnd: noop, timeLog: noop, assert: noop
      };
    }

    // 2. DevTools-Erkennung
    let devtools = false;
    
    // Timer-basierte Erkennung
    setInterval(function() {
      const start = new Date().getTime();
      debugger;
      const end = new Date().getTime();
      
      if (end - start > 100) {
        devtools = true;
        handleDevToolsDetected();
      }
    }, 1000);

    // Größenbasierte Erkennung
    setInterval(function() {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        devtools = true;
        handleDevToolsDetected();
      }
    }, 500);

    function handleDevToolsDetected() {
      // Option 1: Seite ausblenden
      document.body.style.display = 'none';
      
      // Option 2: Warnung anzeigen
      alert('⚠️ Entwicklertools sind nicht erlaubt!\nDie Seite wird neu geladen.');
      
      // Option 3: Weiterleitung
      setTimeout(function() {
        window.location.reload();
      }, 1000);
    }

    // 3. Keyboard-Shortcuts blockieren
    document.addEventListener('keydown', function(e) {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // 4. Rechtsklick blockieren
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    // 5. Textauswahl verhindern
    document.addEventListener('selectstart', function(e) {
      e.preventDefault();
      return false;
    });

    // 6. Drag & Drop verhindern
    document.addEventListener('dragstart', function(e) {
      e.preventDefault();
      return false;
    });

    // 7. Print-Screen erkennen (experimentell)
    document.addEventListener('keyup', function(e) {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshot nicht erlaubt!');
        alert('Screenshots sind nicht erlaubt!');
      }
    });

    // 8. Source-Code-Schutz
    try {
      Object.defineProperty(window, 'Function', {
        get: function() {
          throw new Error('Function constructor ist deaktiviert');
        }
      });
    } catch(e) {}

    // 9. Global Eval blockieren
    try {
      window.eval = function() {
        throw new Error('eval() ist deaktiviert');
      };
    } catch(e) {}

    // 10. Performance-Monitor für verdächtige Aktivitäten
    let lastTime = performance.now();
    setInterval(function() {
      const currentTime = performance.now();
      const timeDiff = currentTime - lastTime;
      
      // Erkennt ungewöhnliche Performance-Muster (DevTools)
      if (timeDiff > 100) {
        handleDevToolsDetected();
      }
      
      lastTime = currentTime;
    }, 50);

    // 11. Memory-basierte Erkennung
    let memoryUsage = performance.memory ? performance.memory.usedJSHeapSize : 0;
    setInterval(function() {
      if (performance.memory) {
        const currentMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = currentMemory - memoryUsage;
        
        // Ungewöhnlich hoher Memory-Verbrauch könnte auf DevTools hindeuten
        if (memoryIncrease > 5000000) { // 5MB
          handleDevToolsDetected();
        }
        
        memoryUsage = currentMemory;
      }
    }, 2000);

    // 12. Viewport-Änderungen überwachen
    window.addEventListener('resize', function() {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > 200 || heightDiff > 200) {
        handleDevToolsDetected();
      }
    });

    // 13. Versteckte Element-Erkennung für DevTools
    function createDetector() {
      const detector = document.createElement('div');
      detector.id = 'devtools-detector';
      detector.style.display = 'none';
      
      Object.defineProperty(detector, 'id', {
        get: function() {
          handleDevToolsDetected();
          return 'devtools-detector';
        }
      });
      
      document.body.appendChild(detector);
      
      // Konsolen-Check
      console.log(detector);
    }

    // Initialisierung nach DOM-Load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createDetector);
    } else {
      createDetector();
    }

    // 14. Page Visibility API für Tab-Wechsel
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        // User hat Tab gewechselt - möglicherweise zu DevTools
        setTimeout(function() {
          if (!document.hidden && devtools) {
            handleDevToolsDetected();
          }
        }, 1000);
      }
    });

    console.log('%c🔒 Sicherheitsmodus aktiviert', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cDeveloper Tools sind deaktiviert!', 'color: red; font-size: 14px;');
  }
})();
