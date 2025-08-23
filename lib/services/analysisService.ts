export interface DocumentAnalysis {
  acsMatches: string[];
  suggestions: string[];
  score: number;
  documentType?: string;
  confidence?: number;
  processingTime?: number;
  keyTopics?: string[];
  compliance?: {
    level: "excellent" | "good" | "fair" | "needs_improvement";
    details: string[];
  };
}

export interface AnalysisRequest {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string; // Base64 encoded content for real implementation
}

export class AnalysisService {
  private static readonly SIMULATION_DELAY_MS = 2000;

  static async analyzeDocument(request: AnalysisRequest): Promise<DocumentAnalysis> {
    // In production, this would make a real API call
    // For now, we simulate the analysis with realistic delays and results
    
    await new Promise(resolve => 
      setTimeout(resolve, this.SIMULATION_DELAY_MS + Math.random() * 2000)
    );

    return this.generateMockAnalysis(request);
  }

  private static generateMockAnalysis(request: AnalysisRequest): DocumentAnalysis {
    const { fileName, fileType } = request;
    
    // Base analysis template
    const baseAnalysis: DocumentAnalysis = {
      acsMatches: [],
      suggestions: [],
      score: 70 + Math.floor(Math.random() * 25), // 70-95
      confidence: 0.75 + Math.random() * 0.25, // 0.75-1.0
      processingTime: 2.5 + Math.random() * 2, // 2.5-4.5 seconds
      keyTopics: [],
      compliance: {
        level: "good",
        details: []
      }
    };

    // Customize based on file type
    if (fileType === "application/pdf") {
      return this.analyzePDF(baseAnalysis, fileName);
    }
    
    if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      return this.analyzeWordDocument(baseAnalysis, fileName);
    }
    
    if (fileType.includes("presentationml") || fileType.includes("ms-powerpoint")) {
      return this.analyzePresentation(baseAnalysis, fileName);
    }
    
    if (fileType === "text/plain") {
      return this.analyzeTextFile(baseAnalysis, fileName);
    }

    return this.analyzeGenericDocument(baseAnalysis, fileName);
  }

  private static analyzePDF(base: DocumentAnalysis, fileName: string): DocumentAnalysis {
    const lessonPlanKeywords = ["lesson", "plan", "objective", "standard"];
    const manualKeywords = ["manual", "procedure", "checklist", "reference"];
    const examKeywords = ["exam", "test", "quiz", "assessment"];

    let documentType = "Training Document";
    let acsMatches = ["PA.I.A.K1", "PA.I.B.K2", "PA.II.A.K1"];
    let keyTopics = ["Pre-flight Procedures", "Weather Systems", "Emergency Procedures"];
    let suggestions = [
      "Consider adding more visual aids to enhance understanding",
      "Include practical examples for better retention",
      "Add cross-references to related ACS codes"
    ];

    if (lessonPlanKeywords.some(keyword => fileName.toLowerCase().includes(keyword))) {
      documentType = "Lesson Plan";
      acsMatches = ["PA.I.A.K1", "PA.I.A.K2", "PA.I.B.K1", "PA.II.A.K1"];
      keyTopics = ["Learning Objectives", "Performance Standards", "Risk Management"];
      suggestions = [
        "Ensure learning objectives align with ACS standards",
        "Add time estimates for each lesson segment",
        "Include assessment criteria for student progress"
      ];
    } else if (manualKeywords.some(keyword => fileName.toLowerCase().includes(keyword))) {
      documentType = "Training Manual";
      acsMatches = ["PA.I.A.K1", "PA.I.B.K1", "PA.II.A.K1", "PA.III.A.K1", "PA.IV.A.K1"];
      keyTopics = ["Systems Knowledge", "Procedures", "Regulations", "Safety Protocols"];
      suggestions = [
        "Update references to current regulations",
        "Add troubleshooting sections",
        "Include revision tracking for updates"
      ];
    } else if (examKeywords.some(keyword => fileName.toLowerCase().includes(keyword))) {
      documentType = "Assessment Material";
      acsMatches = ["PA.I.A.K1", "PA.I.B.K2", "PA.II.A.K2"];
      keyTopics = ["Knowledge Testing", "Performance Evaluation"];
      suggestions = [
        "Ensure questions test practical application",
        "Include scenario-based problems",
        "Provide detailed explanations for answers"
      ];
    }

    return {
      ...base,
      documentType,
      acsMatches,
      keyTopics,
      suggestions,
      score: base.score + 5, // PDFs generally score higher due to formatting
      compliance: {
        level: "good",
        details: [
          "Document structure follows training standards",
          "Content appears comprehensive",
          "Professional formatting maintained"
        ]
      }
    };
  }

  private static analyzeWordDocument(base: DocumentAnalysis, _fileName: string): DocumentAnalysis {
    return {
      ...base,
      documentType: "Training Document",
      acsMatches: ["PA.I.A.K1", "PA.I.B.K1", "PA.II.A.K1"],
      keyTopics: ["Flight Training", "Student Progress", "Instructional Design"],
      suggestions: [
        "Convert to PDF for consistent formatting",
        "Add table of contents for navigation",
        "Include version control information",
        "Consider adding interactive elements"
      ],
      compliance: {
        level: "good",
        details: [
          "Content structure is logical",
          "Text formatting is consistent",
          "Document length appropriate for topic"
        ]
      }
    };
  }

  private static analyzePresentation(base: DocumentAnalysis, _fileName: string): DocumentAnalysis {
    return {
      ...base,
      documentType: "Training Presentation",
      acsMatches: ["PA.I.A.K1", "PA.I.B.K2", "PA.II.A.K1"],
      keyTopics: ["Visual Learning", "Key Concepts", "Student Engagement"],
      suggestions: [
        "Add speaker notes for instructors",
        "Include interactive elements or questions",
        "Ensure slide transitions support learning flow",
        "Consider adding animations for complex concepts"
      ],
      score: base.score - 5, // Presentations might score lower without context
      compliance: {
        level: "fair",
        details: [
          "Visual design supports learning objectives",
          "Content is appropriately chunked",
          "Could benefit from more detailed explanations"
        ]
      }
    };
  }

  private static analyzeTextFile(base: DocumentAnalysis, _fileName: string): DocumentAnalysis {
    return {
      ...base,
      documentType: "Study Notes",
      acsMatches: ["PA.I.A.K1", "PA.I.B.K1"],
      keyTopics: ["Study Material", "Reference Notes"],
      suggestions: [
        "Structure content with clear headings",
        "Add bullet points for key concepts",
        "Include examples and scenarios",
        "Consider converting to a formatted document"
      ],
      score: base.score - 10, // Plain text generally scores lower
      confidence: base.confidence! - 0.1, // Lower confidence for plain text
      compliance: {
        level: "needs_improvement",
        details: [
          "Content lacks structured formatting",
          "No visual hierarchy for information",
          "Would benefit from professional presentation"
        ]
      }
    };
  }

  private static analyzeGenericDocument(base: DocumentAnalysis, _fileName: string): DocumentAnalysis {
    return {
      ...base,
      documentType: "Training Material",
      acsMatches: ["PA.I.A.K1", "PA.II.A.K1"],
      keyTopics: ["General Training Content"],
      suggestions: [
        "Provide more context about document purpose",
        "Ensure content aligns with training objectives",
        "Consider adding supporting materials"
      ],
      compliance: {
        level: "fair",
        details: [
          "Document type not immediately clear",
          "Content appears relevant to training",
          "Could benefit from clearer structure"
        ]
      }
    };
  }

  static getComplianceColor(level?: string): string {
    switch (level) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-600";
      case "fair": return "text-yellow-600";
      case "needs_improvement": return "text-red-600";
      default: return "text-gray-600";
    }
  }

  static getComplianceDescription(level?: string): string {
    switch (level) {
      case "excellent": return "Exceeds training standards";
      case "good": return "Meets training standards";
      case "fair": return "Partially meets standards";
      case "needs_improvement": return "Requires significant improvement";
      default: return "Unknown compliance level";
    }
  }
}