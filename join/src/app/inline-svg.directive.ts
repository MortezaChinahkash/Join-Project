import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SvgLoaderService } from './svg-loader.service';
@Directive({
  selector: '[inlineSvg]'
})
export class InlineSvgDirective implements OnChanges {
  @Input('inlineSvg') url!: string;
  constructor(
    private el: ElementRef,
    private svgLoader: SvgLoaderService,
  ) {}
  /**
   * Angular lifecycle hook - handles input changes.
   * @param changes - Changes parameter
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && this.url) {
      this.loadAndProcessSvg();
    }
  }

  /**
   * Loads SVG and processes it for inline rendering.
   * 
   * @private
   */
  private loadAndProcessSvg(): void {
    this.svgLoader.loadSvg(this.url).subscribe(svgText => {
      const svgElement = this.parseSvgText(svgText);
      const parent = this.el.nativeElement.parentNode;
      if (parent && svgElement) {
        this.processSvgElement(svgElement, parent);
      }
    });
  }

  /**
   * Parses SVG text and returns SVG element.
   * 
   * @param svgText - Raw SVG text content
   * @returns Parsed SVG element
   * @private
   */
  private parseSvgText(svgText: string): Element {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    return doc.documentElement;
  }

  /**
   * Processes SVG element with Angular attributes and replaces host element.
   * 
   * @param svgElement - Parsed SVG element
   * @param parent - Parent element for replacement
   * @private
   */
  private processSvgElement(svgElement: Element, parent: Node): void {
    const ngContentAttr = this.extractAndApplyNgContentAttribute(svgElement);
    this.transferHostClasses(svgElement);
    this.applyNgContentToAllElements(svgElement, ngContentAttr);
    parent.replaceChild(svgElement, this.el.nativeElement);
  }

  /**
   * Extracts Angular content attribute and applies it to SVG element.
   * 
   * @param svgElement - SVG element to process
   * @returns Angular content attribute name or null
   * @private
   */
  private extractAndApplyNgContentAttribute(svgElement: Element): string | null {
    for (let i = 0; i < this.el.nativeElement.attributes.length; i++) {
      const attr = this.el.nativeElement.attributes[i];
      if (attr.name.startsWith('_ngcontent-')) {
        svgElement.setAttribute(attr.name, '');
        return attr.name;
      }
    }
    return null;
  }

  /**
   * Transfers CSS classes from host element to SVG element.
   * 
   * @param svgElement - SVG element to receive classes
   * @private
   */
  private transferHostClasses(svgElement: Element): void {
    const hostClasses = Array.from(this.el.nativeElement.classList) as string[];
    hostClasses.forEach(cls => svgElement.classList.add(cls));
  }

  /**
   * Applies Angular content attribute to all child elements.
   * 
   * @param svgElement - Root SVG element
   * @param ngContentAttr - Angular content attribute name
   * @private
   */
  private applyNgContentToAllElements(svgElement: Element, ngContentAttr: string | null): void {
    if (ngContentAttr) {
      const walker = document.createTreeWalker(svgElement, NodeFilter.SHOW_ELEMENT, null);
      let node = walker.nextNode();
      while (node) {
        (node as Element).setAttribute(ngContentAttr, '');
        node = walker.nextNode();
      }
    }
  }
}
