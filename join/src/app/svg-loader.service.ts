import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
/**
 * Service for loading SVG files dynamically using HTTP requests.
 * Provides functionality to fetch SVG content as text for inline rendering.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class SvgLoaderService {
  constructor(private http: HttpClient) {}

  /**
   * Loads SVG content from a given URL as text.
   * 
   * @param url - The URL of the SVG file to load
   * @returns Observable<string> - SVG content as a text string
   */
  loadSvg(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }
}
