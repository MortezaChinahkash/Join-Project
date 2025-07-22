import { Injectable } from '@angular/core';

/**
 * Service for finding scrollable containers in the DOM.
 * Handles container detection and scroll capability validation.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class BoardScrollContainerService {

  /**
   * Finds the scrollable container element.
   * 
   * @returns Scrollable container or null
   */
  findScrollableContainer(): HTMLElement | null {
    const containerSelectors = [
      '.main', '.main-content', '.board-container', 
      '.content', '.page'
    ];
    
    for (const selector of containerSelectors) {
      const container = this.findContainerBySelector(selector);
      if (container) return container;
    }
    
    return this.findFallbackContainer();
  }

  /**
   * Finds container by CSS selector with scroll validation.
   */
  private findContainerBySelector(selector: string): HTMLElement | null {
    const container = document.querySelector(selector) as HTMLElement;
    if (container && this.canScrollVertically(container)) {
      return container;
    }
    
    if (selector === '.board-scroll-wrapper' && container) {
      return container;
    }
    
    return null;
  }

  /**
   * Finds fallback container when no specific container is found.
   */
  private findFallbackContainer(): HTMLElement | null {
    const wrapper = document.querySelector('.board-scroll-wrapper') as HTMLElement;
    if (wrapper) return wrapper;
    
    if (this.canScrollVertically(document.body)) {
      return document.body;
    }
    
    return document.documentElement;
  }

  /**
   * Checks if an element can scroll vertically.
   * 
   * @param element - Element to check
   * @returns True if element can scroll vertically
   */
  canScrollVertically(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'scroll' || overflowY === 'auto') && 
           element.scrollHeight > element.clientHeight;
  }

  /**
   * Finds a parent element that can scroll vertically.
   * 
   * @param element - Starting element
   * @returns Vertically scrollable parent or null
   */
  findVerticalScrollableParent(element: HTMLElement): HTMLElement | null {
    const scrollableParent = this.traverseParentsForScroll(element);
    if (scrollableParent) return scrollableParent;
    
    return this.getDocumentScrollFallback();
  }

  /**
   * Traverses parent elements to find one that can scroll vertically.
   */
  private traverseParentsForScroll(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      if (this.canScrollVertically(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Gets document-level scroll fallback options.
   */
  private getDocumentScrollFallback(): HTMLElement | null {
    if (this.canScrollVertically(document.body)) {
      return document.body;
    }
    
    if (this.canScrollVertically(document.documentElement)) {
      return document.documentElement;
    }
    
    return null;
  }

  /**
   * Checks if an element can scroll horizontally.
   * 
   * @param element - Element to check
   * @returns True if element can scroll horizontally
   */
  canScrollHorizontally(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowX = style.overflowX;
    return (overflowX === 'scroll' || overflowX === 'auto') && 
           element.scrollWidth > element.clientWidth;
  }

  /**
   * Finds the horizontal scrollable container element.
   * 
   * @returns Horizontal scrollable container or null
   */
  findHorizontalScrollableContainer(): HTMLElement | null {
    const boardContainer = this.findHorizontalBoardContainer();
    if (boardContainer) return boardContainer;
    
    return this.findHorizontalDocumentContainer();
  }

  /**
   * Finds horizontal scrollable container among board-specific elements.
   * 
   * @returns Board container or null
   */
  private findHorizontalBoardContainer(): HTMLElement | null {
    const selectors = ['.board-scroll-wrapper', '.board-container', '.main', '.content'];
    
    for (const selector of selectors) {
      const container = this.findHorizontalContainerBySelector(selector);
      if (container) return container;
    }
    
    return null;
  }

  /**
   * Finds horizontal scrollable container at document level.
   * 
   * @returns Document container or null
   */
  private findHorizontalDocumentContainer(): HTMLElement | null {
    if (this.canScrollHorizontally(document.body)) {
      return document.body;
    }
    
    if (this.canScrollHorizontally(document.documentElement)) {
      return document.documentElement;
    }
    
    return null;
  }

  /**
   * Finds horizontal container by CSS selector with scroll validation.
   * 
   * @param selector - CSS selector to search for
   * @returns Container element or null
   */
  private findHorizontalContainerBySelector(selector: string): HTMLElement | null {
    const container = document.querySelector(selector) as HTMLElement;
    return (container && this.canScrollHorizontally(container)) ? container : null;
  }
}
