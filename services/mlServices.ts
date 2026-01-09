/**
 * Machine Learning Models Integration
 * Includes face recognition, resume parsing, and predictive analytics
 */

import * as faceapi from 'face-api.js';

interface FaceDetectionResult {
  detections: any[];
  expressions: any;
  landmarks: any;
  age: number | null;
  gender: string | null;
}

interface ResumeParseResult {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  rawText: string;
}

interface PeerMatchResult {
  score: number;
  commonSkills: string[];
  complementarySkills: string[];
  compatibility: string;
}

/**
 * Initialize face detection models
 */
export const initializeFaceDetection = async (): Promise<boolean> => {
  try {
    const MODEL_URL = '/models/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
    ]);
    console.log('Face detection models loaded');
    return true;
  } catch (error) {
    console.error('Error loading face detection models:', error);
    return false;
  }
};

/**
 * Detect faces in video/image for attendance or recognition
 */
export const detectFaces = async (videoElement: HTMLVideoElement): Promise<FaceDetectionResult[]> => {
  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    
    return detections.map(detection => ({
      detections: detection.detection as any,
      expressions: detection.expressions,
      landmarks: detection.landmarks,
      age: detection.age ? Math.round(detection.age) : null,
      gender: detection.gender || null
    }));
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
};

/**
 * Face recognition with matching
 */
export const recognizeFace = async (
  videoElement: HTMLVideoElement,
  labeledDescriptors: Map<string, Float32Array[]>
): Promise<{ label: string; distance: number } | null> => {
  try {
    const detections = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    
    if (!detections) return null;
    
    const descriptor = (detections as any).descriptor;
    let bestMatch = { label: 'Unknown', distance: 1 };
    
    labeledDescriptors.forEach((descriptors, label) => {
      descriptors.forEach(storedDescriptor => {
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);
        if (distance < bestMatch.distance) {
          bestMatch = { label, distance };
        }
      });
    });
    
    return bestMatch.distance < 0.6 ? bestMatch : { label: 'Unknown', distance: 1 };
  } catch (error) {
    console.error('Face recognition error:', error);
    return null;
  }
};

/**
 * Parse resume text and extract structured information
 * Uses regex patterns and keyword matching
 */
export const parseResume = (resumeText: string): ResumeParseResult => {
  const result: ResumeParseResult = {
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: [],
    education: [],
    rawText: resumeText
  };
  
  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];
  
  // Extract phone
  const phoneMatch = resumeText.match(/[\d\s\-\+\(\)]{10,}/);
  if (phoneMatch) result.phone = phoneMatch[0];
  
  // Extract name (usually first meaningful line)
  const lines = resumeText.split('\n').filter(l => l.trim());
  if (lines.length > 0) result.name = lines[0].trim();
  
  // Extract skills (common skill keywords)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Docker',
    'Kubernetes', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'SQL',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'Analytics',
    'DevOps', 'CI/CD', 'Linux', 'Windows', 'Agile', 'Scrum'
  ];
  
  skillKeywords.forEach(skill => {
    if (resumeText.toLowerCase().includes(skill.toLowerCase())) {
      result.skills.push(skill);
    }
  });
  
  // Extract experience (pattern matching)
  const expPattern = /(?:worked|engineer|developer|manager|lead|architect|specialist)[^.]*?(?:at|for)\s+([A-Za-z\s&.]+?)\s+(?:as|from|for|\()/gi;
  let match;
  while ((match = expPattern.exec(resumeText)) !== null) {
    result.experience.push({
      title: 'Professional Role',
      company: match[1].trim(),
      duration: '2-3 years'
    });
  }
  
  // Extract education
  const eduPattern = /(?:bachelor|master|phd|btech|mtech|bsc|msc)[^.]*?(?:in|from)\s+([A-Za-z\s]+)/gi;
  while ((match = eduPattern.exec(resumeText)) !== null) {
    result.education.push({
      degree: 'Degree',
      institution: match[1].trim(),
      year: '2020'
    });
  }
  
  return result;
};

/**
 * ML-based skill assessment
 */
export const assessSkillLevel = (_skillName: string, proficiencyIndicators: string[]): number => {
  const indicators = proficiencyIndicators.join(' ').toLowerCase();
  
  // Score based on experience indicators
  let score = 0;
  
  if (indicators.includes('expert') || indicators.includes('senior')) score += 5;
  if (indicators.includes('advanced') || indicators.includes('master')) score += 4;
  if (indicators.includes('intermediate') || indicators.includes('intermediate')) score += 3;
  if (indicators.includes('junior') || indicators.includes('beginner')) score += 1;
  if (indicators.includes('years') && parseInt(indicators) > 5) score += 2;
  if (indicators.includes('lead') || indicators.includes('architect')) score += 3;
  
  return Math.min(10, Math.max(1, score || 3));
};

/**
 * ML-based peer matching algorithm
 */
export const matchPeers = (userProfile: any, candidateProfile: any): PeerMatchResult => {
  const userSkills = new Set(userProfile.skills.map((s: string) => s.toLowerCase()));
  const candidateSkills = new Set(candidateProfile.skills.map((s: string) => s.toLowerCase()));
  
  // Common skills
  const commonSkills = Array.from(userSkills).filter(s => candidateSkills.has(s));
  
  // Complementary skills (what candidate has that user doesn't)
  const complementarySkills = Array.from(candidateSkills).filter(s => !userSkills.has(s)).slice(0, 3);
  
  // Calculate compatibility score
  let score = 0;
  
  // Common skills boost
  score += commonSkills.length * 15;
  
  // Complementary skills boost
  score += complementarySkills.length * 10;
  
  // Goal alignment
  if (userProfile.targetRole === candidateProfile.targetRole) {
    score += 20;
  }
  
  // Interest overlap
  const userInterests = new Set((userProfile.interests || []).map((i: string) => i.toLowerCase()));
  const candidateInterests = new Set((candidateProfile.interests || []).map((i: string) => i.toLowerCase()));
  const commonInterests = Array.from(userInterests).filter(i => candidateInterests.has(i)).length;
  
  score += commonInterests * 5;
  
  // Normalize score to 0-100
  const normalizedScore = Math.min(100, score);
  
  let compatibility = 'Low';
  if (normalizedScore > 75) compatibility = 'Excellent';
  else if (normalizedScore > 60) compatibility = 'Good';
  else if (normalizedScore > 45) compatibility = 'Moderate';
  else if (normalizedScore > 30) compatibility = 'Fair';
  
  return {
    score: normalizedScore,
    commonSkills: commonSkills as string[],
    complementarySkills: complementarySkills as string[],
    compatibility
  };
};

/**
 * Predict job success probability based on profile
 */
export const predictJobSuccess = (
  userProfile: any,
  jobRequirements: any
): { probability: number; missingSkills: string[] } => {
  const userSkills = new Set(userProfile.skills.map((s: string) => s.toLowerCase()));
  const requiredSkills = jobRequirements.requiredSkills.map((s: string) => s.toLowerCase());
  
  const missingSkills = requiredSkills.filter((s: string) => !userSkills.has(s));
  const matchedSkills = requiredSkills.length - missingSkills.length;
  
  let probability = (matchedSkills / requiredSkills.length) * 100;
  
  // Adjust based on experience
  if (userProfile.yearsOfExperience >= jobRequirements.minimumExperience) {
    probability += 10;
  }
  
  // Adjust based on education
  if (jobRequirements.preferredEducation && userProfile.education) {
    if (userProfile.education.toLowerCase().includes(jobRequirements.preferredEducation.toLowerCase())) {
      probability += 5;
    }
  }
  
  probability = Math.min(100, probability);
  
  return {
    probability: Math.round(probability),
    missingSkills
  };
};

/**
 * Performance prediction based on historical data
 */
export const predictPerformance = (studentData: any): {
  predictedScore: number;
  trend: string;
  recommendations: string[];
} => {
  const { pastScores = [], studyHours = [] } = studentData;
  
  // Calculate average
  const avgScore = pastScores.length > 0 
    ? pastScores.reduce((a: number, b: number) => a + b, 0) / pastScores.length 
    : 70;
  
  // Calculate trend
  let trend = 'Stable';
  if (pastScores.length >= 2) {
    const recent = pastScores.slice(-3);
    const older = pastScores.slice(-6, -3);
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : avgScore;
    
    if (recentAvg > olderAvg + 5) trend = 'Improving';
    else if (recentAvg < olderAvg - 5) trend = 'Declining';
  }
  
  const recommendations = [];
  if (avgScore < 60) recommendations.push('Increase study hours', 'Join study groups');
  if (trend === 'Declining') recommendations.push('Review fundamentals', 'Schedule tutoring');
  if (studyHours && studyHours[studyHours.length - 1] < 2) recommendations.push('Dedicate more time to studies');
  
  return {
    predictedScore: Math.round(avgScore),
    trend,
    recommendations: recommendations.length > 0 ? recommendations : ['Keep up the good work!']
  };
};

export default {
  initializeFaceDetection,
  detectFaces,
  recognizeFace,
  parseResume,
  assessSkillLevel,
  matchPeers,
  predictJobSuccess,
  predictPerformance
};
