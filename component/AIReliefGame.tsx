import React, { useState, useEffect } from 'react';
import { X, Volume2 } from 'lucide-react';

interface AIReliefGameProps {
  studentLanguage?: string;
  currentEmotion?: string;
  onResume: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  fun: boolean;
}

interface Riddle {
  question: string;
  answer: string;
  language: 'English' | 'Tamil';
}

const AIReliefGame: React.FC<AIReliefGameProps> = ({
  studentLanguage = 'English',
  currentEmotion = 'neutral',
  onResume
}) => {
  const [gameType, setGameType] = useState<'menu' | 'quiz' | 'riddle' | 'memory' | 'reaction'>('menu');
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);

  // Fun trivia questions to lighten mood
  const funQuestions: QuizQuestion[] = [
    {
      question: 'What do you call a bear with no teeth?',
      options: ['A gummy bear', 'A soft bear', 'A smooth bear', 'A baby bear'],
      answer: 0,
      fun: true
    },
    {
      question: 'Why did the scarecrow win an award?',
      options: ['He was outstanding in his field', 'He was made of straw', 'He scared birds', 'He was tall'],
      answer: 0,
      fun: true
    },
    {
      question: 'What time is it when an elephant sits on your fence?',
      options: ['Time to get a new fence', 'Lunch time', 'Play time', 'Question time'],
      answer: 0,
      fun: true
    },
    {
      question: 'How do you know if there\'s an elephant in your refrigerator?',
      options: ['Footprints in the butter', 'Door is open', 'Light is on', 'Food is gone'],
      answer: 0,
      fun: true
    },
    {
      question: 'Why did the coffee file a police report?',
      options: ['It got mugged!', 'It was too hot', 'It spilled', 'It was cold'],
      answer: 0,
      fun: true
    }
  ];

  // Tamil and English riddles
  const riddles: Riddle[] = [
    {
      question: 'English: I have cities but no houses. What am I?',
      answer: 'A map',
      language: 'English'
    },
    {
      question: 'English: I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?',
      answer: 'An echo',
      language: 'English'
    },
    {
      question: 'Tamil: என்னிடம் நகரங்கள் உள்ளன ஆனால் வீடுகள் இல்லை. நான் யாரு?',
      answer: 'ஒரு வரைபடம்',
      language: 'Tamil'
    },
    {
      question: 'English: What has a head and a tail but no body?',
      answer: 'A coin',
      language: 'English'
    },
    {
      question: 'English: What can travel around the world while staying in a corner?',
      answer: 'A stamp',
      language: 'English'
    }
  ];

  const memorizeSequence = ['🎨', '🎯', '🎭', '🎪', '🎸', '🎲'];
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);

  // Timer for games
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameActive]);

  // Start game functions
  const startQuizGame = () => {
    setGameType('quiz');
    setScore(0);
    setQuestionIndex(0);
    setGameActive(true);
  };

  const startRiddleGame = () => {
    setGameType('riddle');
    setScore(0);
    setQuestionIndex(0);
    setGameActive(true);
  };

  const startMemoryGame = () => {
    setGameType('memory');
    setScore(0);
    setSequence(['🎨']);
    setPlayerSequence([]);
    setTimeLeft(60);
    setGameActive(true);
  };

  const startReactionGame = () => {
    setGameType('reaction');
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
  };

  // Quiz handlers
  const handleQuizAnswer = (selectedIndex: number) => {
    if (selectedIndex === funQuestions[questionIndex].answer) {
      setScore(score + 10);
    } else {
      setScore(Math.max(0, score - 5));
    }

    if (questionIndex < funQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setGameActive(false);
    }
  };

  // Riddle handlers
  const handleRiddleSubmit = (answer: string) => {
    if (answer.toLowerCase().trim() === riddles[questionIndex].answer.toLowerCase().trim()) {
      setScore(score + 15);
    }

    if (questionIndex < riddles.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setGameActive(false);
    }
  };

  // Memory game handlers
  const handleMemoryClick = (emoji: string) => {
    const newPlayerSequence = [...playerSequence, emoji];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setGameActive(false);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setScore(score + 5);
      setSequence([...sequence, memorizeSequence[Math.floor(Math.random() * memorizeSequence.length)]]);
      setPlayerSequence([]);
    }
  };

  // Text to speech for riddles
  const speakRiddle = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = studentLanguage === 'Tamil' ? 'ta-IN' : 'en-IN';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onResume}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            🎮 Brain Break Time!
          </h1>
          <p className="text-gray-600">
            {currentEmotion === 'sad' && "😊 Feeling down? Let's brighten your mood!"}
            {currentEmotion === 'angry' && "😌 Let's cool down with some fun!"}
            {currentEmotion === 'neutral' && "✨ Take a quick mental break!"}
            {!['sad', 'angry', 'neutral'].includes(currentEmotion) && "🎉 Let's have some fun!"}
          </p>
        </div>

        {gameType === 'menu' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Quiz Game */}
            <button
              onClick={startQuizGame}
              className="p-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-bold text-lg mb-1">Fun Quiz</h3>
              <p className="text-sm opacity-90">Laugh at funny questions</p>
            </button>

            {/* Riddle Game */}
            <button
              onClick={startRiddleGame}
              className="p-6 bg-gradient-to-br from-green-400 to-green-600 rounded-xl text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">🧩</div>
              <h3 className="font-bold text-lg mb-1">Mind Teasers</h3>
              <p className="text-sm opacity-90">Solve clever riddles</p>
            </button>

            {/* Memory Game */}
            <button
              onClick={startMemoryGame}
              className="p-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">🧠</div>
              <h3 className="font-bold text-lg mb-1">Memory Game</h3>
              <p className="text-sm opacity-90">Remember the sequence</p>
            </button>

            {/* Reaction Game */}
            <button
              onClick={startReactionGame}
              className="p-6 bg-gradient-to-br from-red-400 to-red-600 rounded-xl text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-bold text-lg mb-1">Reaction Test</h3>
              <p className="text-sm opacity-90">Test your reflexes</p>
            </button>

            {/* Back Button */}
            <button
              onClick={onResume}
              className="col-span-2 p-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Continue Reading
            </button>
          </div>
        )}

        {gameType === 'quiz' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-700">Score: {score}</span>
              <span className="text-sm text-gray-600">
                Question {questionIndex + 1} of {funQuestions.length}
              </span>
            </div>

            {gameActive && (
              <>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-semibold text-gray-800 text-center">
                    {funQuestions[questionIndex].question}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {funQuestions[questionIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      className="p-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!gameActive && (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</p>
                <p className="text-xl text-gray-600 mb-6">Final Score: {score} points</p>
                <button
                  onClick={onResume}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Back to Reading
                </button>
              </div>
            )}
          </div>
        )}

        {gameType === 'riddle' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-700">Score: {score}</span>
              <span className="text-sm text-gray-600">
                Riddle {questionIndex + 1} of {riddles.length}
              </span>
            </div>

            {gameActive && (
              <>
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-semibold text-gray-800">
                      {riddles[questionIndex].question}
                    </p>
                    <button
                      onClick={() => speakRiddle(riddles[questionIndex].question)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Type your answer..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRiddleSubmit((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full p-3 border-2 border-green-300 rounded-lg mb-3 text-gray-800"
                />

                <button
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    handleRiddleSubmit(input?.value || '');
                    if (input) input.value = '';
                  }}
                  className="w-full p-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all"
                >
                  Submit Answer
                </button>
              </>
            )}

            {!gameActive && (
              <div className="text-center">
                <div className="text-6xl mb-4">🧩</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">Riddles Complete!</p>
                <p className="text-xl text-gray-600 mb-6">Final Score: {score} points</p>
                <button
                  onClick={onResume}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Back to Reading
                </button>
              </div>
            )}
          </div>
        )}

        {gameType === 'memory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-gray-700">Score: {score}</span>
              <span className="text-lg font-bold text-purple-600">Level: {sequence.length}</span>
            </div>

            {gameActive && (
              <>
                <p className="text-center text-gray-600 mb-4 font-semibold">
                  Remember the order: {sequence.join(' ')}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {memorizeSequence.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleMemoryClick(emoji)}
                      className="p-6 text-3xl bg-purple-200 rounded-lg hover:bg-purple-300 transition-all font-bold"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm text-gray-600">
                  You've selected: {playerSequence.join(' ')}
                </p>
              </>
            )}

            {!gameActive && (
              <div className="text-center">
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">Game Over!</p>
                <p className="text-xl text-gray-600 mb-2">Levels Reached: {sequence.length}</p>
                <p className="text-lg text-gray-600 mb-6">Final Score: {score} points</p>
                <button
                  onClick={onResume}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Back to Reading
                </button>
              </div>
            )}
          </div>
        )}

        {gameType === 'reaction' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-gray-700">Score: {score}</span>
              <span className="text-xl font-bold text-red-600">Time: {timeLeft}s</span>
            </div>

            {gameActive ? (
              <div className="text-center">
                <p className="text-gray-600 mb-6 font-semibold">Click the buttons as fast as you can!</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'].map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setScore(score + 1)}
                      className={`p-8 rounded-lg text-white font-bold text-xl hover:scale-110 transition-all ${
                        color === 'Red'
                          ? 'bg-red-500 hover:bg-red-600'
                          : color === 'Blue'
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : color === 'Yellow'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-800'
                          : color === 'Green'
                          ? 'bg-green-500 hover:bg-green-600'
                          : color === 'Purple'
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <p className="text-2xl font-bold text-gray-800 mb-4">Time's Up!</p>
                <p className="text-2xl text-red-600 font-bold mb-6">
                  You clicked {score} times in 30 seconds!
                </p>
                <button
                  onClick={onResume}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Back to Reading
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReliefGame;
