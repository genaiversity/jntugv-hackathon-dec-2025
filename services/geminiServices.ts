
import { GoogleGenAI, Type } from "@google/genai";

// Prefer Vite env, fall back to user-provided key in localStorage (runtime)
const envKey = (import.meta as any).env?.VITE_API_KEY || '';
let apiKey = envKey;
if (!apiKey && typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('VITE_API_KEY') || '';
    if (stored) apiKey = stored;
  } catch (e) {
    // ignore
  }
}

if (!apiKey) {
  console.warn('VITE_API_KEY is not set (env or localStorage). AI features will fallback to local heuristics.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const modelFlash = 'gemini-2.5-flash';

// Mock data for Skill Gap Analysis (fast fallback)
const getMockSkillGap = (targetRole: string): any => {
  const roleLower = targetRole.toLowerCase();
  
  // Different mock data based on role
  let missingSkills: any[] = [];
  let matchScore = 65;
  let roleFit = `Your resume shows good foundational skills for ${targetRole}, but there are some key areas to strengthen.`;
  
  if (roleLower.includes('backend') || roleLower.includes('full stack')) {
    missingSkills = [
      { skill: 'Microservices Architecture', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=microservices' },
      { skill: 'Docker & Kubernetes', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=docker%20kubernetes' },
      { skill: 'System Design Patterns', platform: 'NPTEL', courseLink: 'https://nptel.ac.in/courses/search?query=system%20design' },
      { skill: 'RESTful API Design', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=rest%20api' }
    ];
    matchScore = 68;
    roleFit = `Strong backend fundamentals detected. Focus on distributed systems and cloud deployment to excel as a ${targetRole}.`;
  } else if (roleLower.includes('frontend')) {
    missingSkills = [
      { skill: 'React Advanced Patterns', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=react%20advanced' },
      { skill: 'TypeScript Mastery', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=typescript' },
      { skill: 'Performance Optimization', platform: 'NPTEL', courseLink: 'https://nptel.ac.in/courses/search?query=web%20performance' },
      { skill: 'State Management (Redux/Zustand)', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=redux' }
    ];
    matchScore = 72;
    roleFit = `Good frontend skills present. Enhance your React ecosystem knowledge and performance optimization techniques.`;
  } else if (roleLower.includes('data') || roleLower.includes('machine learning')) {
    missingSkills = [
      { skill: 'Deep Learning Frameworks', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=deep%20learning' },
      { skill: 'Big Data Processing (Spark)', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=apache%20spark' },
      { skill: 'ML Model Deployment', platform: 'NPTEL', courseLink: 'https://nptel.ac.in/courses/search?query=machine%20learning' },
      { skill: 'Statistical Analysis', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=statistics' }
    ];
    matchScore = 60;
    roleFit = `Solid data science foundation. Strengthen ML model deployment and big data processing skills for production readiness.`;
  } else {
    missingSkills = [
      { skill: 'Cloud Computing (AWS/GCP)', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=aws' },
      { skill: 'CI/CD Pipelines', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=ci%20cd' },
      { skill: 'Infrastructure as Code', platform: 'NPTEL', courseLink: 'https://nptel.ac.in/courses/search?query=devops' },
      { skill: 'Monitoring & Logging', platform: 'Coursera', courseLink: 'https://www.coursera.org/search?query=monitoring' }
    ];
    matchScore = 65;
    roleFit = `Good technical background. Focus on cloud platforms and automation tools to excel in ${targetRole} role.`;
  }
  
  return { missingSkills, matchScore, roleFit };
};

// Mock company fit analysis used when API unavailable
const getMockAnalysis = (company: string, role: string): any => {
  const roleLower = role.toLowerCase();
  let matchScore = 70;
  let culturalFit = `Your profile shows a solid foundation for ${role} at ${company}. Highlight projects and measurable impact to improve fit.`;
  let technicalGaps = [
    'Domain-specific hands-on projects',
    'System design exposure',
    'Unit testing & CI/CD familiarity'
  ];

  if (roleLower.includes('frontend')) {
    matchScore = 75;
    culturalFit = `Strong frontend fundamentals detected. Emphasize component design, performance, and accessibility for ${company}.`;
    technicalGaps = ['Advanced React patterns', 'TypeScript typing', 'Performance optimization'];
  } else if (roleLower.includes('backend')) {
    matchScore = 68;
    culturalFit = `Backend skills present. Focus on scalable architectures and observability to align with ${company}.`;
    technicalGaps = ['Microservices', 'Database indexing', 'Distributed tracing'];
  } else if (roleLower.includes('data') || roleLower.includes('machine')) {
    matchScore = 62;
    culturalFit = `Good analytical background. Strengthen production ML deployment and feature engineering for ${company}.`;
    technicalGaps = ['Model deployment', 'Feature stores', 'Spark/BigQuery'];
  }

  const accelerationPlan = [
    { week: 'WEEK 1', focus: 'Core fundamentals', tasks: ['Revise core concepts', 'Complete 2 small exercises'] },
    { week: 'WEEK 2', focus: 'Hands-on project', tasks: ['Build a mini project', 'Write tests and README'] },
    { week: 'WEEK 3', focus: 'Interview prep', tasks: ['Solve 10 algorithm problems', 'Mock interviews'] },
    { week: 'WEEK 4', focus: 'Polish and apply', tasks: ['Tailor resume', 'Apply to 5 roles'] }
  ];

  return { matchScore, culturalFit, technicalGaps, accelerationPlan };
};

export const analyzeCompanyFit = async (
    resumeInput: { content: string, mimeType?: string }, 
    company: string, 
    role: string,
    additionalSkills: string = ''
): Promise<any> => {
  try {
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      console.warn('API key not configured. Using local heuristic analysis.');
      // fallback to mock analysis when no API available
      return getMockAnalysis(company, role);
    }

    const systemPrompt = `
      Act as a hiring manager at ${company}. Analyze resume for ${role} position.
      Consider ${company}'s culture and values.
      User additional skills/notes: ${additionalSkills || 'None provided'}.
      
      Return JSON with:
      - matchScore (0-100): Overall readiness score
      - culturalFit (String): Detailed assessment of cultural alignment with ${company}, formatted as paragraphs or bullet points
      - technicalGaps (Array of strings): List of missing critical skills needed for ${role} at ${company}
      - accelerationPlan (Array of 4 objects): Weekly plan with:
        - week: "WEEK 1", "WEEK 2", etc.
        - focus: Main focus area for that week (e.g., "SQL & Data Warehousing")
        - tasks: Array of specific actionable tasks for that week
    `;

    const contents: any[] = [{ text: systemPrompt }];

    if (resumeInput.mimeType === 'application/pdf') {
        contents.push({
            inlineData: {
                mimeType: resumeInput.mimeType,
                data: resumeInput.content
            }
        });
    } else {
        contents.push({ text: `Resume Content:\n${resumeInput.content}` });
    }

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            culturalFit: { type: Type.STRING },
            technicalGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            accelerationPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    
    // Validate response structure
    if (!result.matchScore && result.matchScore !== 0) {
      throw new Error('Invalid response from API: missing matchScore');
    }
    
    return result;
  } catch (error: any) {
    console.error("Company Fit Error", error);
    // If API key is invalid or error occurs, return mock data instead of throwing
    if (error.message?.includes('API key') || error.message?.includes('INVALID_ARGUMENT')) {
      console.warn('API key issue detected. Using mock data for demonstration.');
      return getMockAnalysis(company, role);
    }
    throw new Error(error.message || 'Failed to analyze company fit. Using demo data.');
  }
}

// Skill gap analysis: export function expected by component/SkillGap.tsx
export const analyzeSkillGap = async (
  resumeInput: { content: string, mimeType?: string },
  targetRole: string
): Promise<any> => {
  try {
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      console.warn('API key not configured. Using mock skill gap analysis.');
      return getMockSkillGap(targetRole);
    }

    const systemPrompt = `Act as an expert recruiter. Analyze the resume for the role: ${targetRole}. Return JSON with keys: matchScore (0-100), missingSkills (array of {skill, platform, courseLink}), roleFit (string).`;

    const contents: any[] = [{ text: systemPrompt }];
    if (resumeInput.mimeType === 'application/pdf') {
      contents.push({ inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.content } });
    } else {
      contents.push({ text: `Resume Content:\n${resumeInput.content}` });
    }

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents,
      config: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.text || '{}');
    if (!result.matchScore && result.matchScore !== 0) {
      return getMockSkillGap(targetRole);
    }
    return result;
  } catch (error) {
    console.error('Skill gap analysis error', error);
    return getMockSkillGap(targetRole);
  }
};

// 2. Project Generator (moved to section 5 below with enhanced implementation)

// Mock responses for common questions
const getMockMentorResponse = (message: string, language: string): string => {
  const lowerMessage = message.toLowerCase();
  const langLower = language.toLowerCase();
  const isTamil = langLower === 'tamil';
  const isTelugu = langLower === 'telugu';
  
  // Pandas in Data Science
  if (lowerMessage.includes('pandas') && (lowerMessage.includes('data science') || lowerMessage.includes('data'))) {
    if (isTamil) {
      return `**பாண்டாஸ் (Pandas)** என்பது பைத்தானில் தரவு பகுப்பாய்வுக்கான சக்திவாய்ந்த நூலகம்.\n\n• **முக்கிய பயன்கள்**: CSV, Excel, JSON போன்ற கோப்புகளைப் படித்தல் மற்றும் எழுதுதல்\n+• **தரவு கையாளுதல்**: வரிசைகள் மற்றும் நெடுவரிசைகளை எளிதாக மாற்றுதல்\n+• **தரவு சுத்திகரிப்பு**: விடுபட்ட மதிப்புகள், நகல்களை நீக்குதல்\n+• **எடுத்துக்காட்டு**: \`df = pd.read_csv('data.csv')\` - CSV கோப்பைப் படிக்க\n\nபாண்டாஸ் தரவு விஞ்ஞானிகளுக்கு மிகவும் பயனப்பட்டுள்ளது!`;
    }
    if (isTelugu) {
      return `**Pandas** ఒక శక్తివంతమైన Python లైబ్రరీ, ఇది డేటా విశ్లేషణ కోసం ఉపయోగిస్తారు.\n\n• **ప్రధాన ఉపయోగాలు**: CSV, Excel, JSON ఫైల్స్‌ను చదవడం/రాయడం\n+• **డేటా మానిప్యులేషన్**: సులభంగా ఫిల్టర్ చేయడం, గ్రూప్ చేయడం, ట్రాన్స్‌ఫార్మ్ చేయడం\n+• **డేటా శుభ్రపరచడం**: మిస్సింగ్ విలువలు, డూప్లికేట్లు నిర్వహించడం\n+• **ఉదాహరణ**: \`df = pd.read_csv('data.csv')\` - CSV ఫైల్ చదవడానికి\n\nPandas డేటా సైన్స్‌లో చాలా ముఖ్యం!`;
    }
    return `**Pandas** is a powerful Python library for data analysis.\n\n• **Key Uses**: Reading/writing CSV, Excel, JSON files\n+• **Data Manipulation**: Easy filtering, grouping, and transforming data\n+• **Data Cleaning**: Handle missing values, duplicates\n+• **Example**: \`df = pd.read_csv('data.csv')\` - reads CSV file\n\nPandas is essential for data scientists!`;
  }
  
  // Data Science topics
  if (lowerMessage.includes('data science') || lowerMessage.includes('machine learning') || lowerMessage.includes('ml')) {
    if (isTamil) {
      return `**தரவு அறிவியல்** பற்றி:\n\n• **அடிப்படைகள்**: புள்ளியியல், நிகழ்தகவு, நேரியல் இயற்கணிதம்\n+• **கருவிகள்**: Python, Pandas, NumPy, Scikit-learn\n+• **படிப்படியாக**: தரவு சேகரிப்பு → சுத்திகரிப்பு → பகுப்பாய்வு → மாதிரி உருவாக்கம்\n+• **திட்டங்கள்**: Kaggle போட்டிகளில் பங்கேற்கவும்`;
    }
    if (isTelugu) {
      return `**డేటా సైన్స్** గురించి:\n\n• **ప్రాథమికాలు**: గణాశాస్త్రం, సంభావ్యత (probability), లీనియర్ ఆల్జీబ్రా\n+• **సాధనాలు**: Python, Pandas, NumPy, Scikit-learn\n+• **ప్రక్రియ**: డేటా సేకరణ → శుభ్రపరచటం → విశ్లేషణ → మోడల్ తయారీ\n+• **అభ్యాసం**: Kaggle పోటీల్లో పాల్గొనండి`;
    }
    return `**Data Science** involves:\n\n• **Fundamentals**: Statistics, probability, linear algebra\n+• **Tools**: Python, Pandas, NumPy, Scikit-learn\n+• **Process**: Data collection → Cleaning → Analysis → Modeling\n+• **Practice**: Join Kaggle competitions`;
  }
  
  // Programming languages
  if (lowerMessage.includes('java') && !lowerMessage.includes('javascript')) {
    if (isTamil) {
      return `**Java** பற்றி:\n\n• **அடிப்படைகள்**: OOP, Classes, Objects, Inheritance\n• **பயிற்சி**: HackerRank, LeetCode இல் சிக்கல்களைத் தீர்க்கவும்\n• **திட்டங்கள்**: Console apps, GUI applications\n• **முக்கியம்**: Memory management, Collections framework`;
    }
    if (isTelugu) {
      return `**Java** గురించి:\n\n• **ప్రాథమికాలు**: OOP, Classes, Objects, Inheritance\n+• **అభ్యాసం**: HackerRank, LeetCodeలో ప్రాబ్లెమ్స్ సాల్వ్ చేయండి\n+• **ప్రాజెక్టులు**: Console apps, GUI apps నిర్మించడం\n+• **ముఖ్యమైనది**: Memory management, Collections framework`;
    }
    return `**Java** programming:\n\n• **Basics**: OOP, Classes, Objects, Inheritance\n• **Practice**: Solve problems on HackerRank, LeetCode\n• **Projects**: Build console apps, GUI applications\n• **Important**: Memory management, Collections framework`;
  }
  
  if (lowerMessage.includes('python')) {
    if (isTamil) {
      return `**Python** பற்றி:\n\n• **அடிப்படைகள்**: Syntax, Data types, Functions, Loops\n• **நூலகங்கள்**: Pandas, NumPy, Matplotlib, Django\n• **பயிற்சி**: CodeWars, Project Euler\n• **திட்டங்கள்**: Web apps, Data analysis, Automation scripts`;
    }
    if (isTelugu) {
      return `**Python** గురించి:\n\n• **ప్రాథమికాలు**: Syntax, Data types, Functions, Loops\n+• **లైబ్రరీలు**: Pandas, NumPy, Matplotlib, Django\n+• **అభ్యాసం**: CodeWars, Project Euler\n+• **ప్రాజెక్టులు**: Web apps, Data analysis, Automation scripts`;
    }
    return `**Python** programming:\n\n• **Basics**: Syntax, data types, functions, loops\n• **Libraries**: Pandas, NumPy, Matplotlib, Django\n• **Practice**: CodeWars, Project Euler\n• **Projects**: Web apps, data analysis, automation`;
  }
  
  if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
    if (isTamil) {
      return `**JavaScript** பற்றி:\n\n• **அடிப்படைகள்**: Variables, Functions, DOM manipulation\n• **Framework**: React, Vue, Node.js\n• **பயிற்சி**: Build interactive websites\n• **திட்டங்கள்**: Web apps, Browser extensions`;
    }
    if (isTelugu) {
      return `**JavaScript** గురించి:\n\n• **ప్రాథమికాలు**: Variables, Functions, DOM manipulation\n+• **ఫ్రేమ్‌వర్క్స్**: React, Vue, Node.js\n+• **అభ్యాసం**: ఇంటరాక్టివ్ వెబ్‌సైట్స్ నిర్మించండి\n+• **ప్రాజెక్టులు**: Web apps, Browser extensions`;
    }
    return `**JavaScript** programming:\n\n• **Basics**: Variables, functions, DOM manipulation\n• **Frameworks**: React, Vue, Node.js\n• **Practice**: Build interactive websites\n• **Projects**: Web apps, browser extensions`;
  }
  
  // Web development
  if (lowerMessage.includes('html') || lowerMessage.includes('css') || lowerMessage.includes('web')) {
    if (isTamil) {
      return `**Web Development** பற்றி:\n\n• **HTML**: Structure and content\n• **CSS**: Styling and layout (Flexbox, Grid)\n• **JavaScript**: Interactivity\n• **பயிற்சி**: Responsive websites, landing pages`;
    }
    if (isTelugu) {
      return `**Web Development** గురించి:\n\n• **HTML**: Structure and content\n+• **CSS**: Styling and layout (Flexbox, Grid)\n+• **JavaScript**: Interactivity\n+• **అభ్యాసం**: Responsive websites, landing pages`;
    }
    return `**Web Development**:\n\n• **HTML**: Structure and content\n• **CSS**: Styling and layout (Flexbox, Grid)\n• **JavaScript**: Interactivity\n• **Practice**: Build responsive websites`;
  }
  
  // Career questions
  if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('placement')) {
    if (isTamil) {
      return `**தொழில் வழிகாட்டுதல்**:\n\n• **திறன்கள்**: தொழில்நுட்ப திறன்களை வளர்த்துக் கொள்ளுங்கள்\n• **திட்டங்கள்**: GitHub இல் portfolio உருவாக்கவும்\n• **இடைநிலை**: LeetCode, HackerRank இல் பயிற்சி செய்யவும்\n• **Network**: LinkedIn இல் தொடர்பு கொள்ளுங்கள்`;
    }
    if (isTelugu) {
      return `**కేరియర్ మార్గదర్శకత్వం**:\n\n• **Skills**: సాంకేతిక నైపుణ్యాలను అభివృద్ధి చేసుకోండి\n+• **ప్రాజెక్టులు**: GitHub పై పోర్ట్ఫోలియో నిర్మించండి\n+• **ఇంటర్వ్యూకు సిద్ధత**: LeetCode, HackerRank లో ప్రాక్టీస్ చేయండి\n+• **నెట్‌వర్కింగ్**: LinkedIn లో కనెక్ట్ అవ్వండి`;
    }
    return `**Career Guidance**:\n\n• **Skills**: Develop technical skills\n• **Projects**: Build portfolio on GitHub\n• **Interview Prep**: Practice on LeetCode, HackerRank\n• **Networking**: Connect on LinkedIn`;
  }
  
  // General educational response
  if (isTamil) {
    return `நான் உங்களுக்கு கல்வி, தொழில் மற்றும் திறன்கள் பற்றி உதவ முடியும்.\n\n• குறிப்பிட்ட கேள்வியைக் கேளுங்கள் (எ.கா: "pandas பற்றி விளக்குங்கள்")\n• எடுத்துக்காட்டுகள் கேளுங்கள்\n• பயிற்சி பயிற்சிகளைக் கேளுங்கள்\n\nஎன்ன உதவி தேவை?`;
  }
  // Helpful mock answers for Telugu for some unhandled domains (physics, math, history)
  if (isTelugu) {
    // Physics: Eddy currents
    if (lowerMessage.includes('eddy') || lowerMessage.includes('eddy current')) {
      return `**ఎడ్డి కరెంట్లు (Eddy Currents)**:\n\n• **Parichayam**: పాట్యలో మారుతున్న చుద్రపు చలనము లేదా కన్డక్టర్‌లో ప్రేరేపిత విద్యుత్ ప్రవాహాలు ఏర్పడతాయి.\n• **ఎలక్ట్రోమెగ్నెటిక్ కారణం**: ఒక పరివర్తించిన రీజియన్‌లో ఫ్లక్స్ మార్పు వల్ల కన్డక్టర్‌లో వలయాకార కరెంట్లు ప్రవహిస్తాయి.\n• **ప్రభావాలు**: వేడి నష్టం, శక్తి ఖర్చు, బ్రేకింగ్ (ఎలక్ట్రోమాగ్నెటిక్ బ్రేక్స్).\n• **తిరిగి నియంత్రణ**: లామినేషన్ లేదా వాయుకరణ/పాటర్న్ మార్పులతో తగ్గించవచ్చు.\n\nఈ వివరణతో సరిపడనట్లైతే, నేను ఒక సుటివల్ ఉదాహరణ లేదా గణన ఇవ్వగలను.`;
    }

    // Math: simple integral
    if (lowerMessage.includes('integral') || lowerMessage.includes('integrate') || lowerMessage.includes('∫')) {
      // simple pattern for x^2
      if (lowerMessage.includes('x^2') || lowerMessage.includes('x**2') || lowerMessage.includes('x 2')) {
        return `సమీకరణ: ∫ x^2 dx = x^3 / 3 + C\n\n• రూల్: సమీకరణం లో x^n నీ ఇంటిగ్రేట్ చేయాలంటే x^{n+1}/(n+1) + C ఉపయోగిస్తారు.`;
      }
      return `ఇంటిగ్రల్ గురించి సహజ వివరణ: ఏ ఫంక్షన్ యొక్క ఇంటిగ్రల్ దాని విభిన్నీకరణకు వ్యతిరేకమైనది. స్పెసిఫిక్ ఉదాహరణలు చెప్పండి.`;
    }

    // History: Ashoka
    if (lowerMessage.includes('ashoka') || lowerMessage.includes('ashoka the great') || lowerMessage.includes('emperor ashoka')) {
      return `**అశోకుడు (Ashoka)**:\n\n• **రాజ్య కాలం**: మౌర్య సామ్రాజ్య రాజు, సుమారు 3వ శతాబ్ద BCEలో తన పరిపాలన ఎక్కువగా విస్తరించింది.\n• **ధర్మానికి మద్దతు**: కాలం తరువాత బౌద్ధ ధర్మాన్ని ఆమోదించి, నిరృశనం మరియు శాంతి అభివృద్ధికి పుడతాడు.\n• **సాధనలు**: కావేరి శిలాసూత్రాలు, అశోక స్టూపాలు మరియు శిలాక్షరాల ద్వారా ఆయన శాసనాలు ప్రసిద్ధి చెందాయి.`;
    }

    // Default Telugu helpful prompt echo
    return `నేను మీకు విద్య, కెరీర్ మరియు నైపుణ్యాల గురించి సహాయం చేయగలను. మీరు అడిగినది: "${message}". దయచేసి మీ ప్రశ్నను స్పష్టంగా చెప్పండి లేదా నేను ఒక సంక్షిప్త సరళ వివరణ ఇవ్వగలను.`;
  }

  return `I can help with education, career, and skills.\n\n• Ask specific questions (e.g., "explain pandas in data science")\n• Request examples\n• Get practice exercises\n• Career guidance\n\nWhat do you need help with?`;
};

// 3. Teaching Assistant Chat
export const sendMessageToMentor = async (history: {role: string, parts: {text: string}[]}[], message: string, language: string = 'English') => {
  try {
    // Use mock data if API is not available
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      console.warn('API key not configured. Using mock mentor responses.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockMentorResponse(message, language);
    }

    const systemInstruction = `You are an AI Teaching Assistant for EduBridge.
    You may answer questions from ANY academic, technical, vocational, or study-related domain (science, maths, engineering, humanities, languages, etc.).
    Language requirement: RESPOND ONLY in ${language} and use natural, idiomatic phrasing for that language.
    Response style: concise but helpful; prefer short bullet points for explanations and include a short example when appropriate.
    Safety/Scope: If the user asks for content that is illegal, dangerous, or explicitly off-topic (personal medical advice, illegal instructions, or non-study harmful content), reply: "Sorry, I can't assist with that."`;

    // Build conversation history
    const contents: any[] = [];
    
    // Add system instruction
    contents.push({ text: systemInstruction });
    
    // Add conversation history (last 5 messages for context)
    const recentHistory = history.slice(-5);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        contents.push({ text: `User: ${msg.parts[0]?.text || ''}` });
      } else if (msg.role === 'model') {
        contents.push({ text: `Assistant: ${msg.parts[0]?.text || ''}` });
      }
    });
    
    // Add current message
    contents.push({ text: `User: ${message}` });
    contents.push({ text: 'Assistant:' });

    // Use generateContent instead of chat API
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: contents
    });

    const responseText = response.text || '';
    
    // Extract assistant response (remove "Assistant:" prefix if present)
    const cleanResponse = responseText.replace(/^Assistant:\s*/i, '').trim();
    
    return cleanResponse || getMockMentorResponse(message, language);
  } catch (error: any) {
    console.error("Mentor chat error:", error);
    // Return mock response on error instead of error message
    return getMockMentorResponse(message, language);
  }
};

// Mock data for MNC Trends (fast fallback)
const getMockTrendAnalytics = (): any[] => {
    return [
        {
            technology: 'Artificial Intelligence',
            description: 'Encompasses machine learning, deep learning, and natural language processing. Transforming industries with intelligent automation and predictive analytics.',
            currentDemand: 9.5,
            futureScope: 9.8,
            salaryHike: 15,
            growthTrend: [8.2, 8.5, 8.8, 9.0, 9.2, 9.5]
        },
        {
            technology: 'Data Science',
            description: 'Focuses on extracting insights and knowledge from large datasets using statistical methods, machine learning, and data visualization techniques.',
            currentDemand: 9.2,
            futureScope: 9.5,
            salaryHike: 12,
            growthTrend: [8.0, 8.3, 8.6, 8.8, 9.0, 9.2]
        },
        {
            technology: 'DevOps',
            description: 'A set of practices that combines software development (Dev) and IT operations (Ops) to shorten the development lifecycle and deliver high-quality software.',
            currentDemand: 9.0,
            futureScope: 9.3,
            salaryHike: 10,
            growthTrend: [7.8, 8.1, 8.4, 8.6, 8.8, 9.0]
        },
        {
            technology: 'Cybersecurity',
            description: 'Protecting systems, networks, and programs from digital attacks. Critical for safeguarding sensitive data and ensuring business continuity.',
            currentDemand: 9.7,
            futureScope: 9.6,
            salaryHike: 13,
            growthTrend: [8.5, 8.8, 9.0, 9.2, 9.4, 9.7]
        },
        {
            technology: 'Cloud Computing',
            description: 'Delivery of on-demand computing services—from applications to storage and processing power—typically over the internet and on a pay-as-you-go basis.',
            currentDemand: 9.4,
            futureScope: 9.7,
            salaryHike: 11,
            growthTrend: [8.3, 8.6, 8.9, 9.1, 9.3, 9.4]
        }
    ];
};

// 4. MNC Trends
export const getTrendAnalytics = async (): Promise<any> => {
  try {
    // Fast fallback if API key is not available
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      console.warn('API key not configured. Using fast mock trend data.');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate quick processing
      return getMockTrendAnalytics();
    }

    const prompt = `
      Generate JSON for top 5 trending MNC technologies (Include AI, Data Science, DevOps, Cybersecurity, Cloud Computing).
      Return JSON array of 5 objects with:
      - technology: Technology name
      - description: Brief description (2-3 sentences)
      - currentDemand: Number between 8.0 and 10.0
      - futureScope: Number between 8.0 and 10.0
      - salaryHike: Number between 10 and 15 (percentage)
      - growthTrend: Array of 6 numbers showing 6-month trend
    `;
    
    // Add timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Trends timeout')), 10000) // 10 second timeout
    );

    const apiPromise = ai.models.generateContent({
        model: modelFlash,
        contents: [{ text: prompt }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        technology: { type: Type.STRING },
                        description: { type: Type.STRING },
                        currentDemand: { type: Type.NUMBER },
                        futureScope: { type: Type.NUMBER },
                        salaryHike: { type: Type.NUMBER },
                        growthTrend: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                    }
                }
            }
        }
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    const data = JSON.parse(response.text || '[]');
    
    if (data.length === 0) {
      throw new Error('Empty response');
    }
    
    return data;
  } catch (error) {
    console.error("Trend analytics error:", error);
    // Return mock data on error for fast fallback
    return getMockTrendAnalytics();
  }
}

// 5. Project Ideas Generator
const getMockProjectIdeas = (interests: string, domain: string): any[] => {
  const domainLower = domain.toLowerCase();
  const interestsLower = interests.toLowerCase();
  
  // Generate 3 project ideas based on domain and interests
  const ideas: any[] = [];
  
  if (domainLower.includes('web') || domainLower.includes('development')) {
    if (interestsLower.includes('healthcare') || interestsLower.includes('health')) {
      ideas.push(
        {
          title: 'AI-Powered Telemedicine Platform with Real-time Consultation',
          description: 'A comprehensive web platform connecting patients with healthcare providers through video consultations, AI symptom analysis, prescription management, and health record tracking.',
          techStack: ['React/Next.js', 'Node.js (Express)', 'WebRTC', 'PostgreSQL', 'TensorFlow.js', 'Stripe API'],
          difficulty: 'Advanced',
          roadmap: [
            'Set up project structure with Next.js and TypeScript',
            'Implement user authentication and role-based access (Patient/Doctor)',
            'Integrate WebRTC for video consultations',
            'Build AI symptom checker using ML models',
            'Add prescription and health record management',
            'Implement payment gateway for consultations',
            'Deploy on Vercel/AWS with database hosting'
          ]
        },
        {
          title: 'Healthcare Appointment Booking System with Smart Scheduling',
          description: 'An intelligent appointment management system that optimizes doctor schedules, sends automated reminders, and provides patient portal for medical history access.',
          techStack: ['Vue.js/Nuxt.js', 'Python (Django)', 'PostgreSQL', 'Redis', 'SendGrid API', 'Chart.js'],
          difficulty: 'Intermediate',
          roadmap: [
            'Design database schema for appointments and users',
            'Build RESTful API with Django',
            'Create frontend with Vue.js and responsive design',
            'Implement smart scheduling algorithm',
            'Add email/SMS notification system',
            'Build admin dashboard for analytics',
            'Deploy with Docker containers'
          ]
        },
        {
          title: 'Mental Health Support Chatbot with Mood Tracking',
          description: 'A web-based mental health assistant that provides 24/7 support, mood tracking, meditation guides, and connects users with licensed therapists when needed.',
          techStack: ['React', 'Node.js', 'MongoDB', 'OpenAI API', 'Chart.js', 'Firebase Auth'],
          difficulty: 'Intermediate',
          roadmap: [
            'Set up React app with routing',
            'Integrate OpenAI API for conversational AI',
            'Build mood tracking dashboard with charts',
            'Create user authentication system',
            'Add meditation and breathing exercise features',
            'Implement therapist matching algorithm',
            'Deploy on Netlify with MongoDB Atlas'
          ]
        }
      );
    } else if (interestsLower.includes('edtech') || interestsLower.includes('education')) {
      ideas.push(
        {
          title: 'AI-Powered Adaptive Learning Pathway Generator',
          description: 'Create personalized, adaptive learning paths using AI, interactive content, and intelligent assessment that adjusts to each student\'s learning pace and style.',
          techStack: ['React/Next.js', 'Node.js (Express)', 'Python (Flask/Django for AI/ML backend)', 'PostgreSQL/MongoDB', 'TensorFlow', 'Stripe'],
          difficulty: 'Advanced',
          roadmap: [
            'Design learning path algorithm with ML models',
            'Build frontend with React and interactive UI components',
            'Create backend API for content management',
            'Implement adaptive assessment system',
            'Add progress tracking and analytics',
            'Integrate payment for premium features',
            'Deploy with microservices architecture'
          ]
        },
        {
          title: 'Collaborative Real-time Coding Workspace with Integrated Sandbox',
          description: 'A real-time collaborative code editor with shared editing, chat, version control, and a sandboxed environment for running code safely.',
          techStack: ['Vue.js/Nuxt.js', 'Node.js (Socket.IO for WebSockets)', 'MongoDB/PostgreSQL', 'Docker (for code execution)', 'WebRTC (for voice/video)', 'Monaco Editor'],
          difficulty: 'Advanced',
          roadmap: [
            'Set up WebSocket server for real-time collaboration',
            'Integrate Monaco Editor for code editing',
            'Build Docker-based code execution sandbox',
            'Implement version control system',
            'Add voice/video chat functionality',
            'Create user authentication and room management',
            'Deploy with load balancing for scalability'
          ]
        },
        {
          title: 'Interactive STEM Virtual Lab and Simulation Platform',
          description: 'A web-based interactive simulation and virtual lab for STEM subjects, allowing students to perform virtual experiments safely and learn through hands-on practice.',
          techStack: ['Svelte/React', 'Python (Flask/Django for backend logic)', 'PostgreSQL', 'Three.js/P5.js/Babylon.js (for 3D/2D simulations)', 'WebGL'],
          difficulty: 'Intermediate',
          roadmap: [
            'Design simulation engine with physics calculations',
            'Build 3D visualization using Three.js',
            'Create experiment templates for different subjects',
            'Implement user progress tracking',
            'Add interactive tutorials and guides',
            'Build admin panel for content management',
            'Deploy with CDN for fast asset delivery'
          ]
        }
      );
    } else {
      // Generic web development projects
      ideas.push(
        {
          title: 'E-Commerce Platform with AI Product Recommendations',
          description: 'A full-featured e-commerce platform with personalized product recommendations, real-time inventory management, and seamless checkout experience.',
          techStack: ['React/Next.js', 'Node.js', 'MongoDB', 'Stripe API', 'Redis', 'TensorFlow.js'],
          difficulty: 'Advanced',
          roadmap: [
            'Set up Next.js with TypeScript',
            'Design database schema for products and users',
            'Build product catalog and search functionality',
            'Implement AI recommendation engine',
            'Add shopping cart and checkout flow',
            'Integrate payment gateway',
            'Deploy on AWS with CI/CD pipeline'
          ]
        },
        {
          title: 'Social Media Dashboard with Analytics',
          description: 'A comprehensive dashboard for managing multiple social media accounts, scheduling posts, and analyzing engagement metrics.',
          techStack: ['React', 'Node.js', 'PostgreSQL', 'Twitter API', 'Instagram API', 'Chart.js'],
          difficulty: 'Intermediate',
          roadmap: [
            'Set up React app with routing',
            'Integrate social media APIs',
            'Build post scheduling system',
            'Create analytics dashboard with charts',
            'Add user authentication',
            'Implement notification system',
            'Deploy on Heroku or Vercel'
          ]
        },
        {
          title: 'Task Management App with Team Collaboration',
          description: 'A project management tool with kanban boards, team chat, file sharing, and time tracking features.',
          techStack: ['Vue.js', 'Node.js', 'MongoDB', 'Socket.IO', 'AWS S3', 'JWT'],
          difficulty: 'Intermediate',
          roadmap: [
            'Design database schema for tasks and teams',
            'Build RESTful API with Node.js',
            'Create frontend with Vue.js',
            'Implement real-time updates with WebSockets',
            'Add file upload functionality',
            'Build notification system',
            'Deploy with Docker'
          ]
        }
      );
    }
  } else if (domainLower.includes('iot') || domainLower.includes('embedded')) {
    ideas.push(
      {
        title: 'Smart Home Automation System with Mobile App',
        description: 'An IoT-based home automation system that controls lights, temperature, security cameras, and appliances through a mobile app with voice commands.',
        techStack: ['React Native', 'Arduino/ESP32', 'MQTT', 'Node.js', 'MongoDB', 'Firebase'],
        difficulty: 'Advanced',
        roadmap: [
          'Set up Arduino/ESP32 development environment',
          'Build sensor integration (temperature, motion, light)',
          'Create MQTT broker for device communication',
          'Develop mobile app with React Native',
          'Implement voice control with speech recognition',
          'Add security features and encryption',
          'Deploy cloud backend on AWS IoT'
        ]
      },
      {
        title: 'IoT-Based Agriculture Monitoring System',
        description: 'A smart farming solution that monitors soil moisture, temperature, humidity, and crop health using sensors and provides actionable insights.',
        techStack: ['Python', 'Raspberry Pi', 'Arduino', 'MQTT', 'React', 'PostgreSQL'],
        difficulty: 'Intermediate',
        roadmap: [
          'Set up Raspberry Pi with sensors',
          'Program Arduino for data collection',
          'Build MQTT communication system',
          'Create web dashboard with React',
          'Implement data analytics and alerts',
          'Add mobile notifications',
          'Deploy with edge computing'
        ]
      },
      {
        title: 'Wearable Health Monitor with Cloud Sync',
        description: 'A wearable device that tracks heart rate, steps, sleep patterns, and syncs data to a cloud platform for health analysis.',
        techStack: ['Arduino/ESP32', 'C++', 'React Native', 'Node.js', 'MongoDB', 'Chart.js'],
        difficulty: 'Advanced',
        roadmap: [
          'Design hardware with sensors',
          'Program microcontroller firmware',
          'Build Bluetooth communication',
          'Develop mobile app for data display',
          'Create cloud API for data storage',
          'Implement health analytics dashboard',
          'Add AI-based health insights'
        ]
      }
    );
  } else if (domainLower.includes('machine learning') || domainLower.includes('ai')) {
    ideas.push(
      {
        title: 'Image Classification App for Medical Diagnosis',
        description: 'An AI-powered application that analyzes medical images (X-rays, CT scans) to assist doctors in diagnosis with high accuracy.',
        techStack: ['Python', 'TensorFlow/PyTorch', 'Flask/FastAPI', 'React', 'PostgreSQL', 'Docker'],
        difficulty: 'Advanced',
        roadmap: [
          'Collect and preprocess medical image dataset',
          'Train CNN model with TensorFlow',
          'Build REST API with Flask',
          'Create frontend with React',
          'Implement model deployment pipeline',
          'Add user authentication and data security',
          'Deploy with Kubernetes'
        ]
      },
      {
        title: 'Sentiment Analysis Tool for Social Media',
        description: 'A real-time sentiment analysis tool that monitors social media posts, reviews, and comments to gauge public opinion.',
        techStack: ['Python', 'NLTK/Spacy', 'Flask', 'React', 'MongoDB', 'Twitter API'],
        difficulty: 'Intermediate',
        roadmap: [
          'Set up NLP libraries and models',
          'Build data collection from APIs',
          'Implement sentiment analysis algorithm',
          'Create visualization dashboard',
          'Add real-time streaming',
          'Build alert system for trends',
          'Deploy on cloud platform'
        ]
      },
      {
        title: 'Chatbot for Customer Support',
        description: 'An intelligent chatbot that handles customer queries, provides product information, and escalates complex issues to human agents.',
        techStack: ['Python', 'OpenAI API', 'Flask', 'React', 'PostgreSQL', 'WebSocket'],
        difficulty: 'Intermediate',
        roadmap: [
          'Design conversation flow and intents',
          'Integrate OpenAI API or train custom model',
          'Build backend API with Flask',
          'Create chat interface with React',
          'Implement context management',
          'Add human handoff functionality',
          'Deploy with monitoring and analytics'
        ]
      }
    );
  } else {
    // Default projects
    ideas.push(
      {
        title: 'Full-Stack Web Application with Modern Tech Stack',
        description: 'A complete web application showcasing modern development practices with authentication, database integration, and responsive design.',
        techStack: ['React', 'Node.js', 'MongoDB', 'Express', 'JWT', 'Tailwind CSS'],
        difficulty: 'Intermediate',
        roadmap: [
          'Set up project structure',
          'Design database schema',
          'Build RESTful API',
          'Create frontend components',
          'Implement authentication',
          'Add responsive styling',
          'Deploy application'
        ]
      },
      {
        title: 'Mobile App with Backend Integration',
        description: 'A cross-platform mobile application with cloud backend, real-time features, and offline support.',
        techStack: ['React Native', 'Node.js', 'Firebase', 'MongoDB', 'Redux'],
        difficulty: 'Advanced',
        roadmap: [
          'Set up React Native project',
          'Design app architecture',
          'Build backend API',
          'Implement state management',
          'Add offline functionality',
          'Integrate push notifications',
          'Deploy to app stores'
        ]
      },
      {
        title: 'Data Analytics Dashboard',
        description: 'An interactive dashboard for visualizing and analyzing data with charts, filters, and export functionality.',
        techStack: ['React', 'Python', 'PostgreSQL', 'Chart.js', 'Pandas', 'Flask'],
        difficulty: 'Intermediate',
        roadmap: [
          'Collect and clean data',
          'Build data processing pipeline',
          'Create API endpoints',
          'Design dashboard UI',
          'Implement data visualization',
          'Add export features',
          'Deploy with data updates'
        ]
      }
    );
  }
  
  return ideas;
};

export const generateProjectIdeas = async (interests: string, domain: string): Promise<any[]> => {
  try {
    // Fast fallback if API key is not available
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      console.warn('API key not configured. Using fast mock project ideas.');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate quick processing
      return getMockProjectIdeas(interests, domain);
    }

    const prompt = `Generate 3 unique, plagiarism-free project ideas for "${domain}" domain focusing on "${interests}" interests.
    
    Return JSON array with:
    - title: Creative, specific project name
    - description: 2-3 sentence description explaining the project
    - techStack: Array of 5-7 relevant technologies/tools
    - difficulty: "Beginner", "Intermediate", or "Advanced"
    - roadmap: Array of 7 steps for implementation
    
    Make projects practical, industry-relevant, and suitable for portfolio.`;

    // Add timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timeout')), 12000) // 12 second timeout
    );

    const apiPromise = ai.models.generateContent({
      model: modelFlash,
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING },
              roadmap: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    const ideas = JSON.parse(response.text || '[]');
    
    if (ideas.length === 0) {
      throw new Error('Empty response');
    }
    
    return ideas;
  } catch (error) {
    console.error("Project generation error:", error);
    // Return mock data on error for fast fallback
    return getMockProjectIdeas(interests, domain);
  }
};

// 5. Mock Interview (MCQ Quiz Generator)
export const getInterviewQuiz = async (type: string, topic: string, difficulty: string): Promise<any[]> => {
  try {
    const prompt = `
        Generate 5 Multiple Choice Questions (MCQ) for a "${type}" interview round focusing on "${topic}" at "${difficulty}" level.
        If Type is 'Non-Technical', focus on Aptitude, Logical Reasoning, and Situational Judgment.
        
        Return JSON Array of objects:
        - id (number)
        - question (string)
        - options (array of 4 strings)
        - correctIndex (number 0-3)
    `;

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.NUMBER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.NUMBER }
                }
            }
        }
      }
    });
    const parsed = JSON.parse(response.text || '[]');
    if (parsed.length === 0) throw new Error("Empty response");
    return parsed;
  } catch (error) {
    console.error("Quiz generation failed, using fallback:", error);
    // FALLBACK QUESTIONS to ensure the feature always works even if API fails
    return [
        {
            id: 1,
            question: "Which data structure is best for First-In-First-Out (FIFO) operations?",
            options: ["Stack", "Queue", "Tree", "Graph"],
            correctIndex: 1
        },
        {
            id: 2,
            question: "What is the time complexity of searching in a balanced Binary Search Tree?",
            options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
            correctIndex: 1
        },
        {
            id: 3,
            question: "In OOP, what concept describes wrapping data and methods into a single unit?",
            options: ["Polymorphism", "Inheritance", "Encapsulation", "Abstraction"],
            correctIndex: 2
        },
        {
            id: 4,
            question: "Which sorting algorithm typically has the best average-case performance?",
            options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
            correctIndex: 2
        },
        {
            id: 5,
            question: "What does SQL stand for?",
            options: ["Structured Question Language", "Simple Query Language", "Structured Query Language", "Standard Query Link"],
            correctIndex: 2
        }
    ];
  }
};

// Subject-specific practice activities
const getSubjectPractices = (subject: string): string[] => {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('java') || lowerSubject.includes('programming')) {
        return [
            '**Practice (45 min)**: Code 2-3 DSA problems on LeetCode/HackerRank',
            '**Projects**: Build console applications or small GUI apps',
            '**Revision (20 min)**: Review OOP concepts and Java syntax'
        ];
    } else if (lowerSubject.includes('python')) {
        return [
            '**Practice (50 min)**: Solve Python challenges, work with libraries (pandas, numpy)',
            '**Projects**: Create scripts for data analysis or automation',
            '**Revision (15 min)**: Review Python data structures and functions'
        ];
    } else if (lowerSubject.includes('html') || lowerSubject.includes('css') || lowerSubject.includes('web')) {
        return [
            '**Practice (40 min)**: Build responsive layouts, practice CSS Grid/Flexbox',
            '**Projects**: Create landing pages or portfolio websites',
            '**Revision (25 min)**: Review HTML tags and CSS properties'
        ];
    } else if (lowerSubject.includes('javascript') || lowerSubject.includes('js')) {
        return [
            '**Practice (55 min)**: Code DOM manipulation, async/await exercises',
            '**Projects**: Build interactive web apps or games',
            '**Revision (20 min)**: Review ES6+ features and callbacks'
        ];
    } else if (lowerSubject.includes('react')) {
        return [
            '**Practice (50 min)**: Build components, practice hooks and state management',
            '**Projects**: Create single-page applications',
            '**Revision (25 min)**: Review React lifecycle and component patterns'
        ];
    } else if (lowerSubject.includes('data structure') || lowerSubject.includes('ds')) {
        return [
            '**Practice (60 min)**: Solve array, linked list, tree problems',
            '**Projects**: Implement data structures from scratch',
            '**Revision (15 min)**: Review time/space complexity'
        ];
    } else if (lowerSubject.includes('database') || lowerSubject.includes('sql')) {
        return [
            '**Practice (45 min)**: Write complex queries, practice joins and subqueries',
            '**Projects**: Design database schemas for real-world scenarios',
            '**Revision (20 min)**: Review normalization and indexing'
        ];
    } else if (lowerSubject.includes('algorithm') || lowerSubject.includes('algo')) {
        return [
            '**Practice (55 min)**: Solve problems on sorting, searching, dynamic programming',
            '**Projects**: Implement algorithms and compare efficiency',
            '**Revision (20 min)**: Review algorithm patterns and strategies'
        ];
    } else {
        return [
            '**Practice (45 min)**: Work on practical exercises and problems',
            '**Projects**: Build related mini-projects',
            '**Revision (20 min)**: Review key concepts and notes'
        ];
    }
};

// Mock timetable generator with different times and practices
// `memory` is an optional 1-5 scale where lower values increase repetition/time allocation
const getMockTimetable = (subjects: string, hours: string, memory: number = 3): string => {
  const rawList = subjects.split(',').map(s => s.trim()).filter(s => s);
  const hoursPerDay = parseInt(hours) || 4;

  // Map subject to priority so more difficult/important subjects get more time.
  // Custom mapping: user requested more time for R, then Java, then C.
  const priorityMap: Record<string, number> = {
    'r': 5,
    'r programming': 5,
    'r language': 5,
    'java': 4,
    'python': 4,
    'c': 3,
    'c++': 3,
    'data structures': 4,
    'algorithms': 5,
    'database': 3,
    'sql': 3,
  };

  // Build subject objects with priority (default 2)
  const subjectObjs = rawList.map((s, idx) => {
    const key = s.toLowerCase();
    // find a matching priority by tokenizing
    let p = 2;
    Object.keys(priorityMap).forEach(k => {
      if (key.includes(k)) p = Math.max(p, priorityMap[k]);
    });
    return { subject: s, priority: p, origIdx: idx };
  });

  // Sort by priority descending so higher priority gets allocated more minutes
  subjectObjs.sort((a, b) => b.priority - a.priority || a.origIdx - b.origIdx);

  // Distribute hours unevenly based on sorted priority
  const timeDistribution: number[] = [];
  const totalMinutes = hoursPerDay * 60;
  const totalPriority = subjectObjs.reduce((s, x) => s + x.priority, 0);
  const mem = isNaN(memory as any) ? 3 : Math.max(1, Math.min(5, Math.round(memory)));
  const memoryFactor = 1 + ((3 - mem) * 0.08);

  let allocated = 0;
  for (let i = 0; i < subjectObjs.length; i++) {
    const share = Math.round((subjectObjs[i].priority / totalPriority) * totalMinutes * memoryFactor);
    // ensure at least 30 minutes
    const minutes = Math.max(30, share);
    timeDistribution.push(minutes);
    allocated += minutes;
  }
  // adjust last to fit total
  const diff = allocated - Math.round(totalMinutes * memoryFactor);
  if (diff !== 0 && timeDistribution.length > 0) {
    timeDistribution[timeDistribution.length - 1] = Math.max(30, timeDistribution[timeDistribution.length - 1] - diff);
  }
    
    let plan = `## Weekly Study Schedule (${hoursPerDay} hours/day)\n\n`;
    
    // Use the ordered subjectObjs for the final plan so priority is reflected
    subjectObjs.forEach((obj, index) => {
      const subject = obj.subject;
      const minutes = timeDistribution[index];
        const hoursPart = Math.floor(minutes / 60);
        const minsPart = minutes % 60;
        const timeStr = hoursPart > 0 ? `${hoursPart}h ${minsPart}m` : `${minsPart}m`;
        
        const practices = getSubjectPractices(subject);
        
        plan += `### ${subject}\n`;
        plan += `• **Daily Time**: ${timeStr}\n`;
        plan += `• ${practices[0]}\n`;
        plan += `• ${practices[1]}\n`;
        plan += `• ${practices[2]}\n\n`;
    });
    
    plan += `### Study Tips\n`;
    plan += `• **Morning (High Energy)**: Focus on hardest subject or new concepts\n`;
    plan += `• **Afternoon**: Practice coding and problem-solving\n`;
    plan += `• **Evening**: Review and revise what you learned\n`;
    plan += `• **Break Strategy**: Take 10-minute break every 1.5 hours\n`;
    plan += `• **Weekend**: Review all subjects, work on projects\n`;
    plan += `• **Active Recall**: Test yourself without notes regularly\n`;
    plan += `• **Spaced Repetition**: Review previous topics every 2-3 days\n`;
    plan += `• **Time Tracking**: Use a timer to stay focused\n`;
    
    return plan;
};

// 6. Smart Timetable
export const generateTimetable = async (subjects: string, hours: string, memory: number = 3): Promise<string> => {
    try {
        // Use mock data if API is not available
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock timetable.');
            await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockTimetable(subjects, hours, memory);
        }

        const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s);
        const prompt = `
            Create a concise, personalized weekly study schedule for these subjects: ${subjectList.join(', ')}.
            Available study time: ${hours} hours per day.
            
            IMPORTANT REQUIREMENTS:
            - Each subject MUST have DIFFERENT time allocation (not equal distribution)
            - Each subject MUST have DIFFERENT practice activities based on the subject type
            - Allocate more time to harder subjects or subjects that need more practice
            - Tips section MUST be in bullet points format
            
            Format requirements:
            - Use bullet points (•) for each task
            - Use **bold** for subject names, time allocations, and key activities
            - Keep it concise and actionable
            - Include specific daily time allocation per subject (e.g., "1h 30m" or "45m")
            - Add DIFFERENT practice activities for each subject based on what it is:
              * Programming languages: coding problems, projects
              * Web technologies: build websites, practice layouts
              * Data structures/algorithms: solve problems, implement from scratch
              * Databases: write queries, design schemas
              * Theory subjects: solve problems, create notes
            - Tips section should have 6-8 bullet points
            
            Structure:
            ## Weekly Study Schedule (X hours/day)
            
            ### [Subject 1]
            • **Daily Time**: [specific time like 1h 30m or 45m]
            • **Practice**: [specific practice activity for this subject]
            • **Projects**: [project ideas specific to this subject]
            • **Revision**: [revision activity for this subject]
            
            ### [Subject 2]
            • **Daily Time**: [DIFFERENT time allocation]
            • **Practice**: [DIFFERENT practice activity]
            • **Projects**: [DIFFERENT project ideas]
            • **Revision**: [DIFFERENT revision activity]
            
            [Repeat for all subjects with DIFFERENT times and activities]
            
            ### Study Tips
            • [Tip 1]
            • [Tip 2]
            • [Tip 3]
            [Continue with 6-8 tips in bullet points]
            
            Make each subject unique with different times and practices!
        `;
        
        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: prompt
        });
        
        return response.text || getMockTimetable(subjects, hours, memory);
    } catch (error: any) {
        console.error("Timetable generation error:", error);
        // Return mock data on error
        return getMockTimetable(subjects, hours, memory);
    }
};

// Mock lab experiment data
const getMockLabExperiment = (topic: string): any => {
    const topicLower = topic.toLowerCase();
    
    // Cloud Deployment Guide
    if (topicLower.includes('cloud') || topicLower.includes('aws') || topicLower.includes('gcp')) {
        return {
            techStack: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
            mncTip: 'Companies like Google and Amazon prioritize infrastructure-as-code. Master Terraform for automated deployments.',
            roadmap: [
                {
                    phaseName: 'Cloud Fundamentals',
                    duration: '2 weeks',
                    description: 'Understand cloud computing basics, AWS/GCP services, and IAM roles.',
                    keyConcepts: ['EC2/Compute Engine', 'S3/Cloud Storage', 'VPC Networks', 'Security Groups'],
                    tools: ['AWS Console', 'GCP Console', 'Cloud Shell'],
                    practicalTask: 'Deploy a simple web app on EC2/Compute Engine'
                },
                {
                    phaseName: 'Containerization',
                    duration: '2 weeks',
                    description: 'Learn Docker and container orchestration with Kubernetes.',
                    keyConcepts: ['Docker Images', 'Kubernetes Pods', 'Services & Deployments', 'ConfigMaps'],
                    tools: ['Docker', 'Kubernetes', 'kubectl'],
                    practicalTask: 'Containerize an app and deploy on Kubernetes cluster'
                },
                {
                    phaseName: 'Infrastructure as Code',
                    duration: '2 weeks',
                    description: 'Automate infrastructure provisioning using Terraform.',
                    keyConcepts: ['Terraform Syntax', 'State Management', 'Modules', 'Variables'],
                    tools: ['Terraform', 'Git', 'Terraform Cloud'],
                    practicalTask: 'Create Terraform config for multi-tier architecture'
                },
                {
                    phaseName: 'CI/CD Pipeline',
                    duration: '2 weeks',
                    description: 'Build automated deployment pipelines with GitHub Actions or GitLab CI.',
                    keyConcepts: ['CI/CD Concepts', 'YAML Pipelines', 'Automated Testing', 'Blue-Green Deployment'],
                    tools: ['GitHub Actions', 'GitLab CI', 'Jenkins'],
                    practicalTask: 'Set up CI/CD pipeline for automated deployments'
                }
            ]
        };
    }
    
    // Git & GitHub
    if (topicLower.includes('git') || topicLower.includes('github')) {
        return {
            techStack: ['Git', 'GitHub', 'GitLab', 'VS Code', 'GitKraken'],
            mncTip: 'Version control is mandatory in all MNCs. Master Git workflows and collaboration patterns.',
            roadmap: [
                {
                    phaseName: 'Git Basics',
                    duration: '1 week',
                    description: 'Learn fundamental Git commands and repository management.',
                    keyConcepts: ['Commits', 'Branches', 'Merge', 'Staging Area'],
                    tools: ['Git CLI', 'Git Bash', 'VS Code Git'],
                    practicalTask: 'Create a repo, make commits, and manage branches'
                },
                {
                    phaseName: 'GitHub Workflow',
                    duration: '1 week',
                    description: 'Master GitHub collaboration: forks, pull requests, and code reviews.',
                    keyConcepts: ['Fork & Clone', 'Pull Requests', 'Code Review', 'Issues'],
                    tools: ['GitHub', 'GitHub Desktop', 'VS Code'],
                    practicalTask: 'Fork a repo, make changes, and submit a PR'
                },
                {
                    phaseName: 'Advanced Git',
                    duration: '1 week',
                    description: 'Learn advanced techniques: rebase, cherry-pick, and conflict resolution.',
                    keyConcepts: ['Rebase', 'Cherry-pick', 'Conflict Resolution', 'Git Hooks'],
                    tools: ['Git CLI', 'SourceTree', 'GitKraken'],
                    practicalTask: 'Resolve merge conflicts and use rebase workflow'
                },
                {
                    phaseName: 'Team Collaboration',
                    duration: '1 week',
                    description: 'Practice GitFlow, branching strategies, and release management.',
                    keyConcepts: ['GitFlow', 'Feature Branches', 'Release Branches', 'Hotfixes'],
                    tools: ['GitHub', 'GitLab', 'Bitbucket'],
                    practicalTask: 'Implement GitFlow workflow in a team project'
                }
            ]
        };
    }
    
    // DevOps CI/CD
    if (topicLower.includes('devops') || topicLower.includes('ci/cd') || topicLower.includes('pipeline')) {
        return {
            techStack: ['Jenkins', 'GitHub Actions', 'Docker', 'Kubernetes', 'Ansible'],
            mncTip: 'DevOps engineers are highly valued. Focus on automation and infrastructure reliability.',
            roadmap: [
                {
                    phaseName: 'CI/CD Fundamentals',
                    duration: '2 weeks',
                    description: 'Understand continuous integration and deployment concepts.',
                    keyConcepts: ['CI/CD Pipeline', 'Build Automation', 'Testing', 'Deployment'],
                    tools: ['Jenkins', 'GitHub Actions', 'GitLab CI'],
                    practicalTask: 'Set up a basic CI pipeline with automated tests'
                },
                {
                    phaseName: 'Container Orchestration',
                    duration: '2 weeks',
                    description: 'Deploy applications using Docker and Kubernetes.',
                    keyConcepts: ['Docker Compose', 'K8s Deployments', 'Services', 'Ingress'],
                    tools: ['Docker', 'Kubernetes', 'kubectl'],
                    practicalTask: 'Deploy microservices on Kubernetes cluster'
                },
                {
                    phaseName: 'Infrastructure Automation',
                    duration: '2 weeks',
                    description: 'Automate infrastructure with Ansible and Terraform.',
                    keyConcepts: ['Ansible Playbooks', 'Terraform', 'Configuration Management'],
                    tools: ['Ansible', 'Terraform', 'Vagrant'],
                    practicalTask: 'Automate server provisioning with Ansible'
                },
                {
                    phaseName: 'Monitoring & Logging',
                    duration: '1 week',
                    description: 'Implement monitoring and logging solutions.',
                    keyConcepts: ['Prometheus', 'Grafana', 'ELK Stack', 'Alerting'],
                    tools: ['Prometheus', 'Grafana', 'ELK Stack'],
                    practicalTask: 'Set up monitoring dashboard with Grafana'
                }
            ]
        };
    }
    
    // Docker & Kubernetes
    if (topicLower.includes('docker') || topicLower.includes('kubernetes') || topicLower.includes('k8s')) {
        return {
            techStack: ['Docker', 'Kubernetes', 'Helm', 'Docker Compose', 'Minikube'],
            mncTip: 'Container orchestration is essential for scalable applications. Master K8s for cloud-native roles.',
            roadmap: [
                {
                    phaseName: 'Docker Basics',
                    duration: '1 week',
                    description: 'Learn containerization fundamentals and Docker commands.',
                    keyConcepts: ['Containers', 'Images', 'Dockerfile', 'Docker Hub'],
                    tools: ['Docker', 'Docker Desktop', 'VS Code'],
                    practicalTask: 'Create Dockerfile and build containerized app'
                },
                {
                    phaseName: 'Docker Compose',
                    duration: '1 week',
                    description: 'Orchestrate multi-container applications.',
                    keyConcepts: ['docker-compose.yml', 'Services', 'Networks', 'Volumes'],
                    tools: ['Docker Compose', 'Docker Desktop'],
                    practicalTask: 'Set up multi-container app with Compose'
                },
                {
                    phaseName: 'Kubernetes Fundamentals',
                    duration: '2 weeks',
                    description: 'Master Kubernetes core concepts and resources.',
                    keyConcepts: ['Pods', 'Deployments', 'Services', 'ConfigMaps', 'Secrets'],
                    tools: ['kubectl', 'Minikube', 'Kind'],
                    practicalTask: 'Deploy and scale application on K8s'
                },
                {
                    phaseName: 'Advanced K8s',
                    duration: '2 weeks',
                    description: 'Learn advanced Kubernetes features and Helm charts.',
                    keyConcepts: ['Helm', 'Ingress', 'StatefulSets', 'Operators'],
                    tools: ['Helm', 'Kubernetes Dashboard', 'Lens'],
                    practicalTask: 'Deploy app using Helm charts'
                }
            ]
        };
    }
    
    // Machine Learning Pipeline
    if (topicLower.includes('machine learning') || topicLower.includes('ml') || topicLower.includes('pipeline')) {
        return {
            techStack: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'MLflow'],
            mncTip: 'ML engineers need strong fundamentals. Focus on model deployment and MLOps practices.',
            roadmap: [
                {
                    phaseName: 'Data Preparation',
                    duration: '2 weeks',
                    description: 'Learn data collection, cleaning, and preprocessing techniques.',
                    keyConcepts: ['Data Cleaning', 'Feature Engineering', 'EDA', 'Data Validation'],
                    tools: ['Pandas', 'NumPy', 'Matplotlib'],
                    practicalTask: 'Clean and preprocess a real-world dataset'
                },
                {
                    phaseName: 'Model Development',
                    duration: '2 weeks',
                    description: 'Build and train machine learning models.',
                    keyConcepts: ['Supervised Learning', 'Model Selection', 'Hyperparameter Tuning', 'Cross-validation'],
                    tools: ['Scikit-learn', 'XGBoost', 'LightGBM'],
                    practicalTask: 'Train and evaluate multiple ML models'
                },
                {
                    phaseName: 'Deep Learning',
                    duration: '3 weeks',
                    description: 'Explore neural networks and deep learning frameworks.',
                    keyConcepts: ['Neural Networks', 'CNNs', 'RNNs', 'Transfer Learning'],
                    tools: ['TensorFlow', 'PyTorch', 'Keras'],
                    practicalTask: 'Build a deep learning model for image classification'
                },
                {
                    phaseName: 'Model Deployment',
                    duration: '2 weeks',
                    description: 'Deploy models to production using MLOps practices.',
                    keyConcepts: ['Model Serving', 'API Development', 'MLflow', 'Model Monitoring'],
                    tools: ['FastAPI', 'MLflow', 'Docker'],
                    practicalTask: 'Deploy ML model as REST API'
                }
            ]
        };
    }
    
    // Default roadmap
    return {
        techStack: ['Relevant Tools', 'Industry Standards', 'Best Practices'],
        mncTip: `Focus on hands-on practice for "${topic}". Build real projects to demonstrate skills.`,
        roadmap: [
            {
                phaseName: 'Foundation',
                duration: '2 weeks',
                description: 'Learn fundamental concepts and terminology.',
                keyConcepts: ['Core Concepts', 'Basic Principles', 'Terminology'],
                tools: ['Documentation', 'Tutorials', 'Practice'],
                practicalTask: 'Complete basic exercises and tutorials'
            },
            {
                phaseName: 'Intermediate',
                duration: '2 weeks',
                description: 'Build practical skills through hands-on projects.',
                keyConcepts: ['Advanced Concepts', 'Best Practices', 'Common Patterns'],
                tools: ['Development Tools', 'Frameworks', 'Libraries'],
                practicalTask: 'Build a small project applying learned concepts'
            },
            {
                phaseName: 'Advanced',
                duration: '2 weeks',
                description: 'Master advanced techniques and optimization.',
                keyConcepts: ['Optimization', 'Advanced Patterns', 'Performance'],
                tools: ['Advanced Tools', 'Debugging', 'Profiling'],
                practicalTask: 'Optimize and enhance your project'
            },
            {
                phaseName: 'Production Ready',
                duration: '1 week',
                description: 'Prepare for industry deployment and best practices.',
                keyConcepts: ['Deployment', 'Testing', 'Documentation'],
                tools: ['CI/CD', 'Testing Tools', 'Documentation'],
                practicalTask: 'Deploy project with proper testing and docs'
            }
        ]
    };
};

// 7. Industry Lab
export const getLabExperiment = async (topic: string): Promise<any> => {
    try {
        // Use mock data if API is not available
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock lab experiment data.');
            await new Promise(resolve => setTimeout(resolve, 1500));
            return getMockLabExperiment(topic);
        }

        const prompt = `
            Create a detailed, industry-ready roadmap for: "${topic}".
            Return JSON with:
            - techStack: Array of 5-7 relevant technologies/tools
            - mncTip: One practical tip from MNC perspective (1-2 sentences)
            - roadmap: Array of 4 workflow steps, each with:
              * phaseName: Clear phase name (e.g., "Cloud Fundamentals", "Container Orchestration")
              * duration: Time needed (e.g., "2 weeks", "1 week")
              * description: Brief explanation of what this phase covers
              * keyConcepts: Array of 3-5 key concepts to learn
              * tools: Array of 2-4 tools/technologies used
              * practicalTask: One specific hands-on task to complete
            
            Make it practical and industry-focused. Each phase should build on the previous one.
        `;
        
        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                        mncTip: { type: Type.STRING },
                        roadmap: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phaseName: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    practicalTask: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const result = JSON.parse(response.text || '{}');
        
        // Validate and return mock if invalid
        if (!result.roadmap || result.roadmap.length === 0) {
            return getMockLabExperiment(topic);
        }
        
        return result;
    } catch (error: any) {
        console.error("Lab Experiment Error", error);
        // Return mock data on error
        return getMockLabExperiment(topic);
    }
};

// 8. Notes Converter (Enhanced for PDF/Resume Analysis & Text Analysis)
export const generateNotes = async (input: { content: string, mimeType?: string }): Promise<string> => {
    try {
        // Use mock data if API key is not available
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock notes for demonstration.');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (input.mimeType === 'application/pdf') {
                return getMockNotesFromPDF();
            } else {
                return getMockNotesFromText(input.content);
            }
        }

        const isPDF = input.mimeType === 'application/pdf';
        
        const prompt = isPDF 
            ? `YOU MUST CREATE EXTENSIVE, DETAILED REVISION NOTES (MINIMUM 12-15 PAGES) BASED ONLY ON THE PROVIDED PDF.

CRITICAL - MAKE IT VERY LONG AND DETAILED:
✓ WRITE IN VERBOSE, ELABORATE STYLE
✓ EXPAND EVERY CONCEPT WITH MULTIPLE PARAGRAPHS
✓ ADD EXAMPLES FOR EVERYTHING
✓ INCLUDE DETAILED EXPLANATIONS AND CONTEXT
✓ DO NOT BE CONCISE - BE LENGTHY AND THOROUGH
✓ TARGET: 12,000-15,000 WORDS MINIMUM

MANDATORY SECTIONS (Create all sections, 15+ pages worth):
1. COMPREHENSIVE OVERVIEW (1-2 pages)
   - Full context and background from PDF
   - Scope and objectives explained in detail
   - Importance and relevance

2. DETAILED CORE CONCEPTS (3-4 pages)
   - Each major concept explained thoroughly
   - Multiple examples for each concept
   - Real-world applications and use cases
   - Why each concept matters

3. PROCESS FLOWS & DIAGRAMS (2-3 pages)
   - Step-by-step processes from PDF
   - ASCII flowcharts and diagrams
   - Decision trees and workflows
   - Visual representations of relationships

4. CASE STUDIES & EXAMPLES (2-3 pages)
   - Detailed case studies from content
   - Practical real-world examples
   - Analysis and insights for each example
   - How concepts apply in practice

5. ADVANCED TOPICS & DEEP DIVE (2-3 pages)
   - Advanced concepts and nuances
   - Complex relationships and connections
   - Edge cases and special scenarios
   - Critical analysis

6. COMPARISON TABLES & MATRICES (1-2 pages)
   - Feature comparison tables
   - Pros/cons analysis
   - Relationship matrices
   - Data comparisons from PDF

7. FORMULAS, EQUATIONS & TECHNICAL DETAILS (1-2 pages)
   - All equations and formulas from content
   - Step-by-step calculations
   - Technical specifications
   - Mathematical relationships

8. PRACTICE SCENARIOS & APPLICATIONS (1-2 pages)
   - Practice problems based on content
   - Application scenarios
   - How to apply concepts
   - Problem-solving approaches

9. COMMON MISTAKES & CLARIFICATIONS (1 page)
   - Common misconceptions addressed
   - Clarifications on difficult concepts
   - Important notes and warnings
   - Best practices

10. COMPREHENSIVE SUMMARY (1-2 pages)
    - Detailed summary of all content
    - Key takeaways (20+ points)
    - Important formulas/concepts recap
    - Quick reference guide

FORMAT REQUIREMENTS:
- Use markdown with multiple heading levels
- **Bold** all key terms on first mention
- > Block quotes for important points
- Create ASCII art diagrams for processes
- Use tables with detailed data
- Include section numbers and clear hierarchy
- Write in academic, detailed style
- Expand explanations to 2-3 sentences minimum per point

WORD COUNT TARGET: 12,000-15,000 WORDS (very detailed)
Do NOT summarize or be concise.
Make it LENGTHY, THOROUGH, AND COMPREHENSIVE.
Every section should be at least 300+ words.`
            
            : `YOU MUST CREATE EXTENSIVE, DETAILED REVISION NOTES (MINIMUM 12-15 PAGES) FROM THE PROVIDED TEXT.

CRITICAL - MAKE IT VERY LONG AND DETAILED:
✓ WRITE IN VERBOSE, ELABORATE STYLE
✓ EXPAND EVERY CONCEPT WITH MULTIPLE PARAGRAPHS
✓ ADD EXAMPLES FOR EVERYTHING
✓ INCLUDE DETAILED EXPLANATIONS AND CONTEXT
✓ DO NOT BE CONCISE - BE LENGTHY AND THOROUGH
✓ TARGET: 12,000-15,000 WORDS MINIMUM

MANDATORY SECTIONS (Create all sections, 15+ pages worth):
1. COMPREHENSIVE OVERVIEW (1-2 pages)
   - Full context and background from text
   - Scope and objectives explained thoroughly
   - Importance and relevance

2. DETAILED CORE CONCEPTS (3-4 pages)
   - Each major concept explained in depth
   - Multiple detailed examples
   - Real-world applications
   - Why each concept matters

3. PROCESS FLOWS & DIAGRAMS (2-3 pages)
   - Step-by-step processes
   - ASCII flowcharts and diagrams
   - Decision trees and workflows
   - Visual representations

4. DETAILED EXAMPLES & APPLICATIONS (2-3 pages)
   - Practical real-world examples
   - Detailed case studies
   - Analysis and insights
   - How to apply concepts

5. ADVANCED TOPICS & DEEP DIVE (2-3 pages)
   - Advanced concepts and nuances
   - Complex relationships
   - Edge cases and scenarios
   - Critical analysis

6. COMPARISON TABLES & ANALYSIS (1-2 pages)
   - Feature comparison tables
   - Pros/cons analysis
   - Data comparisons
   - Relationship matrices

7. FORMULAS & TECHNICAL DETAILS (1-2 pages)
   - Equations and formulas
   - Step-by-step calculations
   - Technical specifications
   - Mathematical relationships

8. PRACTICE & PROBLEM SOLVING (1-2 pages)
   - Practice problems
   - Application scenarios
   - How to approach problems
   - Solution strategies

9. SUMMARY & KEY TAKEAWAYS (1-2 pages)
   - Comprehensive summary
   - Key takeaways (20+ points)
   - Important formulas recap
   - Quick reference guide

FORMAT REQUIREMENTS:
- Use markdown with multiple heading levels
- **Bold** all key terms on first mention
- > Block quotes for important points
- Create ASCII art diagrams
- Use detailed tables
- Clear section hierarchy
- Academic, detailed writing style
- Expand explanations to 2-3 sentences minimum

WORD COUNT TARGET: 12,000-15,000 WORDS (very detailed)
Do NOT summarize or be concise.
Every section should be 300+ words minimum.`;

        const contents: any[] = [{ text: prompt }];

        if (input.mimeType === 'application/pdf') {
            contents.push({
                inlineData: {
                    mimeType: input.mimeType,
                    data: input.content
                }
            });
        } else {
             contents.push({ text: `Content to analyze:\n${input.content}` });
        }

        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: contents
        });
        
        const notes = response.text || "Could not generate notes.";
        
        // Ensure keywords are highlighted
        return notes;
    } catch (error) {
        console.error("Notes generation error:", error);
        // Return mock data on error
        if (input.mimeType === 'application/pdf') {
            return getMockNotesFromPDF();
        } else {
            return getMockNotesFromText(input.content);
        }
    }
};

// Mock notes for PDF/resume analysis
const getMockNotesFromPDF = (): string => {
  // Provide a concise, generic placeholder summary when API is unavailable
  return `Title: Document Summary (mock)

Key Points:
- This is a placeholder summary used when the AI service is not configured.
- Upload a PDF with textual content to receive a focused summary.
- The real service will extract key concepts, definitions, and practical tips.

Summary:
This mock response indicates that the note-generation service is not connected. Please configure an API key or check connectivity. Once active, the system will analyze the uploaded PDF and return concise, relevant notes based only on the document content.

Study Tips:
- Re-upload the document with clear text (not scanned images) when possible.
- If the PDF is scanned, enable OCR or upload a text version.
`;
};

// Mock notes for text analysis
const getMockNotesFromText = (text: string): string => {
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return `## Text Analysis - Revision Notes

### Content Overview
• **Word Count**: ${wordCount} words
• **Sentences**: ${sentences.length} sentences
• **Analysis Date**: ${new Date().toLocaleDateString()}

### Key Concepts Identified
• Main topics and themes extracted from the text
• Important ideas and arguments presented
• Core subject matter discussed

### Important Points
${sentences.slice(0, 5).map((s, i) => `• **Point ${i + 1}**: ${s.trim().substring(0, 100)}${s.trim().length > 100 ? '...' : ''}`).join('\n')}

### Keywords & Terms
• **Key Terms**: Important vocabulary and technical terms
• **Main Topics**: Primary subjects covered
• **Concepts**: Fundamental ideas discussed

### Summary
The text has been analyzed and converted into structured revision notes with key concepts, important points, and keywords highlighted for easy reference.`;
};

// Mock parent report for fast fallback
const getMockParentReport = (studentName: string, stats: string): string => {
    return `# 📊 Student Progress Report - ${studentName}

**Report Date:** ${new Date().toLocaleDateString()}
**Student Statistics:** ${stats}

---

## 📈 Academic Performance

### Overall Assessment
• **Current Grade:** B+ (Good Standing)
• **Attendance Rate:** 85% - Consistent attendance with minor absences
• **Project Completion:** 3 projects completed successfully
• **Academic Strengths:** Strong performance in Web Development and practical assignments

### Subject-wise Breakdown
• **Web Development:** Excellent performance, demonstrates strong practical skills
• **Data Structures:** Needs improvement - focus on algorithmic thinking required
• **Theory Subjects:** Moderate engagement - recommend increased study time

---

## 🎯 Behavioral Assessment

### Engagement Levels
• **Practical Sessions:** High engagement and active participation
• **Theory Classes:** Lower engagement - requires attention
• **Group Projects:** Collaborative and contributes effectively
• **Overall Attitude:** Positive and motivated learner

### Strengths
• Strong problem-solving abilities in practical scenarios
• Good collaboration skills in group projects
• Consistent attendance and punctuality
• Enthusiastic about hands-on learning

### Areas for Improvement
• Theory comprehension needs enhancement
• Data Structures concepts require more practice
• Time management for theoretical studies

---

## 💡 Strategic Recommendations

### Immediate Actions
• **Focus Area:** Allocate 2-3 hours daily for Data Structures practice
• **Study Method:** Use visual learning aids and coding practice platforms
• **Support:** Consider additional tutoring for theoretical concepts

### Long-term Goals
• Improve theory exam scores by 15-20%
• Complete 2 more advanced projects in Web Development
• Build a portfolio showcasing practical skills
• Prepare for technical interviews

### Parental Support Suggestions
• Encourage regular study schedule for theory subjects
• Provide quiet study environment during theory preparation
• Celebrate achievements in practical projects to maintain motivation
• Monitor progress monthly and adjust strategies as needed

---

**Generated by:** EduBridge Parent Portal
**Confidentiality:** This report is confidential and intended only for authorized parents/guardians.`;
};

// 9. Parent Report
export const generateParentReport = async (studentName: string, stats: string): Promise<string> => {
    try {
        // Fast fallback if API key is not available
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock parent report.');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getMockParentReport(studentName, stats);
        }

        const prompt = `
            Create a detailed, formal student progress report for ${studentName}. 
            Student Statistics: ${stats}
            
            Format: Clean Markdown sections with clear headers.
            Include:
            - Academic Performance (grades, attendance, projects)
            - Behavioral Assessment (engagement, strengths, areas for improvement)
            - Strategic Recommendations (immediate actions and long-term goals)
            
            Make it professional, comprehensive, and suitable for converting to a Word document.
            Use bullet points and clear sections.
        `;

        // Add timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Report generation timeout')), 10000) // 10 second timeout
        );

        const apiPromise = ai.models.generateContent({
            model: modelFlash,
            contents: [{ text: prompt }]
        });

        const response = await Promise.race([apiPromise, timeoutPromise]) as any;
        return response.text || getMockParentReport(studentName, stats);
    } catch (error) {
        console.error("Parent report generation error:", error);
        // Return mock data on error for fast fallback
        return getMockParentReport(studentName, stats);
    }
};

// Mock evaluation data for fallback
const getMockEvaluation = (professor: string, institute: string, domain: string, prerequisites: string[]): any => {
    // Random probability between 20-85 for demo
    const probability = Math.floor(Math.random() * 65) + 20;
    const isAccepted = probability > 60;
    
    return {
        selectionProbability: probability,
        decision: isAccepted ? 'Accept' : 'Reject',
        feedback: isAccepted 
            ? `Congratulations! Your application shows strong alignment with ${domain} requirements. You demonstrate solid understanding of ${prerequisites.slice(0, 2).join(' and ')}. Professor ${professor} from ${institute} finds your profile suitable for this research opportunity. Please proceed with the next steps.`
            : `Thank you for your interest in the ${domain} program at ${institute}. While your application shows promise, there are gaps in the required prerequisites, particularly in ${prerequisites.slice(0, 2).join(' and ')}. Professor ${professor} recommends strengthening these areas before reapplying. Consider relevant projects or courses to enhance your profile.`
    };
};

// 10. Scholar
export const evaluateScholarApplication = async (
    resumeInput: { content: string, mimeType: string }, 
    professor: string, 
    institute: string, 
    domain: string, 
    prerequisites: string[]
): Promise<any> => {
    try {
        // Use mock data if API is not available
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock evaluation data.');
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getMockEvaluation(professor, institute, domain, prerequisites);
        }

        const systemPrompt = `
            Act as Professor ${professor} from ${institute}. You are evaluating applications for a "${domain}" research internship.
            Required Prerequisites: ${prerequisites.join(", ")}.
            
            Analyze the resume thoroughly and provide:
            1. selectionProbability (0-100): How likely is this candidate to be selected?
            2. feedback: Detailed, constructive feedback (2-3 sentences) explaining your decision
            3. decision: "Accept" if probability > 60, "Reject" if probability <= 60
            
            Be realistic and consider:
            - Match with prerequisites
            - Relevant projects/experience
            - Academic performance
            - Potential for research contribution
            
            Return JSON with selectionProbability, feedback, and decision.
        `;
        
        const contents: any[] = [{ text: systemPrompt }];
        if (resumeInput.mimeType === 'application/pdf') {
             contents.push({
                 inlineData: {
                     mimeType: resumeInput.mimeType,
                     data: resumeInput.content
                 }
             });
        } else {
             contents.push({ text: `Resume Content:\n${resumeInput.content}` });
        }
        
        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        selectionProbability: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        decision: { type: Type.STRING }
                    }
                }
            }
        });
        
        const result = JSON.parse(response.text || '{}');
        
        // Validate response
        if (!result.selectionProbability && result.selectionProbability !== 0) {
            throw new Error('Invalid response from API');
        }
        
        return result;
    } catch (error: any) {
        console.error("Scholar Evaluation Error", error);
        // Return mock data on error instead of failing
        if (error.message?.includes('API key') || error.message?.includes('INVALID_ARGUMENT')) {
            return getMockEvaluation(professor, institute, domain, prerequisites);
        }
        // Return mock data as fallback
        return getMockEvaluation(professor, institute, domain, prerequisites);
    }
}

// 11. Emotion Analysis with LLM + RAG
export const analyzeEmotionWithLLM = async (expressionData: any): Promise<string> => {
    try {
        if (!ai || !apiKey || apiKey === 'your_api_key_here') {
            console.warn('API key not configured. Using mock emotion analysis.');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getMockEmotionAnalysis(expressionData);
        }

        const { expressions, stats, dominantExpression, notesContent } = expressionData;

        const prompt = `
            You are an AI emotion analysis expert. A user has been reading educational notes and their facial expressions were analyzed.
            
            CONTEXT:
            - Notes Content: ${notesContent.substring(0, 500)}...
            - Dominant Expression: ${dominantExpression}
            - Detection Samples: ${expressions.length} detections captured
            - Expression Statistics: ${JSON.stringify(stats)}
            
            TASK: Provide a comprehensive emotional engagement analysis based on the facial expression data.
            
            Include:
            1. Overall Engagement Level (High/Medium/Low)
            2. Learning Comprehension Assessment
            3. Emotional State During Learning
            4. Focus & Attention Analysis
            5. Recommendations for Better Learning
            
            Format as a detailed report with clear sections and actionable insights.
        `;

        const response = await ai.models.generateContent({
            model: modelFlash,
            contents: [{ text: prompt }]
        });

        return response.text || getMockEmotionAnalysis(expressionData);
    } catch (error) {
        console.error('Emotion analysis error:', error);
        // Return mock data on error
        return getMockEmotionAnalysis(expressionData);
    }
};

// Mock emotion analysis report
const getMockEmotionAnalysis = (data: any): string => {
    const { stats, dominantExpression } = data;
    const totalDetections = Object.values(stats).reduce((a: number, b: number) => a + b, 0) as number;
    const engagementLevel = stats.happy > totalDetections * 0.3 ? 'High' : stats.dull > totalDetections * 0.4 ? 'Low' : 'Medium';

    return `## Emotion Analysis Report

### 🎯 Overall Engagement Assessment
**Engagement Level:** ${engagementLevel}

Your facial expressions during the learning session indicate a **${engagementLevel}** level of engagement with the study material. The analysis is based on ${totalDetections} face detection samples over the duration of your study session.

### 😊 Emotional State Analysis

**Dominant Expression:** ${dominantExpression}

Expression Breakdown:
• **Happy:** ${stats.happy} detections (${((stats.happy / totalDetections) * 100).toFixed(1)}%) - Shows positive engagement
• **Neutral:** ${stats.neutral} detections (${((stats.neutral / totalDetections) * 100).toFixed(1)}%) - Passive observation
• **Focused/Dull:** ${stats.dull} detections (${((stats.dull / totalDetections) * 100).toFixed(1)}%) - Indicates concentration
• **Sad/Frustrated:** ${stats.sad} detections (${((stats.sad / totalDetections) * 100).toFixed(1)}%) - Potential difficulty areas
• **Angry:** ${stats.angry} detections (${((stats.angry / totalDetections) * 100).toFixed(1)}%) - Frustration signals
• **Surprised:** ${stats.surprised} detections (${((stats.surprised / totalDetections) * 100).toFixed(1)}%) - Discovery moments
• **Fearful:** ${stats.fearful} detections (${((stats.fearful / totalDetections) * 100).toFixed(1)}%) - Anxiety indicators
• **Disgusted:** ${stats.disgusted} detections (${((stats.disgusted / totalDetections) * 100).toFixed(1)}%) - Negative reactions

### 🧠 Learning Comprehension Assessment

Based on your emotional responses:
• Your **${dominantExpression} expression dominance** suggests ${dominantExpression === 'happy' ? 'good comprehension and interest in the material' : 'potential challenges with content understanding'}
• ${stats.happy > stats.sad ? 'Positive emotional states outweigh negative responses, indicating good learning momentum' : 'Mixed emotional responses suggest some challenging topics'}
• The **focus detected in ${stats.dull > stats.happy ? 'concentrated observation' : 'active engagement'} phases** shows your learning style

### 📊 Focus & Attention Patterns

• **Active Engagement Moments:** ${stats.happy} instances
• **Deep Focus Periods:** ${stats.dull} instances  
• **Challenge/Frustration Points:** ${stats.sad + stats.angry} instances
• **Surprise/Learning Peaks:** ${stats.surprised} instances

This suggests you are **${stats.happy + stats.surprised > totalDetections * 0.4 ? 'actively engaging with the material' : 'passively consuming the material'}**.

### 💡 Recommendations for Better Learning

1. **Content Difficulty:** ${stats.sad + stats.angry > totalDetections * 0.3 ? 'Consider breaking down complex topics into smaller chunks' : 'Continue with current pace, material difficulty seems appropriate'}

2. **Focus Improvement:** ${stats.dull > totalDetections * 0.5 ? 'You are showing strong concentration - maintain this study environment' : 'Try reducing distractions to improve focus'}

3. **Emotional Well-being:** ${stats.happy > totalDetections * 0.3 ? 'Great! Maintain the positive emotional state during studies' : 'Take regular breaks to maintain positive emotional engagement'}

4. **Learning Strategy:** 
   - Revisit topics that triggered frustration (${stats.sad + stats.angry} detections)
   - Practice retrieval on topics that showed surprise (${stats.surprised} detections)
   - Reinforce happy/engaged learning moments with similar content

5. **Study Environment:** {{stats.sad > stats.happy ? 'Your study environment may need optimization - ensure proper lighting and minimal interruptions' : 'Your study environment appears conducive to learning'}}

### 🎓 Next Steps

• **Review Challenging Topics:** Focus on areas where you showed frustrated expressions
• **Practice More:** Increase practice on topics that triggered engagement peaks
• **Break Strategy:** Take 10-minute breaks after every 50 minutes of focused study
• **Monitor Progress:** Use regular emotion tracking to optimize your learning approach

---

*Report Generated: ${new Date().toLocaleString()}*
*Analysis Type: Facial Expression Recognition with Computer Vision & LLM Analysis*`;
};

// Generate emotion report as downloadable HTML
export const generateEmotionReport = async (reportData: any): Promise<string> => {
    try {
        const { expressions, stats, analysis, notesContent } = reportData;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Emotion Analysis Report - ${new Date().toLocaleDateString()}</title>
                <style>
                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.8;
                        color: #1e293b;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        background: white;
                    }
                    h1 {
                        color: #4f46e5;
                        border-bottom: 3px solid #4f46e5;
                        padding-bottom: 15px;
                        margin-bottom: 30px;
                        font-size: 28px;
                    }
                    h2 {
                        color: #6366f1;
                        margin-top: 30px;
                        margin-bottom: 15px;
                        font-size: 20px;
                        border-left: 4px solid #6366f1;
                        padding-left: 15px;
                    }
                    h3 {
                        color: #818cf8;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        font-size: 16px;
                    }
                    ul, ol {
                        margin: 15px 0;
                        padding-left: 35px;
                    }
                    li {
                        margin: 8px 0;
                        line-height: 1.7;
                    }
                    .stat-box {
                        background: #f1f5f9;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 10px 0;
                        border-left: 4px solid #4f46e5;
                    }
                    .recommendation {
                        background: #fef3c7;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 10px 0;
                        border-left: 4px solid #f59e0b;
                    }
                    .header-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                    }
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 2px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 12px;
                    }
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>📊 Emotion Analysis Report</h1>
                
                <div class="header-info">
                    <div><strong>Report Date:</strong> ${new Date().toLocaleString()}</div>
                    <div><strong>Total Detections:</strong> ${expressions.length}</div>
                </div>

                <h2>Analysis Overview</h2>
                <div class="stat-box">
                    <p>${analysis}</p>
                </div>

                <h2>Statistics Summary</h2>
                <ul>
                    ${Object.entries(stats).map(([emotion, count]) => `
                        <li><strong>${emotion}:</strong> ${count} detections</li>
                    `).join('')}
                </ul>

                <h2>Detailed Analysis</h2>
                <p>The facial expression analysis provides insights into emotional engagement during the learning session.</p>
                
                <h3>Key Findings</h3>
                <ul>
                    <li>Comprehensive emotion tracking captured ${expressions.length} face expressions</li>
                    <li>Analysis includes multiple emotion categories: happy, sad, angry, dull, surprised, fearful, disgusted, and neutral</li>
                    <li>Results provide actionable insights for improving learning effectiveness</li>
                </ul>

                <div class="recommendation">
                    <h3>Recommendations</h3>
                    <ul>
                        <li>Review the detailed analysis above for personalized recommendations</li>
                        <li>Use emotion tracking data to optimize study sessions</li>
                        <li>Take regular breaks to maintain positive emotional engagement</li>
                        <li>Focus on challenging topics that triggered negative expressions</li>
                    </ul>
                </div>

                <div class="footer">
                    <p>Generated by EduBridge Emotion Analysis System</p>
                    <p>Using Computer Vision & LLM Technology</p>
                    <p>Report Date: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        return htmlContent;
    } catch (error) {
        console.error('Report generation error:', error);
        return '<h1>Error generating report</h1>';
    }
};
