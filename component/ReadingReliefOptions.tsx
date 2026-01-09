import React, { useState } from 'react';
import { X, Loader2, Volume2, BookOpen, Lightbulb } from 'lucide-react';

interface ReadingReliefOptionsProps {
  onClose: () => void;
  studentEmotionalState: string;
  studentLanguage?: string;
}

const ReadingReliefOptions: React.FC<ReadingReliefOptionsProps> = ({ 
  onClose, 
  studentEmotionalState,
  studentLanguage = 'English'
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');

  // Generate relief content based on student's language and emotional state
  const generateReliefContent = async (option: string) => {
    setLoading(true);
    setSelectedOption(option);

    // Simulate API call - in real scenario, call gemini API
    await new Promise(resolve => setTimeout(resolve, 1500));

    let reliefContent = '';

    if (option === 'quiz') {
      reliefContent = `🎯 **Quick Break Quiz** - Mind Refresher
      
This is a light, engaging quiz to refresh your mind:

**Question 1:** What is your favorite programming language and why?
*Time limit: 2 minutes*

**Question 2:** Can you name 3 things you learned in the last hour?
*Let's see what stuck!*

**Question 3:** What's one real-world use case for what you just read?
*Connect theory to practice*

Remember: This is just a fun brain break! No pressure. These questions help consolidate learning.`;
    } else if (option === 'riddles') {
      const riddles = [
        {
          riddle: 'I have keys but no lock. I have space but no room. You can enter but cannot go outside. What am I?',
          answer: 'A Keyboard!'
        },
        {
          riddle: 'The more you take, the more you leave behind. What am I?',
          answer: 'Footsteps!'
        },
        {
          riddle: 'What has a head and a tail but no body?',
          answer: 'A Coin!'
        }
      ];

      const riddleContent = riddles.map((r, i) => `
**Riddle ${i + 1}:** ${r.riddle}
*Hint: Think about everyday objects*
<details>
<summary>Click to see answer</summary>
**Answer:** ${r.answer}
</details>
`).join('\n');

      reliefContent = `🧩 **Brain Teasers & Riddles** - Mind Relaxation
      
Take a break with some fun riddles! Try to solve them before looking at answers.
${riddleContent}`;
    } else if (option === 'game') {
      reliefContent = `🎮 **Interactive Learning Game** - Concept Recall

**Game: Concept Connect**
- You'll be shown key concepts from what you just read
- Match them with their definitions
- Complete 5 matches to earn a "Learning Star"

**How to play:**
1. Concepts will appear on the left
2. Definitions will appear on the right (shuffled)
3. Click to connect matching pairs
4. You have 3 minutes per round

**Current Challenge:**
Starting with ${studentLanguage} language support...`;
    } else if (option === 'stretch') {
      reliefContent = `💪 **Mind & Body Refresh** - 5 Minute Break

**Recommended Activities:**

1. **Eye Relief (2 minutes):**
   - Look away from screen at distant object (20 seconds)
   - Close eyes and rest (30 seconds)
   - Roll eyes gently 10 times each direction
   
2. **Neck & Shoulder Stretch (2 minutes):**
   - Rotate neck slowly 10 times
   - Shoulder rolls forward and backward
   - Gentle neck stretches to each side

3. **Hand Exercises (1 minute):**
   - Flex and extend fingers
   - Rotate wrists gently
   - Make fists and release

**Pro Tip:** Do this every 30-45 minutes of reading to boost focus!`;
    } else if (option === 'continue') {
      reliefContent = `✅ **Ready to Continue?**

You're doing great! Here are some tips to maintain your momentum:

1. **Change Reading Position** - Stand up or change seating
2. **Adjust Lighting** - Ensure proper brightness
3. **Take Notes** - Write key points to stay engaged
4. **Set a Goal** - "Read next 10 minutes then take break"
5. **Stay Hydrated** - Drink some water to refresh

**You've got this!** 💪 Remember:
- Learning is a marathon, not a sprint
- Taking breaks is productive, not lazy
- Your effort is building knowledge

**Let's continue!**`;
    }

    setContent(reliefContent);
    setLoading(false);
  };

  const reliefOptions = [
    {
      id: 'continue',
      title: 'Continue Reading',
      description: 'I can push through and keep reading',
      icon: BookOpen,
      color: 'bg-blue-100 border-blue-300'
    },
    {
      id: 'game',
      title: 'Play AI Quiz Game',
      description: 'Take a fun 5-minute quiz break',
      icon: Lightbulb,
      color: 'bg-purple-100 border-purple-300'
    },
    {
      id: 'riddles',
      title: 'Mind Teasers (Mother Tongue)',
      description: `Fun riddles & puzzles in ${studentLanguage}`,
      icon: Volume2,
      color: 'bg-green-100 border-green-300'
    },
    {
      id: 'stretch',
      title: 'Take a Physical Break',
      description: 'Stretching & eye exercises (5 min)',
      icon: '🏃',
      color: 'bg-orange-100 border-orange-300'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-pink-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Mind Refresh Time! 🌟</h2>
            <p className="text-indigo-100 mt-2">
              We noticed you might need a break. Let's refresh your mind!
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedOption ? (
            <>
              <p className="text-slate-600 mb-6 text-center">
                📊 <strong>Emotional State Detected:</strong> {studentEmotionalState}
                <br />
                <span className="text-sm">Your facial expressions suggest you might benefit from a mental break</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reliefOptions.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => generateReliefContent(option.id)}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${option.color}`}
                    >
                      <div className="flex items-start gap-3">
                        {typeof option.icon === 'string' ? (
                          <span className="text-2xl">{option.icon}</span>
                        ) : (
                          <IconComponent className="h-6 w-6 text-indigo-600" />
                        )}
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-800">{option.title}</h3>
                          <p className="text-sm text-slate-600">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  💡 <strong>Tip:</strong> Taking breaks actually improves learning retention! Your brain needs rest to consolidate information.
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedOption(null)}
                className="mb-4 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                ← Back to Options
              </button>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600">Preparing your content...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="bg-indigo-50 p-6 rounded-lg whitespace-pre-wrap text-slate-700 font-family-mono">
                    {content}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setSelectedOption(null)}
                      className="flex-1 bg-slate-200 text-slate-800 py-2 px-4 rounded-lg hover:bg-slate-300 transition-all"
                    >
                      Try Another Option
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      Ready to Continue Reading
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingReliefOptions;
