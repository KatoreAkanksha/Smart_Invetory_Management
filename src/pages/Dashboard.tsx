import { useState, useEffect } from "react";
import StatsCard from "@/components/StatsCard";
import ExpenseCard, { Expense, ExpenseCategory } from "@/components/ExpenseCard";
import BudgetCard, { Budget } from "@/components/BudgetCard";
import GroupCard from "@/components/GroupCard";
import { Group } from "@/types/group";
import CategoriesPieChart from "@/components/CategoriesPieChart";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import TransactionList from "@/components/TransactionList";
import AddExpenseModal from "@/components/AddExpenseModal";
import AddBudgetModal from "@/components/AddBudgetModal";
import CreateGroupModal from "@/components/CreateGroupModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bell
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Define User interface
interface User {
  name: string;
}

// Mock data for demonstration
const mockExpenses: Expense[] = [
  {
    id: "1",
    amount: 3817.17,
    category: "food",
    date: "2023-06-15",
    description: "Grocery Shopping",
    isRecurring: false,
    paymentMethod: "Credit Card"
  },
  {
    id: "2",
    amount: 9960.00,
    category: "bills",
    date: "2023-06-10",
    description: "Electricity Bill",
    isRecurring: true,
    paymentMethod: "Bank Transfer"
  },
  {
    id: "3",
    amount: 35.50,
    category: "transport",
    date: "2023-06-08",
    description: "Gas Station",
    isRecurring: false,
    paymentMethod: "Debit Card"
  },
  {
    id: "4",
    amount: 89.99,
    category: "shopping",
    date: "2023-06-05",
    description: "New Shoes",
    isRecurring: false,
    paymentMethod: "Credit Card"
  },
  {
    id: "5",
    amount: 12.99,
    category: "entertainment",
    date: "2023-06-02",
    description: "Movie Tickets",
    isRecurring: false,
    paymentMethod: "Cash"
  }
];

const mockBudgets: Budget[] = [
  {
    id: "1",
    category: "Food & Dining",
    amount: 41500,
    spent: 29050,
    period: "monthly"
  },
  {
    id: "2",
    category: "Transportation",
    amount: 300,
    spent: 220,
    period: "monthly"
  },
  {
    id: "3",
    category: "Entertainment",
    amount: 200,
    spent: 180,
    period: "monthly"
  },
  {
    id: "4",
    category: "Shopping",
    amount: 400,
    spent: 420,
    period: "monthly"
  }
];

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Weekend Trip to Mountains",
    description: "Cabin rental and activities",
    totalAmount: 750,
    date: "2023-05-25",
    members: [
      { id: "m1", name: "Alex", paid: true, amount: 187.50 },
      { id: "m2", name: "Jordan", paid: true, amount: 187.50 },
      { id: "m3", name: "Taylor", paid: false, amount: 187.50 },
      { id: "m4", name: "Morgan", paid: false, amount: 187.50 }
    ],
    status: "pending",
    category: "Trip"
  },
  {
    id: "2",
    name: "Dinner at Italian Restaurant",
    totalAmount: 240,
    date: "2023-06-12",
    members: [
      { id: "m1", name: "Alex", paid: true, amount: 80 },
      { id: "m2", name: "Riley", paid: false, amount: 80 },
      { id: "m5", name: "Casey", paid: true, amount: 80 }
    ],
    status: "pending",
    category: "Dinner"
  }
];

const mockTrendData = [
  { date: "Jan", amount: 1200, budget: 1500 },
  { date: "Feb", amount: 1400, budget: 1500 },
  { date: "Mar", amount: 1300, budget: 1500 },
  { date: "Apr", amount: 1500, budget: 1500 },
  { date: "May", amount: 1800, budget: 1500 },
  { date: "Jun", amount: 1600, budget: 1500 }
];

const mockCategoryData = [
  { name: "Food", value: 350, color: "#FF6B6B" },
  { name: "Transport", value: 220, color: "#4ECDC4" },
  { name: "Shopping", value: 420, color: "#FFD166" },
  { name: "Entertainment", value: 180, color: "#6A0572" },
  { name: "Bills", value: 450, color: "#1A535C" }
];

const Dashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [trendData, setTrendData] = useState(mockTrendData);
  const [categoryData, setCategoryData] = useState(mockCategoryData);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const mockAvailableUsers = [
    { id: "1", name: "Alex", email: "alex@example.com" },
    { id: "2", name: "Jordan", email: "jordan@example.com" },
    { id: "3", name: "Taylor", email: "taylor@example.com" },
    { id: "4", name: "Morgan", email: "morgan@example.com" },
    { id: "5", name: "Casey", email: "casey@example.com" },
    { id: "6", name: "Riley", email: "riley@example.com" }
  ];

  // Handle adding a new expense
  const handleAddExpense = (expense: {
    amount: number;
    category: ExpenseCategory;
    date: Date;
    description: string;
    isRecurring: boolean;
    paymentMethod: string;
  }) => {
    const newExpense: Expense = {
      id: uuidv4(),
      ...expense,
      date: expense.date.toISOString().split("T")[0],
    };
    
    setExpenses([newExpense, ...expenses]);
    
    // Update category data
    const categoryIndex = categoryData.findIndex(
      (cat) => cat.name.toLowerCase() === expense.category
    );
    
    if (categoryIndex >= 0) {
      const newCategoryData = [...categoryData];
      newCategoryData[categoryIndex].value += expense.amount;
      setCategoryData(newCategoryData);
    }
  };
  
  // Handle adding a new budget
  const handleAddBudget = (budget: {
    category: string;
    amount: number;
    period: "weekly" | "monthly" | "yearly";
  }) => {
    const newBudget: Budget = {
      id: uuidv4(),
      ...budget,
      spent: 0,
    };
    
    setBudgets([...budgets, newBudget]);
  };
  
  // Handle creating a new group
  const handleCreateGroup = (group: {
    name: string;
    description: string;
    category: string;
    totalAmount: number;
    date: Date;
    members: User[];
  }) => {
    // Calculate equal split amount per member
    const splitAmount = group.totalAmount / group.members.length;

    const groupMembers = group.members.map((member) => ({
      id: uuidv4(),
      name: member.name,
      paid: false,
      amount: splitAmount
    }));

    const newGroup: Group = {
      id: uuidv4(),
      name: group.name,
      description: group.description,
      category: group.category,
      totalAmount: group.totalAmount,
      date: group.date.toISOString().split("T")[0],
      members: groupMembers,
      status: "pending",
    };
    
    setGroups([newGroup, ...groups]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="pt-2 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Welcome Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome back, Prathmesh</h1>
                <p className="text-muted-foreground">Here's an overview of your finances</p>
              </div>
              <div className="flex space-x-3">
                <AddExpenseModal onAddExpense={handleAddExpense} />
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatsCard
              title="Total Balance"
              value={5840}
              icon={<Wallet className="h-5 w-5" />}
              change={{ value: 12, type: "increase" }}
              className="h-full"
            />
            <StatsCard
              title="Monthly Spending"
              value={1620}
              icon={<ArrowUpRight className="h-5 w-5" />}
              change={{ value: 8, type: "increase" }}
              className="h-full"
            />
            <StatsCard
              title="Income"
              value={3200}
              icon={<TrendingUp className="h-5 w-5" />}
              change={{ value: 0, type: "neutral" }}
              className="h-full"
            />
            <StatsCard
              title="Savings"
              value={1580}
              icon={<TrendingDown className="h-5 w-5" />}
              change={{ value: 4, type: "decrease" }}
              className="h-full"
            />
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <SpendingTrendChart data={trendData} className="h-full" />
            <CategoriesPieChart data={categoryData} className="h-full" />
          </div>
          
          {/* Quick Access */}
          <div className="mb-6">
            <Tabs defaultValue="expenses">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="h-10">
                  <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
                  <TabsTrigger value="budgets">Budgets</TabsTrigger>
                  <TabsTrigger value="groups">Group Expenses</TabsTrigger>
                </TabsList>

                <div className="hidden md:block">
                  <TabsContent value="expenses" className="mt-0">
                    <Link to="/expenses">
                      <Button variant="ghost" size="sm" className="h-9">
                        View All
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </TabsContent>
                  <TabsContent value="budgets" className="mt-0">
                    <AddBudgetModal onAddBudget={handleAddBudget} />
                  </TabsContent>
                  <TabsContent value="groups" className="mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => setIsCreateGroupOpen(true)}
                    >
                      Create Group
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TabsContent>
                </div>
              </div>
              
              <TabsContent value="expenses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {expenses.slice(0, 3).map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} className="h-full" />
                  ))}
                  <Link to="/expenses" className="flex md:hidden">
                    <Button variant="outline" className="w-full justify-center h-12">
                      View All Expenses
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="budgets">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {budgets.map((budget) => (
                    <BudgetCard key={budget.id} budget={budget} className="h-full" />
                  ))}
                  <div className="flex md:hidden mt-4">
                    <AddBudgetModal onAddBudget={handleAddBudget} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="groups">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} className="h-full" />
                  ))}
                  <div className="flex md:hidden mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-center h-12"
                      onClick={() => setIsCreateGroupOpen(true)}
                    >
                      Create New Group
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Transaction List */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
            <TransactionList expenses={expenses} />
          </div>
        </div>
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={mockAvailableUsers}
        existingGroups={groups.map(group => ({ id: group.id, name: group.name }))}
      />
    </div>
  );
};

export default Dashboard;
