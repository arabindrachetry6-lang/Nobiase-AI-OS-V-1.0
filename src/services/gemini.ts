import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiService = {
  async generateSEOSuggestions(keyword: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Use Google Search to identify current trending topics and search trends for a business in the {{${keyword}}} niche. 
      Generate 20 keyword ideas based on these live trends. 
      For the seed keyword {{${keyword}}}, provide a JSON object including 'Keyword', 'Intent', and 'Content Idea'.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an expert SEO strategist specializing in SMB growth. 
        Your goal is to identify high-intent, low-cost organic growth opportunities.
        
        STRICT RULES:
        1. Always output in valid JSON format.
        2. Do not include any conversational filler.
        3. Use Google Search to validate trends and search volume estimates.
        4. For each keyword, provide:
           - 'keyword': The suggested phrase.
           - 'intent': Search intent (Informational, Transactional, Navigational, Commercial).
           - 'contentIdea': A brief content strategy for this keyword.
           - 'volume': Estimated monthly search volume (use Google Search data for more realistic estimates).
           - 'difficulty': Ranking difficulty (low, medium, or high).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              intent: { type: Type.STRING },
              contentIdea: { type: Type.STRING },
              volume: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["keyword", "intent", "contentIdea", "volume", "difficulty"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async scoreLead(contactInfo: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Score this lead from 0 to 100 based on the following info: "${contactInfo}". Provide a short reason. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async categorizeReceipt(receiptText: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this receipt text and extract total amount: "${receiptText}". Categories: Food, Travel, Office, Utilities, Marketing, Other. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            merchant: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async screenResume(resumeText: string, jobDescription: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Screen this resume against the job description. Resume: "${resumeText}". Job: "${jobDescription}". Provide a match percentage and 3 key strengths. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchPercentage: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async chat(message: string, context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nUser: ${message}`,
      config: {
        systemInstruction: `You are the brain of NOBIASE AI OS. You have access to the following schemas: Marketing_SMS, Marketing_Events, Marketing_Surveys, Finance_Accounting, Finance_Expenses, Finance_Invoices, Inventory_Management, Product_Lifecycle, and HRM_Recruitment.
        
        When a user asks a marketing, finance, inventory, or HRM-related question or wants to perform an action in these sections, you must generate a response that includes a JSON object for the frontend to interpret.
        
        JSON Structure:
        {
          "type": "navigation",
          "target": "marketing" | "finance" | "inventory" | "hrm",
          "tab": string, (e.g., "sms", "events", "surveys", "accounting", "expenses", "invoices", "stock", "plm", "recruitment", "employees", "id-maker")
          "prefill": {
            "content": string,
            "title": string,
            "date": string,
            "goal": string,
            "amount": number,
            "description": string,
            "client": string,
            "productName": string,
            "sku": string,
            "location": string,
            "jobTitle": string,
            "employeeName": string
          },
          "message": "A helpful conversational response to the user"
        }
        
        If the request is NOT related to these specific tools, just provide a normal text response.
        
        CRITICAL: You must respond in the SAME LANGUAGE as the user's message. 
        Supported languages: English, Hindi (हिन्दी), Bangla (বাংলা), Nepali (नेपाली), German (Deutsch).
        
        Always maintain a professional, helpful, and high-energy tone.
        
        Example User Request: "Can I afford a new laptop?"
        Your Response: { "type": "navigation", "target": "finance", "tab": "accounting", "message": "Based on your current burn rate and expected revenue from outstanding invoices, you have a healthy cash flow. You can afford a new laptop up to $1,500 while maintaining your safety margin." }`
      }
    });
    return response.text;
  },

  async categorizeTransaction(description: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this transaction description into a standard Chart of Accounts category: "${description}". Categories: Assets, Liabilities, Equity, Revenue, Expenses (Software, Rent, Salary, Marketing, Utilities, Travel, Other).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["category", "subCategory"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async analyzeFinancialHealth(plData: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following 3-month P&L data and provide a 3-sentence summary of cash flow health: "${plData}"`,
      config: {
        systemInstruction: "You are a senior financial analyst. Provide a concise, data-backed summary of financial health."
      }
    });
    return response.text;
  },

  async extractReceiptData(imageUri: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: "You are an OCR expert. Extract the following data from this receipt image: vendor, date, total_amount, tax_amount, currency, category. Only output valid JSON." },
        { inlineData: { mimeType: "image/jpeg", data: imageUri } } // Assuming base64 data for simplicity in this context
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor: { type: Type.STRING },
            date: { type: Type.STRING },
            total_amount: { type: Type.NUMBER },
            tax_amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["vendor", "total_amount", "currency"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateInvoiceReminder(clientName: string, amount: number, dueDate: string, history: 'new' | 'regular') {
    const tone = history === 'new' ? 'Formal' : 'Friendly';
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a ${tone} but firm reminder email for an overdue invoice of $${amount} for client ${clientName}. Due date was ${dueDate}.`,
      config: {
        systemInstruction: "You are a professional accounts receivable manager. Your goal is to ensure payment while maintaining a good relationship."
      }
    });
    return response.text;
  },

  async detectFraud(receiptData: any, existingExpenses: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Check if this receipt is a duplicate or shows signs of fraud based on existing expenses. New Receipt: ${JSON.stringify(receiptData)}. Existing: ${JSON.stringify(existingExpenses)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFraud: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["isFraud", "reason"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateChatbotWidget(config: { name: string, persona: string, mission: string, knowledgeBase: string, grounding: boolean }) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a production-ready JavaScript snippet to embed an AI chatbot on a website.
      
      Bot Configuration:
      - Name: ${config.name}
      - Persona: ${config.persona}
      - Mission: ${config.mission}
      - Knowledge Base: ${config.knowledgeBase}
      - Google Search Grounding: ${config.grounding ? 'Enabled' : 'Disabled'}
      
      The output should be a <script> tag that initializes a floating chat widget. 
      Include a placeholder for the API key and mention that it should be protected via a proxy server.
      The widget should be styled with Tailwind-like CSS (inline or injected).`,
      config: {
        systemInstruction: "You are a senior full-stack engineer. Generate clean, secure, and well-documented integration code for an AI chatbot widget. Follow the CLEAR framework for engineering and adaptation."
      }
    });
    return response.text;
  },

  async processCRMData(rawData: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Process the following unstructured customer data: "${rawData}"`,
      config: {
        systemInstruction: `You are the AI Core of an Advanced CRM designed for a medium-sized enterprise. Your goal is to process unstructured customer data into structured business intelligence.
        Capabilities:
         * Data Structuring: Extract names, companies, deal values, and sentiment from raw email text or meeting transcripts.
         * Lead Scoring: Assign a score (1-100) based on intent, budget, and authority.
         * Proactive Actions: Recommend the next step for a salesperson (e.g., "Schedule demo," "Send pricing proposal").
         * Formatting: Always output data in structured JSON format so it can be sent to a database via API.
        Constraint:
         * Never guess data. If info is missing, flag it as "Unknown".
         * Follow GDPR and privacy-first principles.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            company: { type: Type.STRING },
            dealValue: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            leadScore: { type: Type.NUMBER },
            intent: { type: Type.STRING },
            budget: { type: Type.STRING },
            authority: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["name", "company", "dealValue", "sentiment", "leadScore", "recommendedAction"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async rewriteSMS(text: string, targetLanguage: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rewrite the following SMS message for high conversion in ${targetLanguage}: "${text}". Keep it concise and impactful.`,
      config: {
        systemInstruction: "You are an expert copywriter specializing in SMS marketing. Your goal is to maximize click-through rates and engagement while maintaining a professional and high-energy tone."
      }
    });
    return response.text;
  },

  async predictBestSendTime(lastPurchaseDate: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the last purchase date of ${lastPurchaseDate}, predict the best hour of the day to send a marketing SMS to this customer for maximum engagement. Return only the hour (0-23) and a brief reason.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hour: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["hour", "reason"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateEventInvite(eventDetails: string, type: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a professional and exciting invite copy for a ${type} event with these details: "${eventDetails}". Provide both an Email and an SMS version.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            sms: { type: Type.STRING }
          },
          required: ["email", "sms"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateSurveyFlow(goal: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a 5-question survey flow based on this goal: "${goal}". Each question should have a type (multiple-choice, text, or rating) and options if applicable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["multiple-choice", "text", "rating"] },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["question", "type"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async analyzeSurveyResults(responses: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these survey responses and provide a list of key takeaways: ${JSON.stringify(responses)}`,
      config: {
        systemInstruction: "You are a data analyst. Extract actionable insights and key trends from survey responses."
      }
    });
    return response.text;
  },

  async forecastDemand(salesData: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following 30-day sales data and predict stock-out dates for each SKU based on sales velocity. Sales Data: ${JSON.stringify(salesData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sku: { type: Type.STRING },
              predictedStockOutDate: { type: Type.STRING },
              velocity: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER }
            },
            required: ["sku", "predictedStockOutDate", "velocity"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  async draftPurchaseOrder(lowStockItems: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a professional Purchase Order email to suppliers for the following low-stock items: ${JSON.stringify(lowStockItems)}. Include historical pricing context if possible.`,
    });
    return response.text;
  },

  async analyzeProductIdea(description: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a Product Strategist. Analyze this product idea: "${description}". Generate a 'Market Fit' report, suggested pricing, and a list of potential competitors.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketFit: { type: Type.STRING },
            suggestedPricing: { type: Type.STRING },
            competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["marketFit", "suggestedPricing", "competitors"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateProductCopy(productName: string, specs: string, languages: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate SEO-optimized product descriptions for ${productName} with these specs: ${specs}. Provide copy in these languages: ${languages.join(', ')}.`,
    });
    return response.text;
  },

  async adviseProductRetirement(salesData: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze sales decay for these mature products and suggest a 'Retirement Date' or a 'Flash Sale' strategy to clear remaining stock. Data: ${JSON.stringify(salesData)}`,
    });
    return response.text;
  },

  async generateJobDescription(jobTitle: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a professional and comprehensive Job Description for the role of "${jobTitle}". Include Responsibilities, Requirements, and Benefits.`,
    });
    return response.text;
  },

  async rankResume(resumeText: string, jobDescription: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rank this resume against the job description. Resume: "${resumeText}". Job: "${jobDescription}". Return a JSON object with fit_score (0-100), pros, cons, and 3 interview questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fit_score: { type: Type.NUMBER },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            interview_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["fit_score", "pros", "cons", "interview_questions"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async draftInterviewInvite(candidateName: string, fitScore: number, recruiterAvailability: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a personalized interview invite email for ${candidateName} who has a fit score of ${fitScore}/100. Recruiter availability: ${recruiterAvailability}.`,
    });
    return response.text;
  },

  async synthesizePerformance(feedbackNotes: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthesize these quarterly feedback notes into a one-paragraph 'Performance Summary' and a 'Growth Plan'. Notes: ${JSON.stringify(feedbackNotes)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            growthPlan: { type: Type.STRING }
          },
          required: ["summary", "growthPlan"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async predictRetention(employeeData: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this employee data to predict retention risk. Data: ${JSON.stringify(employeeData)}. Consider last promotion, leave balance, and feedback sentiment. Return risk level (Low, Medium, High) and reason.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            reason: { type: Type.STRING }
          },
          required: ["riskLevel", "reason"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async analyzeIDPhoto(imageUri: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: "Analyze this photo for a professional employee ID. Is it a clear face shot with a neutral background? Return a JSON object with 'isProfessional' (boolean) and 'feedback' (string)." },
        { inlineData: { mimeType: "image/jpeg", data: imageUri } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isProfessional: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["isProfessional", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async generateCompanyMotto(industry: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, impactful company mission statement or employee value motto for a company in the ${industry} industry.`,
    });
    return response.text;
  }
};
