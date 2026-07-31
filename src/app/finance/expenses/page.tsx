"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  TrendingDown,
  Plus,
  Upload,
  FileText,
  Tag,
  Building2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface Expense {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  description: string;
  receipt?: string;
}

interface UploadedStatement {
  id: string;
  filename: string;
  type: "bank" | "credit_card";
  uploadDate: string;
  status: "processing" | "processed" | "error";
  transactionsFound?: number;
}

const categories = [
  "Software & Tools",
  "Marketing & Advertising",
  "Professional Services",
  "Office Supplies",
  "Travel & Meals",
  "Education & Training",
  "Equipment",
  "Subscriptions",
  "Contractors",
  "Other"
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      date: "2026-07-15",
      vendor: "Stripe",
      amount: 79.00,
      category: "Software & Tools",
      description: "Payment processing fees"
    },
    {
      id: "2",
      date: "2026-07-12",
      vendor: "Notion",
      amount: 15.00,
      category: "Software & Tools",
      description: "Team workspace subscription"
    },
    {
      id: "3",
      date: "2026-07-10",
      vendor: "Canva",
      amount: 12.99,
      category: "Software & Tools",
      description: "Pro design subscription"
    }
  ]);

  const [statements, setStatements] = useState<UploadedStatement[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    amount: "",
    category: "",
    description: ""
  });

  const handleAddExpense = () => {
    if (!newExpense.vendor || !newExpense.amount || !newExpense.category) return;

    const expense: Expense = {
      id: Date.now().toString(),
      date: newExpense.date,
      vendor: newExpense.vendor,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description
    };

    setExpenses(prev => [expense, ...prev]);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      vendor: "",
      amount: "",
      category: "",
      description: ""
    });
    setShowAddForm(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const statement: UploadedStatement = {
        id: Date.now().toString() + Math.random(),
        filename: file.name,
        type: file.name.toLowerCase().includes('credit') ? 'credit_card' : 'bank',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'processing'
      };

      setStatements(prev => [statement, ...prev]);

      // Simulate AI processing
      setTimeout(() => {
        setStatements(prev => prev.map(s => 
          s.id === statement.id 
            ? { ...s, status: 'processed', transactionsFound: Math.floor(Math.random() * 20) + 5 }
            : s
        ));
      }, 2000);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses.filter(e => e.date.startsWith('2026-07')).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <Link href="/finance" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Finance Center
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-[#4a9b9b]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Expense Manager
            </h1>
            <p className="text-[#b8a898]">
              Track and categorize all business expenses
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Total Expenses</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              ${totalExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">This Month</p>
            <p className="text-3xl font-bold text-[#4a9b9b]">
              ${thisMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Transactions</p>
            <p className="text-3xl font-bold text-[#c9a227]">
              {expenses.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Expenses List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Expense Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Recent Expenses
            </h2>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Add Expense Form */}
          {showAddForm && (
            <Card className="border-[#c9a227]/30">
              <CardHeader>
                <CardTitle className="text-lg">Add New Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Vendor</label>
                  <Input
                    placeholder="e.g., Stripe, Notion, etc."
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Category</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Description</label>
                  <Textarea
                    placeholder="What was this expense for?"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense}>
                    Save Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses List */}
          <Card>
            <CardContent className="p-0">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className={`p-4 flex items-center justify-between ${index !== expenses.length - 1 ? 'border-b border-[#1a2b4a]/10' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#4a9b9b]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                        {expense.vendor}
                      </p>
                      <p className="text-sm text-[#b8a898]">
                        {expense.date} • {expense.category}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mt-1">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                    -${expense.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Upload & Categories */}
        <div className="space-y-6">
          {/* Upload Statements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#c9a227]" />
                Upload Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#c9a227] bg-[#c9a227]/5'
                    : 'border-[#1a2b4a]/20 hover:border-[#c9a227]/50'
                }`}
              >
                <Upload className="w-8 h-8 text-[#b8a898] mx-auto mb-2" />
                <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                  Drop bank or credit card statements here
                </p>
                <p className="text-xs text-[#b8a898] mt-1">
                  Supports PDF, CSV, OFX, QFX files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.csv,.ofx,.qfx"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Uploaded Statements */}
              {statements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                    Uploaded Statements
                  </p>
                  {statements.map((statement) => (
                    <div
                      key={statement.id}
                      className="flex items-center justify-between p-3 bg-[#1a2b4a]/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#b8a898]" />
                        <div>
                          <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {statement.filename}
                          </p>
                          <p className="text-xs text-[#b8a898]">
                            {statement.type === 'credit_card' ? 'Credit Card' : 'Bank'} • {statement.uploadDate}
                          </p>
                        </div>
                      </div>
                      {statement.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span className="text-xs">AI Processing...</span>
                        </div>
                      ) : statement.status === 'processed' ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">{statement.transactionsFound} found</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Error</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#c9a227]" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(cat => {
                  const catTotal = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between py-2">
                      <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{cat}</span>
                      <span className="text-sm font-medium text-[#b8a898]">
                        ${catTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c9a227]" />
                AI Insights
              </h3>
              <p className="text-sm text-[#e8e4f0] mb-4">
                Your software expenses are 23% higher than last month. Consider reviewing subscriptions.
              </p>
              <Button variant="outline" className="w-full border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-[#1a2b4a]">
                Review Tech Stack
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
