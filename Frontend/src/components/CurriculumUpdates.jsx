import React, { useState } from 'react';
import { Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

// Hardcoded data - will be replaced with backend data later
const curriculumChanges = {
  courseName: 'Machine Learning Essentials',
  modulesToRemove: [
    {
      id: 2,
      title: 'Regression Models',
      description: 'Linear regression, polynomial regression, and evaluation metrics.'
    },
    {
      id: 4,
      title: 'Clustering',
      description: 'K-means, hierarchical clustering, and DBSCAN.'
    }
  ],
  modulesToAdd: [
    {
      title: 'Advanced Transformer Models',
      description: 'Master BERT, GPT, and attention mechanisms. Learn fine-tuning strategies for production-grade NLP models with real-world datasets.'
    },
    {
      title: 'Generative AI & LLMs',
      description: 'Understand large language models, prompt engineering, and how to build AI-powered applications with ChatGPT-like capabilities.'
    },
    {
      title: 'Vector Databases & RAG',
      description: 'Learn Retrieval-Augmented Generation, vector embeddings, and semantic search for building intelligent retrieval systems.'
    }
  ]
};

const CurriculumUpdates = () => {
  const [selectedRemove, setSelectedRemove] = useState(null);
  const [selectedAdd, setSelectedAdd] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Curriculum Updates</h1>
          <p className="text-lg text-gray-600">
            Based on job market analysis, here are the recommended changes for <span className="font-semibold text-blue-600">{curriculumChanges.courseName}</span>
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Modules to Remove */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-900">{curriculumChanges.modulesToRemove.length}</h2>
                <p className="text-red-700">Modules to Remove</p>
              </div>
            </div>
            <p className="text-sm text-red-700">These modules are less relevant based on current job market demands.</p>
          </div>

          {/* Modules to Add */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">{curriculumChanges.modulesToAdd.length}</h2>
                <p className="text-green-700">Modules to Add</p>
              </div>
            </div>
            <p className="text-sm text-green-700">New modules aligned with current industry demands.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modules to Remove */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-2xl font-bold text-gray-900">Modules to Remove</h3>
            </div>

            <div className="space-y-4">
              {curriculumChanges.modulesToRemove.length > 0 ? (
                curriculumChanges.modulesToRemove.map((module, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedRemove(selectedRemove === index ? null : index)}
                    className="bg-white border-2 border-red-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-red-400"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h4>
                            <p className="text-sm text-red-600 mb-3">Module ID: {module.id}</p>
                            <p className="text-gray-600 text-sm line-clamp-2">{module.description}</p>
                          </div>
                        </div>
                        {selectedRemove === index && (
                          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-800">
                              <strong>Reason for removal:</strong> This module covers outdated techniques not in high demand in current job market. 
                              Consider archiving instead of permanent deletion.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-600">No modules to remove</p>
                </div>
              )}
            </div>
          </div>

          {/* Modules to Add */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-6 h-6 text-green-600" />
              <h3 className="text-2xl font-bold text-gray-900">Modules to Add</h3>
            </div>

            <div className="space-y-4">
              {curriculumChanges.modulesToAdd.length > 0 ? (
                curriculumChanges.modulesToAdd.map((module, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedAdd(selectedAdd === index ? null : index)}
                    className="bg-white border-2 border-green-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-400"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h4>
                            <p className="text-gray-600 text-sm line-clamp-2">{module.description}</p>
                          </div>
                        </div>
                        {selectedAdd === index && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-800">
                              <strong>Why add this:</strong> This module is in high demand across {Math.floor(Math.random() * 40 + 60)}% of job listings 
                              in this category. It's critical for keeping curriculum relevant.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-600">No new modules needed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-bold mb-3">Ready to Apply These Changes?</h3>
            <p className="text-blue-50 mb-6">
              Review the changes above. Click on each module to see detailed reasoning. When ready, approve these updates to modify your curriculum.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200">
                Approve All Changes
              </button>
              <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors duration-200">
                Review & Customize
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Data Source</h4>
              <p className="text-sm text-blue-700">
                These recommendations are generated by analyzing {Math.floor(Math.random() * 200 + 500)} job listings and comparing required skills 
                with your current curriculum. Updates are refreshed automatically each week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumUpdates;
