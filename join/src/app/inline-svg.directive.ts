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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && this.url) {
      this.svgLoader.loadSvg(this.url).subscribe(svgText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        const parent = this.el.nativeElement.parentNode;
        if (parent && svgElement) {
          let ngContentAttr: string | null = null;
          for (let i = 0; i < this.el.nativeElement.attributes.length; i++) {
            const attr = this.el.nativeElement.attributes[i];
            if (attr.name.startsWith('_ngcontent-')) {
              ngContentAttr = attr.name;
              svgElement.setAttribute(attr.name, '');
              break;
            }
          }
          const hostClasses = Array.from(this.el.nativeElement.classList) as string[];
          hostClasses.forEach(cls => svgElement.classList.add(cls));
          if (ngContentAttr) {
            const walker = document.createTreeWalker(svgElement, NodeFilter.SHOW_ELEMENT, null);
            let node = walker.nextNode();
            while (node) {
              (node as Element).setAttribute(ngContentAttr, '');
              node = walker.nextNode();
            }
          }
          parent.replaceChild(svgElement, this.el.nativeElement);
        }
      });
    }
  }
}