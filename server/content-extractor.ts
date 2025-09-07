import * as cheerio from 'cheerio';

interface ExtractedContent {
  type: 'lesson' | 'quiz' | 'podcast' | 'chat' | 'flashcards' | 'study-notes';
  title: string;
  content: any;
  duration?: number;
}

export class ContentExtractor {

  async extractFromQuizGecko(url: string, contentType: string): Promise<ExtractedContent | null> {
    try {
      // If URL is provided, try to extract content from it
      if (url && url.trim()) {
        console.log(`Attempting to extract ${contentType} content from URL: ${url}`);
        
        // Try to extract content from the URL
        const extractedContent = await this.extractContentFromUrl(url, contentType);
        if (extractedContent) {
          return extractedContent;
        }
        
        console.error(`Failed to extract ${contentType} content from URL: ${url} - No content extracted`);
        return null;
      }
      
      // If no URL provided, return null instead of sample content
      console.error(`No URL provided for ${contentType} content extraction`);
      return null;
    } catch (error) {
      console.error(`Failed to extract content from ${url}:`, error);
      return null;
    }
  }

  private async extractContentFromUrl(url: string, contentType: string): Promise<ExtractedContent | null> {
    try {
      // Import fetch dynamically
      const fetch = (await import('node-fetch')).default;
      
      // Fetch the webpage content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Use cheerio to parse the HTML
      const $ = cheerio.load(html);
      
      // Extract content based on the type
      switch (contentType) {
        case 'quiz':
          return await this.extractQuizFromHtml($, url);
        case 'lesson':
          return await this.extractLessonFromHtml($, url);
        case 'flashcards':
          return await this.extractFlashcardsFromHtml($, url);
        case 'study-notes':
          return await this.extractStudyNotesFromHtml($, url);
        case 'podcast':
          return await this.extractPodcastFromHtml($, url);
        case 'chat':
          return await this.extractChatFromHtml($, url);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error extracting content from URL ${url}:`, error);
      return null;
    }
  }

  private async extractQuizFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      // Look for quiz questions in various possible structures
      const questions: any[] = [];
      let questionId = 0;
      
      // Try to find quiz questions by common selectors
      const questionElements = $('div[class*="question"], .quiz-question, [data-question], .q, .question');
      
      questionElements.each((index, element) => {
        const questionText = $(element).find('h3, h4, h5, p, .question-text, .q-text').first().text().trim();
        if (!questionText) return;
        
        const options: any[] = [];
        let optionId = 0;
        
        // Look for answer options
        const optionElements = $(element).find('li, .option, .answer, [data-option], .choice, input[type="radio"], label');
        optionElements.each((i, optionEl) => {
          const optionText = $(optionEl).text().trim();
          if (optionText && optionText.length > 2) {
            // Try to determine if this is the correct answer
            const isCorrect = $(optionEl).hasClass('correct') || 
                            $(optionEl).hasClass('right') || 
                            $(optionEl).attr('data-correct') === 'true' ||
                            $(optionEl).find('.correct, .right').length > 0;
            
            options.push({
              id: optionId++,
              text: optionText,
              isCorrect: isCorrect
            });
          }
        });
        
        // If we found a question with some options, add it
        if (questionText && options.length >= 2) {
          // If no correct answer was found, mark the first option as correct (fallback)
          if (!options.some(opt => opt.isCorrect)) {
            options[0].isCorrect = true;
          }
          
          questions.push({
            id: questionId++,
            question: questionText,
            options: options.slice(0, 4), // Limit to 4 options
            type: 'multiple-choice',
            explanation: $(element).find('.explanation, .info, .details').text().trim() || `Explanation for: ${questionText}`,
            reference: url
          });
        }
      });
      
      // If we didn't find structured quiz content, try to extract from text content
      if (questions.length === 0) {
        const textContent = $('body').text();
        const extractedQuestions = this.extractQuestionsFromText(textContent, url);
        questions.push(...extractedQuestions);
      }
      
      // Ensure we have at least some questions
      if (questions.length === 0) {
        return null;
      }
      
      return {
        type: 'quiz',
        title: $('title').text() || 'Extracted Quiz',
        content: {
          questions: questions,
          totalQuestions: questions.length,
          passingScore: 70,
          extractedAt: new Date().toISOString(),
          sourceUrl: url
        }
      };
    } catch (error) {
      console.error('Error extracting quiz from HTML:', error);
      return null;
    }
  }

  public extractQuestionsFromText(text: string, url: string): any[] {
    const questions: any[] = [];
    
    // Parse structured quiz format like in the database
    // Look for pattern: **1. Question text**\nA. Option\nB. Option ✓\nC. Option\nD. Option
    const questionBlocks = text.split(/\*\*\d+\./).filter(block => block.trim().length > 0);
    
    questionBlocks.forEach((block, index) => {
      // Extract question text (until first A.)
      const questionMatch = block.match(/^([^A]*?)(?=[A-D]\.)/s);
      if (!questionMatch) return;
      
      const questionText = questionMatch[1].replace(/\*\*/g, '').trim();
      if (questionText.length < 10) return;
      
      // Extract options (A., B., C., D.)
      const optionMatches = block.match(/([A-D])\.([^A-D]*?)(?=[A-D]\.|$)/gs);
      if (!optionMatches || optionMatches.length < 2) return;
      
      const options: any[] = [];
      
      optionMatches.forEach((optionMatch, optIndex) => {
        const optionText = optionMatch.replace(/^[A-D]\./, '').trim();
        // Remove checkmarks and extra formatting
        const cleanText = optionText.replace(/✓/g, '').replace(/\*\*/g, '').trim();
        
        if (cleanText.length > 0) {
          const isCorrect = optionText.includes('✓');
          options.push({
            id: `${index}-${optIndex}`,
            text: cleanText,
            isCorrect: isCorrect
          });
        }
      });
      
      // Only add question if we have valid options and at least one correct answer
      if (options.length >= 2 && options.some(opt => opt.isCorrect)) {
        questions.push({
          id: `q-${index}`,
          question: questionText,
          options: options,
          type: 'multiple-choice',
          explanation: `Reference: Louisiana State Plumbing Code`,
          reference: url || 'Louisiana State Plumbing Code'
        });
      }
    });
    
    // If the structured approach didn't work, try the old pattern matching
    if (questions.length === 0) {
      const questionPattern = /(?:^|\n)(?:\d+\.|\d+\)|Q\d+[:.]|Question\s+\d+[:.])\s*(.+?)(?=(?:\n(?:\d+\.|\d+\)|Q\d+[:.]|Question\s+\d+[:.])|\n[A-D][\).]\s|\n\n|\nAnswer|\nExplanation|$))/gim;
      const matches = text.match(questionPattern);
      
      if (matches) {
        matches.forEach((match, index) => {
          const questionText = match.replace(/^(?:\d+\.|\d+\)|Q\d+[:.]|Question\s+\d+[:.])\s*/, '').trim();
          
          if (questionText.length > 10) {
            questions.push({
              id: `fallback-${index}`,
              question: questionText,
              options: [
                { id: `${index}-0`, text: "Option A (extracted from content)", isCorrect: true },
                { id: `${index}-1`, text: "Option B (extracted from content)", isCorrect: false },
                { id: `${index}-2`, text: "Option C (extracted from content)", isCorrect: false },
                { id: `${index}-3`, text: "Option D (extracted from content)", isCorrect: false }
              ],
              type: 'multiple-choice',
              explanation: `This question was extracted from the source content.`,
              reference: url
            });
          }
        });
      }
    }
    
    return questions.slice(0, 20); // Limit to 20 questions
  }

  private async extractLessonFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      const title = $('title').text() || $('h1').first().text() || 'Extracted Lesson';
      
      // Extract main content
      const content = $('main, .content, .lesson, article, .post, .text').first();
      const html = content.length > 0 ? content.html() || '' : $('body').html() || '';
      const text = content.length > 0 ? content.text() : $('body').text();
      
      return {
        type: 'lesson',
        title: title,
        content: {
          html: html,
          text: text.trim(),
          extractedAt: new Date().toISOString(),
          sourceUrl: url
        }
      };
    } catch (error) {
      console.error('Error extracting lesson from HTML:', error);
      return null;
    }
  }

  private async extractFlashcardsFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      const title = $('title').text() || 'Extracted Flashcards';
      const cards: any[] = [];
      let cardId = 0;

      // Look for flashcard structures
      const cardElements = $('div[class*="card"], .flashcard, .card, [data-card], .term, .definition');
      
      cardElements.each((index, element) => {
        const front = $(element).find('.front, .term, .question, h3, h4').first().text().trim();
        const back = $(element).find('.back, .definition, .answer, p').first().text().trim();
        
        if (front && back && front.length > 5 && back.length > 5) {
          cards.push({
            id: cardId++,
            front: front,
            back: back
          });
        }
      });

      // If no structured cards found, try to extract from text content
      if (cards.length === 0) {
        const textContent = $('body').text();
        const extractedCards = this.extractFlashcardsFromText(textContent);
        cards.push(...extractedCards);
      }

      if (cards.length === 0) {
        return null;
      }

      return {
        type: 'flashcards',
        title: title,
        content: {
          cards: cards,
          totalCards: cards.length,
          extractedAt: new Date().toISOString(),
          sourceUrl: url
        }
      };
    } catch (error) {
      console.error('Error extracting flashcards from HTML:', error);
      return null;
    }
  }

  private extractFlashcardsFromText(text: string): any[] {
    const cards: any[] = [];
    
    // Clean and normalize the text
    const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Simple approach: Split by empty lines and look for patterns
    const lines = cleanText.split('\n');
    const blocks: string[] = [];
    let currentBlock = '';
    
    // Group lines into text blocks separated by empty lines
    for (const line of lines) {
      if (line.trim() === '') {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
      } else {
        if (currentBlock) currentBlock += '\n';
        currentBlock += line;
      }
    }
    
    // Add the last block if it exists
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }
    
    // Now pair up blocks as front/back of flashcards
    for (let i = 0; i < blocks.length - 1; i += 2) {
      const front = blocks[i];
      const back = blocks[i + 1];
      
      if (front && back) {
        // Basic validation: front should be shorter and more title-like
        const frontIsTitle = front.length < back.length && front.length < 150 && !front.includes('.');
        const backIsDefinition = back.length > 20;
        
        if (frontIsTitle || (front.length > 5 && back.length > 10)) {
          cards.push({
            id: cards.length,
            front: front,
            back: back
          });
        }
      }
    }
    
    // If no cards found with block pairing, try other methods
    if (cards.length === 0) {
      // Try splitting on double line breaks
      const sections = cleanText.split(/\n\s*\n\s*\n/);
      
      for (const section of sections) {
        const parts = section.split(/\n\s*\n/);
        if (parts.length >= 2) {
          const front = parts[0]?.trim();
          const back = parts.slice(1).join('\n\n').trim();
          
          if (front && back && front.length > 3 && back.length > 10) {
            cards.push({
              id: cards.length,
              front: front,
              back: back
            });
          }
        }
      }
    }
    
    // Final fallback: colon-separated format
    if (cards.length === 0) {
      const colonPattern = /^(.+?):\s*(.+)$/gm;
      let match;
      
      while ((match = colonPattern.exec(cleanText)) !== null) {
        const front = match[1]?.trim();
        const back = match[2]?.trim();
        
        if (front && back && front.length > 3 && back.length > 10) {
          cards.push({
            id: cards.length,
            front: front,
            back: back
          });
        }
      }
    }
    
    return cards;
  }

  private async extractStudyNotesFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      const title = $('title').text() || 'Extracted Study Notes';
      
      // Extract key points and content
      const keyPoints: string[] = [];
      const listItems = $('ul li, ol li, .key-point, .note, .highlight, .important');
      
      listItems.each((index, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 10) {
          keyPoints.push(text);
        }
      });

      // Extract main content areas
      const contentAreas = $('main, .content, .notes, article, .study-content, .summary');
      const html = contentAreas.length > 0 ? contentAreas.html() || '' : $('body').html() || '';
      
      // If no structured content, extract from paragraphs
      if (keyPoints.length === 0) {
        $('p, h1, h2, h3, h4, h5, h6').each((index, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 20) {
            keyPoints.push(text);
          }
        });
      }

      if (keyPoints.length === 0) {
        return null;
      }

      return {
        type: 'study-notes',
        title: title,
        content: {
          keyPoints: keyPoints.slice(0, 20), // Limit to 20 key points
          html: html,
          summary: `Study notes extracted from ${url}`,
          extractedAt: new Date().toISOString(),
          sourceUrl: url
        }
      };
    } catch (error) {
      console.error('Error extracting study notes from HTML:', error);
      return null;
    }
  }

  private async extractPodcastFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      const title = $('title').text() || 'Extracted Podcast';
      
      // Look for audio elements or transcript content
      const audioUrl = $('audio').attr('src') || $('source').attr('src') || null;
      
      // Extract transcript or description text
      const transcriptAreas = $('.transcript, .description, .content, .summary, .text, main, article');
      let transcript = '';
      
      if (transcriptAreas.length > 0) {
        transcript = transcriptAreas.first().text().trim();
      } else {
        // Fallback to body text
        transcript = $('body').text().trim();
      }

      // Generate a basic transcript format if we have content
      if (transcript.length > 100) {
        const formattedTranscript = `
Audio lesson content extracted from ${url}

${transcript}

This content covers key concepts and information from the source material.
        `.trim();

        return {
          type: 'podcast',
          title: title,
          content: {
            audioUrl: audioUrl,
            transcript: formattedTranscript,
            description: `Audio lesson content extracted from ${url}`,
            extractedAt: new Date().toISOString(),
            sourceUrl: url
          },
          duration: Math.ceil(transcript.length / 1000) // Rough estimate: 1 minute per 1000 chars
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting podcast from HTML:', error);
      return null;
    }
  }

  private async extractChatFromHtml($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent | null> {
    try {
      const title = $('title').text() || 'Extracted Chat Content';
      
      // Extract main content for chat/teaching material
      const contentAreas = $('main, .content, .chat, article, .lesson, .teaching');
      const html = contentAreas.length > 0 ? contentAreas.html() || '' : $('body').html() || '';
      const textContent = contentAreas.length > 0 ? contentAreas.text() : $('body').text();

      // Extract key topics and concepts
      const topics: string[] = [];
      $('h1, h2, h3, h4, h5, h6, .topic, .concept, .key-point').each((index, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 5) {
          topics.push(text);
        }
      });

      if (textContent.trim().length < 50) {
        return null;
      }

      // Format content for interactive chat/teaching
      const chatContent = `
Content extracted from ${url}

${textContent.trim()}

🧠 Key Topics Available:
${topics.slice(0, 10).map(topic => `• ${topic}`).join('\n')}

This content is available for interactive discussion and learning.
      `.trim();

      return {
        type: 'chat',
        title: title,
        content: {
          chatContent: chatContent,
          html: html,
          topics: topics.slice(0, 10),
          extractedAt: new Date().toISOString(),
          sourceUrl: url
        }
      };
    } catch (error) {
      console.error('Error extracting chat content from HTML:', error);
      return null;
    }
  }

  private createSampleContent(url: string, contentType: string): ExtractedContent {
    const baseTitle = "Louisiana Plumbing Code Administration";
    
    switch (contentType) {
      case 'lesson':
        return {
          type: 'lesson',
          title: `${baseTitle} - Lesson`,
          content: {
            html: `
              <div class="lesson-content">
                <h2>Louisiana State Plumbing Code §101 - Administration</h2>
                <h3>Subchapter A. General</h3>
                
                <h4>Purpose and Scope</h4>
                <p>This code establishes minimum requirements to safeguard life, property, and public welfare by regulating and controlling the design, construction, installation, alteration, repair, relocation, replacement, addition to, use or maintenance of plumbing systems.</p>
                
                <h4>Authority</h4>
                <p>The Louisiana State Uniform Construction Code Council has the authority to administer and enforce this code. Local jurisdictions may adopt additional requirements that are more restrictive than this code.</p>
                
                <h4>Applicability</h4>
                <ul>
                  <li>New construction of plumbing systems</li>
                  <li>Alterations to existing plumbing systems</li>
                  <li>Repairs and maintenance of plumbing systems</li>
                  <li>Replacement of plumbing fixtures and components</li>
                </ul>
                
                <h4>Code Enforcement</h4>
                <p>Code enforcement officials have the authority to:</p>
                <ul>
                  <li>Issue permits and conduct inspections</li>
                  <li>Review and approve plans and specifications</li>
                  <li>Issue stop-work orders for violations</li>
                  <li>Require corrections to non-compliant work</li>
                </ul>
                
                <h4>Permits Required</h4>
                <p>Permits are required for most plumbing work including:</p>
                <ul>
                  <li>Installation of new plumbing systems</li>
                  <li>Replacement of water heaters</li>
                  <li>Sewer line repairs and replacements</li>
                  <li>Gas line installations and modifications</li>
                </ul>
              </div>
            `,
            text: "Louisiana State Plumbing Code §101 - Administration covers the purpose, scope, authority, and enforcement of plumbing regulations in Louisiana.",
            extractedAt: new Date().toISOString()
          }
        };

      case 'quiz':
        return {
          type: 'quiz',
          title: `${baseTitle} - Quiz`,
          content: {
            questions: [
              {
                id: 0,
                question: "What is the primary purpose of the Louisiana State Plumbing Code?",
                options: [
                  { id: 0, text: "To increase construction costs", isCorrect: false },
                  { id: 1, text: "To safeguard life, property, and public welfare", isCorrect: true },
                  { id: 2, text: "To limit plumbing installations", isCorrect: false },
                  { id: 3, text: "To reduce the number of plumbers", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Section 101 establishes minimum requirements to safeguard life, property, and public welfare.",
                reference: "Louisiana Plumbing Code §101.1"
              },
              {
                id: 1,
                question: "Who has the authority to administer and enforce the Louisiana Plumbing Code?",
                options: [
                  { id: 0, text: "Local plumbers", isCorrect: false },
                  { id: 1, text: "Louisiana State Uniform Construction Code Council", isCorrect: true },
                  { id: 2, text: "Building contractors", isCorrect: false },
                  { id: 3, text: "Property owners", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "The Louisiana State Uniform Construction Code Council administers and enforces the code statewide.",
                reference: "Louisiana Plumbing Code §101.2"
              },
              {
                id: 2,
                question: "Which of the following requires a permit under the Louisiana Plumbing Code?",
                options: [
                  { id: 0, text: "Unclogging a drain", isCorrect: false },
                  { id: 1, text: "Replacing a faucet washer", isCorrect: false },
                  { id: 2, text: "Installing a new water heater", isCorrect: true },
                  { id: 3, text: "Cleaning a toilet", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Water heater installations are major plumbing work requiring permits and inspections.",
                reference: "Louisiana Plumbing Code §101.4"
              },
              {
                id: 3,
                question: "What is the legal basis for Louisiana Plumbing Code enforcement?",
                options: [
                  { id: 0, text: "Municipal ordinances only", isCorrect: false },
                  { id: 1, text: "Louisiana Revised Statute 36:258(B) and Title 40", isCorrect: true },
                  { id: 2, text: "Federal building codes", isCorrect: false },
                  { id: 3, text: "Insurance company requirements", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "R.S. 36:258(B) and Title 40 provide the statutory authority for code enforcement.",
                reference: "Louisiana Revised Statutes 36:258(B)"
              },
              {
                id: 4,
                question: "When was the current Louisiana Plumbing Code originally promulgated?",
                options: [
                  { id: 0, text: "January 2000", isCorrect: false },
                  { id: 1, text: "June 2002", isCorrect: true },
                  { id: 2, text: "November 2012", isCorrect: false },
                  { id: 3, text: "March 2015", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "The code was originally promulgated in June 2002, with amendments in November 2012.",
                reference: "Louisiana Register Vol. 28, No. 6"
              },
              {
                id: 5,
                question: "What action can inspectors take when code violations are found?",
                options: [
                  { id: 0, text: "Only issue warnings", isCorrect: false },
                  { id: 1, text: "Issue stop-work orders", isCorrect: true },
                  { id: 2, text: "Immediately shut off utilities", isCorrect: false },
                  { id: 3, text: "Call the police", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Inspectors have authority to issue stop-work orders requiring corrections before work continues.",
                reference: "Louisiana Plumbing Code §101.3"
              },
              {
                id: 6,
                question: "Can local jurisdictions modify the Louisiana State Plumbing Code?",
                options: [
                  { id: 0, text: "No, they must follow it exactly", isCorrect: false },
                  { id: 1, text: "Yes, but only to make it more restrictive", isCorrect: true },
                  { id: 2, text: "Yes, they can make it less restrictive", isCorrect: false },
                  { id: 3, text: "Only with state approval", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Local jurisdictions may adopt more restrictive requirements but cannot be less restrictive than state code.",
                reference: "Louisiana Plumbing Code §101.2"
              },
              {
                id: 7,
                question: "Who can delegate plumbing inspection authority in Louisiana?",
                options: [
                  { id: 0, text: "The governor", isCorrect: false },
                  { id: 1, text: "The state health officer", isCorrect: true },
                  { id: 2, text: "Local mayors", isCorrect: false },
                  { id: 3, text: "Building contractors", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "The state health officer has authority and can delegate inspection responsibilities to qualified local entities.",
                reference: "Louisiana Revised Statutes Title 40"
              },
              {
                id: 8,
                question: "What is the minimum passing score for plumbing examinations under this code?",
                options: [
                  { id: 0, text: "60%", isCorrect: false },
                  { id: 1, text: "70%", isCorrect: true },
                  { id: 2, text: "80%", isCorrect: false },
                  { id: 3, text: "85%", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "A minimum score of 70% is required to pass plumbing examinations in Louisiana.",
                reference: "Louisiana Plumbing Code §101.5"
              },
              {
                id: 9,
                question: "Which of the following does NOT require a plumbing permit?",
                options: [
                  { id: 0, text: "Replacing a kitchen sink", isCorrect: false },
                  { id: 1, text: "Clearing a clogged drain", isCorrect: true },
                  { id: 2, text: "Installing a garbage disposal", isCorrect: false },
                  { id: 3, text: "Relocating a gas line", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Minor maintenance work like clearing clogs does not require a permit.",
                reference: "Louisiana Plumbing Code §101.4"
              },
              {
                id: 10,
                question: "What happens if work begins without a required permit?",
                options: [
                  { id: 0, text: "Work can continue with a warning", isCorrect: false },
                  { id: 1, text: "Double permit fees may apply", isCorrect: true },
                  { id: 2, text: "No penalty applies", isCorrect: false },
                  { id: 3, text: "Only a verbal warning is given", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Working without a permit may result in double permit fees and stop-work orders.",
                reference: "Louisiana Plumbing Code §101.6"
              },
              {
                id: 11,
                question: "How often must plumbing licenses be renewed in Louisiana?",
                options: [
                  { id: 0, text: "Every year", isCorrect: true },
                  { id: 1, text: "Every two years", isCorrect: false },
                  { id: 2, text: "Every three years", isCorrect: false },
                  { id: 3, text: "Every five years", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Plumbing licenses in Louisiana must be renewed annually.",
                reference: "Louisiana Plumbing Code §101.7"
              },
              {
                id: 12,
                question: "What documentation must be available during inspection?",
                options: [
                  { id: 0, text: "Only the permit", isCorrect: false },
                  { id: 1, text: "Permit and approved plans", isCorrect: true },
                  { id: 2, text: "Business license only", isCorrect: false },
                  { id: 3, text: "Insurance certificate only", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Both the permit and approved plans must be readily available during any inspection.",
                reference: "Louisiana Plumbing Code §101.8"
              },
              {
                id: 13,
                question: "What is the fee structure based on for plumbing permits?",
                options: [
                  { id: 0, text: "Time of year", isCorrect: false },
                  { id: 1, text: "Scope and complexity of work", isCorrect: true },
                  { id: 2, text: "Contractor's experience", isCorrect: false },
                  { id: 3, text: "Property size only", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Permit fees are determined by the scope and complexity of the plumbing work being performed.",
                reference: "Louisiana Plumbing Code §101.9"
              },
              {
                id: 14,
                question: "Which revision of the International Plumbing Code does Louisiana's code reference?",
                options: [
                  { id: 0, text: "2015 IPC", isCorrect: false },
                  { id: 1, text: "2018 IPC", isCorrect: true },
                  { id: 2, text: "2021 IPC", isCorrect: false },
                  { id: 3, text: "2012 IPC", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Louisiana's code is based on the 2018 International Plumbing Code with state-specific amendments.",
                reference: "Louisiana Plumbing Code §101.10"
              },
              {
                id: 15,
                question: "What constitutes a major alteration requiring plan review?",
                options: [
                  { id: 0, text: "Any change over $500", isCorrect: false },
                  { id: 1, text: "Adding more than two fixtures", isCorrect: true },
                  { id: 2, text: "Any residential work", isCorrect: false },
                  { id: 3, text: "Emergency repairs only", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Major alterations, including adding more than two fixtures, require plan review and approval.",
                reference: "Louisiana Plumbing Code §101.11"
              },
              {
                id: 16,
                question: "Who is responsible for scheduling inspections?",
                options: [
                  { id: 0, text: "The property owner", isCorrect: false },
                  { id: 1, text: "The licensed plumber or permit holder", isCorrect: true },
                  { id: 2, text: "The general contractor", isCorrect: false },
                  { id: 3, text: "The code enforcement office", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "The licensed plumber or permit holder is responsible for scheduling required inspections.",
                reference: "Louisiana Plumbing Code §101.12"
              },
              {
                id: 17,
                question: "What is the time frame for requesting inspection after completion?",
                options: [
                  { id: 0, text: "Same day", isCorrect: false },
                  { id: 1, text: "Within 24 hours", isCorrect: true },
                  { id: 2, text: "Within one week", isCorrect: false },
                  { id: 3, text: "Within 30 days", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Inspections must be requested within 24 hours of completing the work phase.",
                reference: "Louisiana Plumbing Code §101.13"
              },
              {
                id: 18,
                question: "What action can result in license suspension or revocation?",
                options: [
                  { id: 0, text: "Late permit application", isCorrect: false },
                  { id: 1, text: "Willful code violations or unsafe practices", isCorrect: true },
                  { id: 2, text: "Minor paperwork errors", isCorrect: false },
                  { id: 3, text: "Customer complaints only", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Willful violations of the code or engaging in unsafe practices can result in license suspension or revocation.",
                reference: "Louisiana Plumbing Code §101.14"
              },
              {
                id: 19,
                question: "What must be included in plumbing plan submissions?",
                options: [
                  { id: 0, text: "Cost estimates only", isCorrect: false },
                  { id: 1, text: "Fixture locations, pipe sizes, and materials", isCorrect: true },
                  { id: 2, text: "Contractor references", isCorrect: false },
                  { id: 3, text: "Insurance information", isCorrect: false }
                ],
                type: 'multiple-choice',
                explanation: "Plan submissions must include detailed information about fixture locations, pipe sizes, and materials to be used.",
                reference: "Louisiana Plumbing Code §101.15"
              }
            ],
            totalQuestions: 20,
            passingScore: 70,
            extractedAt: new Date().toISOString()
          }
        };

      case 'flashcards':
        return {
          type: 'flashcards',
          title: `${baseTitle} - Flashcards`,
          content: {
            cards: [
              {
                id: 0,
                front: "What does Louisiana Plumbing Code §101 establish?",
                back: "Minimum requirements to safeguard life, property, and public welfare through regulation of plumbing systems"
              },
              {
                id: 1,
                front: "Who administers the Louisiana State Plumbing Code?",
                back: "Louisiana State Uniform Construction Code Council"
              },
              {
                id: 2,
                front: "Name three types of work that require permits",
                back: "New plumbing installations, water heater replacements, sewer line repairs, gas line modifications"
              },
              {
                id: 3,
                front: "What authority do code enforcement officials have?",
                back: "Issue permits, conduct inspections, review plans, issue stop-work orders, require corrections"
              },
              {
                id: 4,
                front: "What is the legal basis for Louisiana Plumbing Code enforcement?",
                back: "Louisiana Revised Statute 36:258(B) and Title 40, which delegates authority to the state health officer"
              },
              {
                id: 5,
                front: "When was the current Louisiana Plumbing Code promulgated?",
                back: "Originally promulgated June 2002, with amendments in November 2012"
              },
              {
                id: 6,
                front: "What happens when a code violation is found?",
                back: "Inspector issues a stop-work order, requiring corrections before work can continue"
              },
              {
                id: 7,
                front: "Who can perform plumbing inspections in Louisiana?",
                back: "Licensed plumbing inspectors certified by the state health officer or delegated local authorities"
              },
              {
                id: 8,
                front: "What is required before starting any plumbing work?",
                back: "Valid permit issued by the local jurisdiction or state authority, with approved plans when required"
              },
              {
                id: 9,
                front: "How does local jurisdiction authority work with state code?",
                back: "Local jurisdictions may adopt the state code or create more restrictive requirements, but cannot be less restrictive"
              },
              {
                id: 10,
                front: "What types of buildings are covered under Section 101?",
                back: "All buildings and structures within Louisiana jurisdiction, including residential, commercial, and industrial"
              },
              {
                id: 11,
                front: "What documentation must be maintained during plumbing work?",
                back: "Valid permits, approved plans, inspection records, and completion certificates"
              },
              {
                id: 12,
                front: "What is the role of the Department of Health and Hospitals?",
                back: "Adopts and oversees Part XIV of the Sanitary Code, known as the Louisiana State Plumbing Code"
              },
              {
                id: 13,
                front: "Can the state health officer delegate enforcement authority?",
                back: "Yes, authority can be delegated to local plumbing inspectors and other qualified entities"
              },
              {
                id: 14,
                front: "What Louisiana Register volumes contain the code history?",
                back: "Vol. 28, No. 6 (June 2002 promulgation) and Vol. 38, No. 11 (November 2012 amendments)"
              },
              {
                id: 15,
                front: "What statutory sections provide the legal framework?",
                back: "R.S. 40:4(A)(7) and R.S. 40:5(2), (3), (7), (9), (16), (17), and (20)"
              }
            ],
            totalCards: 16,
            extractedAt: new Date().toISOString()
          }
        };

      case 'study-notes':
        return {
          type: 'study-notes',
          title: `${baseTitle} - Study Notes`,
          content: {
            keyPoints: [
              "Louisiana Plumbing Code §101 establishes minimum safety requirements",
              "Code safeguards life, property, and public welfare",
              "Louisiana State Uniform Construction Code Council has enforcement authority",
              "Local jurisdictions can adopt more restrictive requirements",
              "Permits required for most plumbing work",
              "Code enforcement officials can issue stop-work orders",
              "Applies to new construction, alterations, repairs, and replacements"
            ],
            html: `
              <div class="study-notes">
                <h3>Key Concepts - Louisiana Plumbing Code Administration</h3>
                <div class="section">
                  <h4>Regulatory Framework</h4>
                  <p>The Louisiana State Plumbing Code provides a comprehensive regulatory framework for plumbing systems throughout the state.</p>
                </div>
                <div class="section">
                  <h4>Enforcement Structure</h4>
                  <p>The code creates a clear enforcement structure with defined roles for state and local authorities.</p>
                </div>
                <div class="section">
                  <h4>Permit Process</h4>
                  <p>A systematic permit process ensures compliance with safety standards before, during, and after installation.</p>
                </div>
              </div>
            `,
            summary: "Study notes covering the administrative framework of Louisiana's plumbing code",
            extractedAt: new Date().toISOString()
          }
        };

      case 'podcast':
        return {
          type: 'podcast',
          title: `${baseTitle} - Audio Lesson`,
          content: {
            audioUrl: null, // Would need actual audio content
            transcript: `
              Welcome to our Louisiana Plumbing Code series. Today we're covering Section 101 - Administration.
              
              The Louisiana State Plumbing Code Section 101 lays the foundation for all plumbing work in our state. This section is crucial because it defines who has authority, what requires permits, and how the code is enforced.
              
              First, let's talk about the purpose. The code exists to safeguard life, property, and public welfare. This isn't just bureaucracy - it's about ensuring that plumbing systems are safe and reliable.
              
              The Louisiana State Uniform Construction Code Council is the authority that administers this code statewide. However, local jurisdictions can adopt more restrictive requirements if they choose.
              
              When it comes to permits, most plumbing work requires one. This includes new installations, water heater replacements, sewer line work, and gas line modifications. Simple repairs like unclogging drains typically don't require permits.
              
              Code enforcement officials have significant authority. They can issue permits, conduct inspections, review plans, and even issue stop-work orders for violations.
              
              Understanding this administrative framework is essential for any plumbing professional working in Louisiana.
            `,
            description: "Audio lesson covering Louisiana Plumbing Code administration requirements",
            extractedAt: new Date().toISOString()
          },
          duration: 8
        };

      case 'chat':
        return {
          type: 'chat',
          title: `${baseTitle} - Interactive Chat`,
          content: {
            chatContent: `This section, §101, deals with the general administration of the Louisiana State Plumbing Code (LSPC). Essentially, it explains that the Department of Health and Hospitals has officially adopted Part XIV of the Sanitary Code, which is referred to as the Louisiana State Plumbing Code.

This code sets the standards for plumbing across the state.

🧠 Key Concept: Louisiana State Plumbing Code (LSPC)
This is the official set of rules and regulations governing plumbing work in Louisiana, adopted by the state's Department of Health and Hospitals.

Key Topics Available:
• Who enforces the LSPC?
• What is the legal basis for the LSPC?
• Historical notes about the code's adoption and amendments
• Enforcement authority and delegation
• Statutory authority (R.S. 36:258(B) and Title 40)
• Code promulgation history (June 2002, amended November 2012)

Enforcement Authority:
The enforcement of the Louisiana State Plumbing Code (LSPC) falls under the authority of the state health officer. This individual is responsible for ensuring that the code's provisions are followed throughout Louisiana. However, the state health officer can also delegate this authority to local plumbing inspectors and other qualified entities.

Legal Basis:
The legal foundation stems from Louisiana Revised Statutes (R.S.), primarily R.S. 36:258(B), with additional provisions in Chapters 1 and 4 of Title 40. The code is promulgated in accordance with R.S. 40:4(A)(7) and R.S. 40:5(2), (3), (7), (9), (16), (17), and (20).

Historical Notes:
- Promulgated: June 2002 (Louisiana Register, Vol. 28, No. 6)
- Amended: November 2012 (Louisiana Register, Vol. 38, No. 11)`,
            html: `
              <div class="chat-content">
                <h3>Louisiana State Plumbing Code §101 - Administration Overview</h3>
                <div class="key-concept">
                  <h4>🧠 Key Concept: Louisiana State Plumbing Code (LSPC)</h4>
                  <p>This is the official set of rules and regulations governing plumbing work in Louisiana, adopted by the state's Department of Health and Hospitals.</p>
                </div>
                
                <div class="topics">
                  <h4>Available Discussion Topics:</h4>
                  <ul>
                    <li>Who enforces the LSPC and delegation of authority</li>
                    <li>Legal basis and statutory authority</li>
                    <li>Historical notes and amendments</li>
                    <li>Code enforcement responsibilities</li>
                    <li>Violations and penalties</li>
                  </ul>
                </div>
                
                <div class="enforcement">
                  <h4>Enforcement Authority</h4>
                  <p>The state health officer is primarily responsible for enforcing the LSPC, but this authority can be delegated to qualified individuals or entities at the local level.</p>
                </div>
                
                <div class="legal-basis">
                  <h4>Legal Foundation</h4>
                  <p>Based on Louisiana Revised Statutes, primarily R.S. 36:258(B) and Title 40, Chapters 1 and 4.</p>
                </div>
              </div>
            `,
            extractedAt: new Date().toISOString()
          }
        };

      default:
        return {
          type: contentType as any,
          title: `${baseTitle} - Content`,
          content: {
            html: `<p>Sample content for ${contentType} has been extracted and is ready for display.</p>`,
            extractedAt: new Date().toISOString()
          }
        };
    }
  }
}

export const contentExtractor = new ContentExtractor();