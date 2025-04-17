import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FinancialAdvisorBot } from "@/components/FinancialAdvisorBot";
import { UserCreditScore } from "@/components/UserCreditScore";
import { CustomCategoriesManager } from "@/components/CustomCategoriesManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BrainCircuit,
  DollarSign,
  CreditCard,
  BarChart3,
  TrendingUp,
  Users,
  Send,
  Bot,
  ChevronRight,
  Star,
  Sparkles,
  Shield,
  Zap,
  PiggyBank,
  Coins,
  TrendingDown,
  Target,
  BarChart,
  Wallet,
  Bell,
  LineChart,
  Newspaper,
  BarChart2,
  BadgeDollarSign,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { StockData } from "@/components/StockData";
import { StockNews } from "@/components/StockNews";
import { SmartExpenseCapture } from "@/components/SmartExpenseCapture";
import { useNotification } from "@/contexts/NotificationContext";
// No need for API setup since we're using mock data

// No need for FinnhubProvider since we're using mock data

type Message = {
  type: "user" | "ai";
  content: string;
};

interface ExpenseAnalysis {
  topCategories: string[];
  monthlyTrend: string;
  savingsOpportunities: string[];
  budgetStatus: string;
}

const FinancialAdvisor: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [advice, setAdvice] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [expenseAnalysis, setExpenseAnalysis] = useState<ExpenseAnalysis>({
    topCategories: [],
    monthlyTrend: "",
    savingsOpportunities: [],
    budgetStatus: "",
  });
  const { addNotification } = useNotification();
  // Default to assistant tab
  const [activeTab, setActiveTab] = useState("assistant");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are a financial advisor. You will help the user with their financial questions."
  );

  useEffect(() => {
    // Initialize the financial advisor
    const initializeAdvisor = async () => {
      setIsLoading(true);
      try {
        await analyzeExpenseData();
        await generateInitialAdvice();
      } catch (error) {
        console.error("Failed to initialize advisor:", error);
        toast.error("Failed to load financial advice");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdvisor();
  }, []);

  useEffect(() => {
    if (language === "mr") {
      setSystemPrompt("आपण एक वित्तीय सल्लागार आहात. तुम्ही वापरकर्त्याला त्यांच्या वित्तीय प्रश्नांचे उत्तर मराठीत द्याल.");
    } else if (language === "hi") {
      setSystemPrompt("आप एक वित्तीय सलाहकार हैं। आप उपयोगकर्ता को उनके वित्तीय प्रश्नों के उत्तर हिंदी में देंगे।");
    } else {
      setSystemPrompt("You are a financial advisor. You will help the user with their financial questions.");
    }
  }, [language]);

  useEffect(() => {
    // Notify user about new financial insights
    setTimeout(() => {
      addNotification({
        type: "info",
        title: t("New Financial Insights"),
        message: t(
          "We've analyzed your spending and found 3 areas for potential savings."
        ),
      });
    }, 2000);
  }, []);

  const generateInitialAdvice = async () => {
    const initialAdvice = [
      "Consider creating a budget for your top spending categories.",
      "Look for opportunities to reduce spending on restaurants and takeout.",
      "Start building an emergency fund if you haven't already.",
      "Review your subscription services and cancel those you don't use regularly.",
      "Aim to save at least 20% of your monthly income.",
    ];

    setAdvice(initialAdvice);
    return initialAdvice;
  };

  const analyzeExpenseData = async () => {
    try {
      const analysis = {
        topCategories: ["Food", "Transportation", "Entertainment"],
        monthlyTrend: "increasing",
        savingsOpportunities: [
          "Reduce dining out expenses",
          "Optimize transportation costs",
          "Review subscription services",
        ],
        budgetStatus: "over budget",
      };

      setExpenseAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error("Failed to analyze expense data:", error);
      return {
        topCategories: [],
        monthlyTrend: "",
        savingsOpportunities: [],
        budgetStatus: "",
      };
    }
  };

  const getAIResponse = async (query: string) => {
    try {
      setConversation((prev) => [...prev, { type: "user", content: query }]);

      // Load API key from environment variable
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("Missing Gemini API key");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        As a financial advisor, please provide personalized advice about: ${query}
        
        User context:
        - Top spending categories: ${expenseAnalysis.topCategories.join(", ")}
        - Monthly spending trend: ${expenseAnalysis.monthlyTrend}
        - Budget status: ${expenseAnalysis.budgetStatus}
        
        Provide concise, actionable financial advice in a conversational tone.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setConversation((prev) => [...prev, { type: "ai", content: text }]);

      return text;
    } catch (error) {
      console.error("AI response error:", error);

      const fallbackResponse =
        "I'm sorry, I couldn't process your request. Please try again later.";
      setConversation((prev) => [
        ...prev,
        { type: "ai", content: fallbackResponse },
      ]);

      toast.error("Failed to get AI response");
      return fallbackResponse;
    }
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const query = userQuery;
    setUserQuery("");
    await getAIResponse(query);
  };

  const handleInsightRequest = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: t("Analyzing your financial data..."),
      success: t(
        "Analysis complete! We've identified 3 potential savings opportunities."
      ),
      error: t("Failed to analyze data. Please try again."),
    });
  };

  return (
      <div className="min-h-screen bg-background">
        <main className="pt-2 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{t("Financial Advisor")}</h1>
              <p className="text-muted-foreground">
                {t(
                  "Get personalized financial advice and stay updated with market trends."
                )}
              </p>
            </div>

          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-5 max-w-[900px]">
              <TabsTrigger value="assistant">
                <BrainCircuit className="h-4 w-4 mr-2" />
                {t("AI Advisor")}
              </TabsTrigger>
              <TabsTrigger value="stocks">
                <LineChart className="h-4 w-4 mr-2" />
                {t("Stocks")}
              </TabsTrigger>
              <TabsTrigger value="news">
                <Newspaper className="h-4 w-4 mr-2" />
                {t("Financial News")}
              </TabsTrigger>
              <TabsTrigger value="insights">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("Insights")}
              </TabsTrigger>
              <TabsTrigger value="expense-capture">
                <Receipt className="h-4 w-4 mr-2" />
                {t("Add Expense")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
                    {t("AI Financial Assistant")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "Ask questions about your finances and get personalized advice"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FinancialAdvisorBot systemPrompt={systemPrompt} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stocks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-primary" />
                    {t("Stock Market Updates")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "Track the performance of key market indices and stocks"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockData />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="news" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Newspaper className="h-5 w-5 mr-2 text-primary" />
                    {t("Financial News")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "Stay informed with the latest financial and market news"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockNews />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    {t("Financial Insights")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "Personalized analysis of your spending and saving patterns"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <PiggyBank className="h-5 w-5 mr-2 text-green-500" />
                          {t("Savings Opportunity")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "You could save ₹8,000 by reducing subscription services."
                          )}
                        </p>
                        <Button variant="link" className="px-0 text-sm mt-2">
                          {t("See details")}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <BadgeDollarSign className="h-5 w-5 mr-2 text-blue-500" />
                          {t("Budget Goal Progress")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "You're on track to meet your savings goal this month!"
                          )}
                        </p>
                        <Button variant="link" className="px-0 text-sm mt-2">
                          {t("See details")}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Coins className="h-5 w-5 mr-2 text-amber-500" />
                          {t("Unusual Spending")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "Your dining expenses are 40% higher than last month."
                          )}
                        </p>
                        <Button variant="link" className="px-0 text-sm mt-2">
                          {t("See details")}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <BrainCircuit className="h-5 w-5 mr-2 text-purple-500" />
                          {t("Personalized Insight")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "Request a personalized analysis of your financial data."
                          )}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={handleInsightRequest}
                        >
                          {t("Generate Insights")}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expense-capture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-primary" />
                    {t("Smart Expense Capture")}
                  </CardTitle>
                  <CardDescription>
                    {t("Quickly add and categorize your expenses with AI assistance")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SmartExpenseCapture
                    onSubmit={(data) => {
                      // Save expense to localStorage for persistence
                      try {
                        const existingExpensesJson = localStorage.getItem('expenses') || '[]';
                        const existingExpenses = JSON.parse(existingExpensesJson);
                        
                        // Format the expense data appropriately
                        const newExpense = {
                          id: Date.now().toString(), // Generate a unique ID
                          amount: data.amount,
                          category: data.category || 'other',
                          date: data.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                          description: data.description,
                          isRecurring: data.isRecurring || false,
                          paymentMethod: data.paymentMethod || 'card',
                          createdAt: new Date().toISOString()
                        };
                        
                        // Add to localStorage
                        existingExpenses.push(newExpense);
                        localStorage.setItem('expenses', JSON.stringify(existingExpenses));
                        
                        // Create and dispatch the expenseAdded event
                        const expenseAddedEvent = new CustomEvent('expenseAdded', {
                          detail: newExpense,
                          bubbles: true,
                          composed: true
                        });
                        
                        // Dispatch at both document and window levels for better compatibility
                        document.dispatchEvent(expenseAddedEvent);
                        window.dispatchEvent(expenseAddedEvent);
                        
                        console.log("Expense added and event dispatched from FinancialAdvisor:", newExpense);
                        
                        // Show confirmation
                        toast.success(t("Expense added successfully!"));
                        addNotification({
                          title: t("New Expense Added"),
                          message: `${data.description} - $${data.amount}`,
                          type: "success"
                        });
                      } catch (error) {
                        console.error("Error saving expense:", error);
                        toast.error(t("Failed to save expense. Please try again."));
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialAdvisor;
