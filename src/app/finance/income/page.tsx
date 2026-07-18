"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  Upload,
  FileText,
  X,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface Income {
  id: string;
  date: string;
  client: string;
  amount: number;
  source: string;
  description: string;
  status: "received" | "pending" | "scheduled";
}

interface PaymentProcessor {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: string;
  transactionsCount?: number;
}

interface UploadedStatement {
  id: string;
  filename: string;
  processor: string;
  uploadDate: string;
  status: "processing" | "processed" | "error";
  transactionsFound?: number;
}

const incomeSources = [
  "Client Payment",
  "Product Sale",
  "Course/Program",
  "Consulting",
  "Retainer",
  "Affiliate",
  "Referral",
  "Other"
];

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([
    {
      id: "1",
      date: "2026-07-15",
      client: "ABC Company",
      amount: 2500.00,
      source: "Client Payment",
      description: "Monthly retainer - July",
      status: "received"
    },
    {
      id: "2",
      date: "2026-07-12",
      client: "Jane Smith",
      amount: 1500.00,
      source: "Course/Program",
      description: "LifeCharter Circle enrollment",
      status: "received"
    },
    {
      id: "3",
      date: "2026-07-20",
      client: "Mike Johnson",
      amount: 3000.00,
      source: "Consulting",
      description: "Strategy session package",
      status: "pending"
    }
  ]);

  const [processors, setProcessors] = useState<PaymentProcessor[]>([
    { id: "stripe", name: "Stripe", connected: false },
    { id: "paypal", name: "PayPal", connected: false },
    { id: "square", name: "Square", connected: false },
    { id: "quickbooks", name: "QuickBooks", connected: false }
  ]);

  const [statements, setStatements] = useState<UploadedStatement[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    client: "",
    amount: "",
    source: "",
    description: "",
    status: "received" as const
  });

  const handleAddIncome = () => {
    if (!newIncome.client || !newIncome.amount || !newIncome.source) return;

    const incomeItem: Income = {
      id: Date.now().toString(),
      date: newIncome.date,
      client: newIncome.client,
      amount: parseFloat(newIncome.amount),
      source: newIncome.source,
      description: newIncome.description,
      status: newIncome.status
    };

    setIncome(prev => [incomeItem, ...prev]);
    setNewIncome({
      date: new Date().toISOString().split('T')[0],
      client: "",
      amount: "",
      source: "",
      description: "",
      status: "received"
    });
    setShowAddForm(false);
  };

  const handleConnectProcessor = (processorId: string) => {
    setProcessors(prev => prev.map(p => 
      p.id === processorId 
        ? { ...p, connected: true, lastSync: new Date().toISOString().split('T')[0], transactionsCount: Math.floor(Math.random() * 50) + 10 }
        : p
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const processor = file.name.toLowerCase().includes('stripe') ? 'Stripe' :
                       file.name.toLowerCase().includes('paypal') ? 'PayPal' :
                       file.name.toLowerCase().includes('square') ? 'Square' : 'Other';

      const statement: UploadedStatement = {
        id: Date.now().toString() + Math.random(),
        filename: file.name,
        processor,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'processing'
      };

      setStatements(prev => [statement, ...prev]);

      // Simulate AI processing
      setTimeout(() => {
        setStatements(prev => prev.map(s => 
          s.id === statement.id 
            ? { ...s, status: 'processed', transactionsFound: Math.floor(Math.random() * 30) + 5 }
            : s
        ));
      }, 2000);
    });
  };

  const totalIncome = income.filter(i => i.status === "received").reduce((sum, i) => sum + i.amount, 0);
  const pendingIncome = income.filter(i => i.status === "pending").reduce((sum, i) => sum + i.amount, 0);
  const thisMonth = income.filter(i => i.date.startsWith('2026-07') && i.status === "received").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <Link href="/finance" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Finance Center
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#5E3B6C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Income Tracker
            </h1>
            <p className="text-[#B9A9A9]">
              Revenue from all sources with payment processor connections
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#B9A9A9] mb-1">Total Received</p>
            <p className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              ${totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#B9A9A9] mb-1">This Month</p>
            <p className="text-3xl font-bold text-[#5E3B6C]">
              ${thisMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#B9A9A9] mb-1">Pending</p>
            <p className="text-3xl font-bold text-[#D4AF63]">
              ${pendingIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Income List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Income Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              Recent Income
            </h2>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          </div>

          {/* Add Income Form */}
          {showAddForm && (
            <Card className="border-[#D4AF63]/30">
              <CardHeader>
                <CardTitle className="text-lg">Add New Income</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#B9A9A9] mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={newIncome.date}
                      onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#B9A9A9] mb-1 block">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newIncome.amount}
                      onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-1 block">Client/Customer</label>
                  <Input
                    placeholder="e.g., ABC Company, Jane Smith..."
                    value={newIncome.client}
                    onChange={(e) => setNewIncome({...newIncome, client: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-1 block">Source</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                    value={newIncome.source}
                    onChange={(e) => setNewIncome({...newIncome, source: e.target.value})}
                  >
                    <option value="">Select source...</option>
                    {incomeSources.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-1 block">Status</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                    value={newIncome.status}
                    onChange={(e) => setNewIncome({...newIncome, status: e.target.value as any})}
                  >
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-1 block">Description</label>
                  <Textarea
                    placeholder="Details about this income..."
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddIncome}>
                    Save Income
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Income List */}
          <Card>
            <CardContent className="p-0">
              {income.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between ${index !== income.length - 1 ? 'border-b border-[#1F315B]/10' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'received' ? 'bg-green-500/10' : 
                      item.status === 'pending' ? 'bg-yellow-500/10' : 'bg-[#5E3B6C]/10'
                    }`}>
                      {item.status === 'received' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : item.status === 'pending' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Calendar className="w-5 h-5 text-[#5E3B6C]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                        {item.client}
                      </p>
                      <p className="text-sm text-[#B9A9A9]">
                        {item.date} • {item.source}
                      </p>
                      {item.description && (
                        <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6] mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                      +${item.amount.toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'received' ? 'bg-green-500/10 text-green-600' :
                      item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-[#5E3B6C]/10 text-[#5E3B6C]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Processors & Upload */}
        <div className="space-y-6">
          {/* Payment Processors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#D4AF63]" />
                Payment Processors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#B9A9A9]">
                Connect your payment processors for automatic income tracking
              </p>
              
              {processors.map((processor) => (
                <div
                  key={processor.id}
                  className="flex items-center justify-between p-3 bg-[#1F315B]/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#B9A9A9]" />
                    <div>
                      <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                        {processor.name}
                      </p>
                      {processor.connected && (
                        <p className="text-xs text-[#B9A9A9]">
                          Last sync: {processor.lastSync} • {processor.transactionsCount} transactions
                        </p>
                      )}
                    </div>
                  </div>
                  {processor.connected ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Connected</span>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => handleConnectProcessor(processor.id)}>
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upload Statements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#D4AF63]" />
                Upload Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-[#1F315B]/20 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-[#B9A9A9] mx-auto mb-2" />
                <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                  Upload payment processor statements
                </p>
                <p className="text-xs text-[#B9A9A9] mt-1">
                  Stripe, PayPal, Square exports (CSV, PDF)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".csv,.pdf"
                  className="hidden"
                  id="statement-upload"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => document.getElementById('statement-upload')?.click()}
                >
                  Select Files
                </Button>
              </div>

              {/* Uploaded Statements */}
              {statements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                    Uploaded Statements
                  </p>
                  {statements.map((statement) => (
                    <div
                      key={statement.id}
                      className="flex items-center justify-between p-3 bg-[#1F315B]/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#B9A9A9]" />
                        <div>
                          <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">
                            {statement.filename}
                          </p>
                          <p className="text-xs text-[#B9A9A9]">
                            {statement.processor} • {statement.uploadDate}
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

          {/* Income Sources Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incomeSources.map(source => {
                  const sourceTotal = income
                    .filter(i => i.source === source && i.status === "received")
                    .reduce((sum, i) => sum + i.amount, 0);
                  if (sourceTotal === 0) return null;
                  return (
                    <div key={source} className="flex items-center justify-between py-2">
                      <span className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">{source}</span>
                      <span className="text-sm font-medium text-[#B9A9A9]">
                        ${sourceTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
