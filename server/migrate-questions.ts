// Migration script to move quiz file questions to unified competition_questions table
import { storage } from './storage';

async function migrateQuizQuestions() {
  console.log('🔄 Starting question migration...');
  
  try {
    // Get all quiz content for the course
    const courseId = '5f02238b-afb2-4e7f-a488-96fb471fee56';
    const allContent = await storage.getCourseContent(courseId);
    const quizContent = allContent.filter(content => content.type === 'quiz');
    
    let totalMigrated = 0;
    
    for (const quiz of quizContent) {
      console.log(`📝 Processing quiz: ${quiz.title}`);
      
      try {
        const contentObj = typeof quiz.content === 'string' ? JSON.parse(quiz.content) : quiz.content;
        const extractedContent = contentObj?.extracted?.content || '';
        
        // Determine section from title
        let section = '';
        let difficulty = 'medium'; // Default difficulty for existing questions
        
        if (quiz.title.includes('101')) {
          section = 'Chapter 1 - Section 101';
          // Skip 101 questions - they're already migrated
          console.log(`⏭️  Skipping ${quiz.title} - already migrated`);
          continue;
        } else if (quiz.title.includes('103')) {
          section = 'Chapter 1 - Section 103 Availability';
        } else if (quiz.title.includes('105')) {
          section = 'Chapter 1 - Section 105';
        }
        
        if (!section) {
          console.log(`❌ Could not determine section for: ${quiz.title}`);
          continue;
        }
        
        // Extract questions using regex pattern for this specific format
        const questionPattern = /\*\*(\d+)\.\s*(.*?)\?\*\*\n([\s\S]*?)(?=\*\*\d+\.|---|\n\n##|$)/g;
        let match;
        let questionCount = 0;
        
        while ((match = questionPattern.exec(extractedContent)) !== null) {
          const questionNumber = parseInt(match[1]);
          const questionText = match[2].trim();
          const answerBlock = match[3].trim();
          
          // Extract options
          const optionMatches = answerBlock.match(/[A-D]\.\s*(.*?)(?=\n[A-D]\.|✓|$)/g);
          if (!optionMatches || optionMatches.length < 4) {
            console.log(`⚠️  Skipping malformed question ${questionNumber}: insufficient options`);
            continue;
          }
          
          const options = optionMatches.map(opt => {
            const cleanOpt = opt.replace(/^[A-D]\.\s*/, '').replace(/\s*✓\s*$/, '').trim();
            return cleanOpt;
          });
          
          // Find correct answer (marked with ✓)
          let correctAnswer = -1;
          for (let i = 0; i < optionMatches.length; i++) {
            if (optionMatches[i].includes('✓')) {
              correctAnswer = i;
              break;
            }
          }
          
          if (correctAnswer === -1) {
            console.log(`⚠️  Skipping question ${questionNumber}: no correct answer marked`);
            continue;
          }
          
          // Check if question already exists in competition_questions
          const existingQuestions = await storage.getQuestionsByCourse('');
          const questionExists = existingQuestions.some(q => 
            q.question.toLowerCase().trim() === questionText.toLowerCase().trim()
          );
          
          if (questionExists) {
            console.log(`⏭️  Question ${questionNumber} already exists, skipping`);
            continue;
          }
          
          // Create the question
          const questionData = {
            questionText: questionText,
            options: options,
            correctAnswer: correctAnswer,
            explanation: `Answer explanation for ${section} question ${questionNumber}`,
            difficulty: difficulty,
            category: 'Chapter 1',
            codeReference: section,
            pointValue: 1
          };
          
          await storage.createQuestion(questionData);
          questionCount++;
          totalMigrated++;
          
          console.log(`✅ Migrated question ${questionNumber}: ${questionText.substring(0, 50)}...`);
        }
        
        console.log(`📊 Migrated ${questionCount} questions from ${quiz.title}`);
        
      } catch (error) {
        console.error(`❌ Error processing quiz ${quiz.title}:`, error);
      }
    }
    
    console.log(`🎉 Migration complete! Total questions migrated: ${totalMigrated}`);
    
    // Show final counts
    const finalQuestions = await storage.getQuestionsByCourse('');
    console.log(`📈 Total questions in unified system: ${finalQuestions.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if called directly
migrateQuizQuestions().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});

export { migrateQuizQuestions };