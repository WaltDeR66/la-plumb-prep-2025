import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface ExtractedContent {
  type: 'lesson' | 'quiz' | 'podcast' | 'chat' | 'flashcards' | 'study-notes';
  title: string;
  content: any;
  duration?: number;
}

export class ContentExtractor {
  private browser: any = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async extractFromQuizGecko(url: string, contentType: string): Promise<ExtractedContent | null> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the URL with timeout
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);

      // Extract content based on type
      switch (contentType) {
        case 'lesson':
          return await this.extractLessonContent(page);
        case 'quiz':
          return await this.extractQuizContent(page);
        case 'podcast':
          return await this.extractPodcastContent(page);
        case 'flashcards':
          return await this.extractFlashcardsContent(page);
        case 'study-notes':
          return await this.extractStudyNotesContent(page);
        default:
          return await this.extractGenericContent(page, contentType);
      }
    } catch (error) {
      console.error(`Failed to extract content from ${url}:`, error);
      return null;
    }
  }

  private async extractLessonContent(page: any): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      // Extract lesson text, images, and structure
      const title = document.querySelector('h1, .title, [class*="title"]')?.textContent || 'Lesson Content';
      const textContent = document.querySelector('.lesson-content, .content, main, article')?.innerHTML || 
                         document.body.innerHTML;
      
      // Clean up the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textContent;
      
      // Remove scripts and unwanted elements
      tempDiv.querySelectorAll('script, style, nav, header, footer, .sidebar').forEach(el => el.remove());
      
      return {
        title,
        htmlContent: tempDiv.innerHTML,
        textContent: tempDiv.textContent || '',
      };
    });

    return {
      type: 'lesson',
      title: content.title,
      content: {
        html: content.htmlContent,
        text: content.textContent,
        extractedAt: new Date().toISOString()
      }
    };
  }

  private async extractQuizContent(page: any): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      const title = document.querySelector('h1, .quiz-title')?.textContent || 'Quiz';
      const questions = [];
      
      // Look for quiz questions in various formats
      const questionElements = document.querySelectorAll('.question, [class*="question"], .quiz-item');
      
      questionElements.forEach((questionEl, index) => {
        const questionText = questionEl.querySelector('.question-text, h3, h4')?.textContent || 
                           questionEl.textContent?.split('\n')[0] || `Question ${index + 1}`;
        
        const options = [];
        const optionElements = questionEl.querySelectorAll('.option, .answer, input[type="radio"] + label');
        
        optionElements.forEach((optionEl, optIndex) => {
          options.push({
            id: optIndex,
            text: optionEl.textContent?.trim() || `Option ${optIndex + 1}`,
            isCorrect: optionEl.classList.contains('correct') || 
                      optionEl.querySelector('.correct') !== null
          });
        });

        questions.push({
          id: index,
          question: questionText.trim(),
          options,
          type: 'multiple-choice'
        });
      });

      return { title, questions };
    });

    return {
      type: 'quiz',
      title: content.title,
      content: {
        questions: content.questions,
        totalQuestions: content.questions.length,
        extractedAt: new Date().toISOString()
      }
    };
  }

  private async extractPodcastContent(page: any): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      const title = document.querySelector('h1, .podcast-title')?.textContent || 'Podcast Episode';
      
      // Look for audio elements or podcast content
      const audioElement = document.querySelector('audio, .audio-player');
      const audioSrc = audioElement?.getAttribute('src') || 
                     audioElement?.querySelector('source')?.getAttribute('src');
      
      // Extract transcript or description
      const transcript = document.querySelector('.transcript, .description, .content')?.textContent || '';
      
      return {
        title,
        audioSrc,
        transcript: transcript.trim(),
        duration: audioElement?.duration || null
      };
    });

    return {
      type: 'podcast',
      title: content.title,
      content: {
        audioUrl: content.audioSrc,
        transcript: content.transcript,
        description: `Louisiana Plumbing Code audio lesson covering ${content.title}`,
        extractedAt: new Date().toISOString()
      },
      duration: content.duration ? Math.ceil(content.duration / 60) : undefined
    };
  }

  private async extractFlashcardsContent(page: any): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      const title = document.querySelector('h1, .flashcards-title')?.textContent || 'Flashcards';
      const flashcards = [];
      
      // Look for flashcard elements
      const cardElements = document.querySelectorAll('.flashcard, .card, [class*="flashcard"]');
      
      cardElements.forEach((cardEl, index) => {
        const front = cardEl.querySelector('.front, .question, .term')?.textContent?.trim() || 
                     `Term ${index + 1}`;
        const back = cardEl.querySelector('.back, .answer, .definition')?.textContent?.trim() || 
                    `Definition ${index + 1}`;
        
        flashcards.push({
          id: index,
          front,
          back
        });
      });

      return { title, flashcards };
    });

    return {
      type: 'flashcards',
      title: content.title,
      content: {
        cards: content.flashcards,
        totalCards: content.flashcards.length,
        extractedAt: new Date().toISOString()
      }
    };
  }

  private async extractStudyNotesContent(page: any): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      const title = document.querySelector('h1, .notes-title')?.textContent || 'Study Notes';
      const notesContent = document.querySelector('.notes, .content, main')?.innerHTML || 
                          document.body.innerHTML;
      
      // Extract key points
      const keyPoints = [];
      const listItems = document.querySelectorAll('li, .key-point, .highlight');
      listItems.forEach((item, index) => {
        const text = item.textContent?.trim();
        if (text && text.length > 10) {
          keyPoints.push(text);
        }
      });

      return { title, notesContent, keyPoints };
    });

    return {
      type: 'study-notes',
      title: content.title,
      content: {
        html: content.notesContent,
        keyPoints: content.keyPoints,
        summary: `Study notes for ${content.title}`,
        extractedAt: new Date().toISOString()
      }
    };
  }

  private async extractGenericContent(page: any, contentType: string): Promise<ExtractedContent> {
    const content = await page.evaluate(() => {
      const title = document.querySelector('h1, .title')?.textContent || 'Content';
      const mainContent = document.querySelector('main, .content, article')?.innerHTML || 
                         document.body.innerHTML;
      
      return { title, mainContent };
    });

    return {
      type: contentType as any,
      title: content.title,
      content: {
        html: content.mainContent,
        extractedAt: new Date().toISOString()
      }
    };
  }
}

export const contentExtractor = new ContentExtractor();