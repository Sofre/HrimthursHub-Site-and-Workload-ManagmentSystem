import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  // this a shared component for language toggle so it doesn't have its own html file
  template: `
    <div class="flex items-center space-x-2">
      <button
        (click)="toggleLanguage()"
        class="flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-sm font-medium text-gray-700">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
        </svg>
        {{ currentLanguage === 'en' ? 'ENG' : 'МКД' }}
      </button>
    </div>
  `
})
export class LanguageToggleComponent implements OnInit {
  currentLanguage: string = 'en';

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    // Initialize translation with same translations as signup component
    this.translate.setFallbackLang('en');
    
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(event => {
      this.currentLanguage = event.lang;
    });
    
    this.currentLanguage = this.translate.getCurrentLang() || 'en';
  }

  toggleLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'en' ? 'mk' : 'en';
    this.translate.use(this.currentLanguage);
  }
}