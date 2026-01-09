// Test script for AI services
const duplicateChecker = require('../ai/duplicateCheck');
const eventClassifier = require('../ai/classifyEvent');
const eventModerator = require('../ai/moderateEvent');
const eventSummarizer = require('../ai/summarizeEvent');

async function testAI() {
  console.log('Testing AI Services...\n');

  // Test Duplicate Checker
  console.log('=== Testing Duplicate Checker ===');
  const newEvent = {
    title: "Rock Concert 2023",
    description: "Amazing rock concert with popular bands",
    latitude: 40.7128,
    longitude: -74.0060,
    date: new Date("2023-12-15T20:00:00Z")
  };
  
  const existingEvents = [
    {
      _id: "1",
      title: "Rock Festival 2023",
      description: "Awesome rock festival with famous bands",
      locationCoords: {
        coordinates: [-74.0060, 40.7128]
      },
      date: new Date("2023-12-15T19:30:00Z")
    }
  ];
  
  const duplicates = await duplicateChecker.checkForDuplicates(newEvent, existingEvents);
  console.log('Duplicate check result:', duplicates);
  console.log();

  // Test Event Classifier
  console.log('=== Testing Event Classifier ===');
  const title = "Jazz Night at Blue Note";
  const description = "Experience smooth jazz with talented musicians at the famous Blue Note club";
  
  const category = await eventClassifier.classifyEvent(title, description);
  const confidence = eventClassifier.getClassificationConfidence(title, description, category);
  
  console.log('Classification result:', category);
  console.log('Confidence score:', confidence);
  console.log();

  // Test Event Moderator
  console.log('=== Testing Event Moderator ===');
  const moderatedTitle = "AMAZING SALE!!! CLICK HERE NOW!!!";
  const moderatedDescription = "Get rich quick with this miracle cure! Limited time offer!";
  
  const moderationResult = await eventModerator.moderateEvent(moderatedTitle, moderatedDescription);
  console.log('Moderation result:', JSON.stringify(moderationResult, null, 2));
  console.log();

  // Test Event Summarizer
  console.log('=== Testing Event Summarizer ===');
  const summaryTitle = "Annual Tech Conference 2023";
  const summaryDescription = "Join us for the biggest tech conference of the year. Featuring keynote speakers from leading companies, hands-on workshops, networking opportunities, and cutting-edge technology demonstrations. Learn about artificial intelligence, blockchain, cloud computing, and more. Register now to secure your spot!";
  
  const summaryResult = await eventSummarizer.summarizeEvent(summaryTitle, summaryDescription);
  console.log('Summary result:', JSON.stringify(summaryResult, null, 2));
  console.log();

  console.log('AI Services Test Completed!');
}

// Run the test
testAI().catch(console.error);