const duplicateChecker = require("./src/ai/duplicateCheck");

// Test events
const testEvents = [
  {
    _id: "1",
    title: "Tech Conference 2025",
    description:
      "Annual technology conference featuring the latest innovations",
    locationCoords: {
      coordinates: [-0.1278, 51.5074], // [longitude, latitude]
    },
    date: new Date().toISOString(),
  },
  {
    _id: "2",
    title: "Music Festival",
    description: "Three-day music festival with local artists",
    locationCoords: {
      coordinates: [-0.1195, 51.5034],
    },
    date: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    _id: "3",
    title: "Art Workshop",
    description: "Learn watercolor painting techniques",
    locationCoords: {
      coordinates: [-0.1278, 51.5136],
    },
    date: new Date(Date.now() + 172800000).toISOString(),
  },
];

console.log("=== Duplicate Detection Test Suite ===\n");

// Test 1: Exact duplicate
async function testExactDuplicate() {
  console.log("Test 1: Exact Duplicate Detection");
  const newEvent = {
    title: "Tech Conference 2025",
    description: "Annual technology conference with latest innovations",
    latitude: 51.5074,
    longitude: -0.1278,
    date: new Date().toISOString(),
  };

  const duplicates = await duplicateChecker.checkForDuplicates(
    newEvent,
    testEvents
  );
  console.log("Results:", JSON.stringify(duplicates, null, 2));
  console.log("Expected: High similarity score (>0.9)\n");
}

// Test 2: Different event
async function testDifferentEvent() {
  console.log("Test 2: Different Event Detection");
  const newEvent = {
    title: "Cooking Class",
    description: "Learn to cook Italian pasta dishes",
    latitude: 51.5074,
    longitude: -0.1278,
    date: new Date().toISOString(),
  };

  const duplicates = await duplicateChecker.checkForDuplicates(
    newEvent,
    testEvents
  );
  console.log("Results:", JSON.stringify(duplicates, null, 2));
  console.log("Expected: Low or no similarity scores\n");
}

// Test 3: Similar event in different location
async function testSimilarEventDifferentLocation() {
  console.log("Test 3: Similar Event in Different Location");
  const newEvent = {
    title: "Tech Conference 2025",
    description:
      "Annual technology conference featuring the latest innovations",
    latitude: 40.7128, // New York
    longitude: -74.006,
    date: new Date().toISOString(),
  };

  const duplicates = await duplicateChecker.checkForDuplicates(
    newEvent,
    testEvents
  );
  console.log("Results:", JSON.stringify(duplicates, null, 2));
  console.log("Expected: Lower similarity due to distance\n");
}

// Test 4: Similar event at different time
async function testSimilarEventDifferentTime() {
  console.log("Test 4: Similar Event at Different Time");
  const newEvent = {
    title: "Tech Conference 2025",
    description:
      "Annual technology conference featuring the latest innovations",
    latitude: 51.5074,
    longitude: -0.1278,
    date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days later
  };

  const duplicates = await duplicateChecker.checkForDuplicates(
    newEvent,
    testEvents
  );
  console.log("Results:", JSON.stringify(duplicates, null, 2));
  console.log("Expected: Lower similarity due to time difference\n");
}

async function runAllTests() {
  await testExactDuplicate();
  await testDifferentEvent();
  await testSimilarEventDifferentLocation();
  await testSimilarEventDifferentTime();

  console.log("=== Test Suite Complete ===");
}

runAllTests();
