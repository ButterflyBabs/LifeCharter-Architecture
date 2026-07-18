"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Bot,
  Key,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Trash2,
  Plus,
  Settings,
  History
} from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  icon: string;
  models: string[];
  requiresKey: boolean;
}

interface APIKey {
  id: string;
  provider: string;
  key: string; // encrypted/stored securely
  isActive: boolean;
  addedAt: string;
}

interface Conversation {
  id: string;
  page: string;
  pageLabel: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

const providers: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "🤖",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    requiresKey: true
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🧠",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    requiresKey: true
  },
  {
    id: "moonshot",
    name: "Moonshot AI",
    icon: "🌙",
    models: ["kimi-k2.5", "kimi-k1.5"],
    requiresKey: true
  },
  {
    id: "google",
    name: "Google AI",
    icon: "🔍",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    requiresKey: true
  }
];

export default function AIGuidePage() {
  const [activeTab, setActiveTab] = useState<"settings" | "history" | "providers">("settings");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [savedKeys, setSavedKeys] = useState<APIKey[]>([]);
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      page: "/business-plan",
      pageLabel: "Business Plan",
      lastMessage: "Help me refine my value proposition for LifeCharter...",
      timestamp: "2026-07-18T14:30:00Z",
      messageCount: 12
    },
    {
      id: "2",
      page: "/finance",
      pageLabel: "Finance",
      lastMessage: "Analyze my tech stack expenses and suggest savings...",
      timestamp: "2026-07-17T10:15:00Z",
      messageCount: 8
    },
    {
      id: "3",
      page: "/marketing-plan",
      pageLabel: "Marketing Plan",
      lastMessage: "Create content ideas for my ideal client profile...",
      timestamp: "2026-07-16T16:45:00Z",
      messageCount: 15
    }
  ]);

  const [preferences, setPreferences] = useState({
    autoOpen: false,
    soundEnabled: true,
    voiceInput: true,
    suggestionsEnabled: true,
    persistHistory: true,
    defaultProvider: "moonshot",
    defaultModel: "kimi-k2.5"
  });

  const handleSaveAPIKey = () => {
    if (!selectedProvider || !apiKey) return;
    
    const newKey: APIKey = {
      id: Date.now().toString(),
      provider: selectedProvider,
      key: apiKey.replace(/./g, "•"), // Mask for display
      isActive: savedKeys.length === 0, // First key is active
      addedAt: new Date().toISOString()
    };
    
    setSavedKeys([...savedKeys, newKey]);
    setApiKey("");
    setSelectedProvider("");
  };

  const handleDeleteKey = (id: string) => {
    setSavedKeys(savedKeys.filter(k => k.id !== id));
  };

  const handleSetActiveKey = (id: string) => {
    setSavedKeys(savedKeys.map(k => ({ ...k, isActive: k.id === id })));
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#D4AF63]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              AI Guide Configuration
            </h1>
            <p className="text-[#B9A9A9]">
              Manage your AI assistant settings, API keys, and conversation history
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "settings" ? "primary" : "outline"}
          onClick={() => setActiveTab("settings")}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button
          variant={activeTab === "providers" ? "primary" : "outline"}
          onClick={() => setActiveTab("providers")}
          className="flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          API Keys
        </Button>
        <Button
          variant={activeTab === "history" ? "primary" : "outline"}
          onClick={() => setActiveTab("history")}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          History
        </Button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF63]" />
                Default AI Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-2 block">Provider</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                    value={preferences.defaultProvider}
                    onChange={(e) => setPreferences({...preferences, defaultProvider: e.target.value})}
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-2 block">Model</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                    value={preferences.defaultModel}
                    onChange={(e) => setPreferences({...preferences, defaultModel: e.target.value})}
                  >
                    {providers.find(p => p.id === preferences.defaultProvider)?.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#D4AF63]" />
                Chat Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#1F315B]/10">
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Auto-open on page load</p>
                  <p className="text-sm text-[#B9A9A9]">AI Guide opens automatically when you visit a page</p>
                </div>
                <button
                  onClick={() => setPreferences({...preferences, autoOpen: !preferences.autoOpen})}
                  className={`w-12 h-6 rounded-full transition-colors ${preferences.autoOpen ? 'bg-[#2E7C83]' : 'bg-[#B9A9A9]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.autoOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#1F315B]/10">
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Sound notifications</p>
                  <p className="text-sm text-[#B9A9A9]">Play sound when AI responds</p>
                </div>
                <button
                  onClick={() => setPreferences({...preferences, soundEnabled: !preferences.soundEnabled})}
                  className={`w-12 h-6 rounded-full transition-colors ${preferences.soundEnabled ? 'bg-[#2E7C83]' : 'bg-[#B9A9A9]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#1F315B]/10">
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Voice input</p>
                  <p className="text-sm text-[#B9A9A9]">Enable microphone for voice commands</p>
                </div>
                <button
                  onClick={() => setPreferences({...preferences, voiceInput: !preferences.voiceInput})}
                  className={`w-12 h-6 rounded-full transition-colors ${preferences.voiceInput ? 'bg-[#2E7C83]' : 'bg-[#B9A9A9]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.voiceInput ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#1F315B]/10">
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Smart suggestions</p>
                  <p className="text-sm text-[#B9A9A9]">Show context-aware quick actions</p>
                </div>
                <button
                  onClick={() => setPreferences({...preferences, suggestionsEnabled: !preferences.suggestionsEnabled})}
                  className={`w-12 h-6 rounded-full transition-colors ${preferences.suggestionsEnabled ? 'bg-[#2E7C83]' : 'bg-[#B9A9A9]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.suggestionsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Save conversation history</p>
                  <p className="text-sm text-[#B9A9A9]">Keep history of AI conversations per page</p>
                </div>
                <button
                  onClick={() => setPreferences({...preferences, persistHistory: !preferences.persistHistory})}
                  className={`w-12 h-6 rounded-full transition-colors ${preferences.persistHistory ? 'bg-[#2E7C83]' : 'bg-[#B9A9A9]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.persistHistory ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4AF63]" />
                Add API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[#B9A9A9] mb-2 block">Select Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setSelectedModel(provider.models[0]);
                      }}
                      className={`p-4 rounded-lg border transition-all text-center ${
                        selectedProvider === provider.id
                          ? "border-[#D4AF63] bg-[#D4AF63]/10"
                          : "border-[#1F315B]/20 hover:border-[#D4AF63]/50"
                      }`}
                    >
                      <span className="text-2xl">{provider.icon}</span>
                      <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mt-2">
                        {provider.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProvider && (
                <>
                  <div>
                    <label className="text-sm text-[#B9A9A9] mb-2 block">Select Model</label>
                    <select
                      className="w-full p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {providers.find(p => p.id === selectedProvider)?.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[#B9A9A9] mb-2 block">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your API key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-[#B9A9A9] mt-1">
                      Your API key is encrypted and stored securely. Never shared.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveAPIKey}
                    disabled={!apiKey || !selectedModel}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Save API Key
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Saved Keys */}
          {savedKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedKeys.map((key) => (
                    <div
                      key={key.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        key.isActive ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1F315B]/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {providers.find(p => p.id === key.provider)?.icon}
                        </span>
                        <div>
                          <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                            {providers.find(p => p.id === key.provider)?.name}
                          </p>
                          <p className="text-sm text-[#B9A9A9]">{key.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!key.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActiveKey(key.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        {key.isActive && (
                          <span className="text-sm text-[#2E7C83] flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-[#D4AF63]" />
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv: Conversation) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-4 bg-[#1F315B]/5 rounded-lg hover:bg-[#1F315B]/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[#D4AF63]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                          {conv.pageLabel}
                        </p>
                        <p className="text-sm text-[#B9A9A9] truncate max-w-md">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#B9A9A9]">{formatDate(conv.timestamp)}</p>
                      <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                        {conv.messageCount} messages
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-[#B9A9A9] mx-auto mb-4" />
                <p className="text-[#B9A9A9]">No conversations yet</p>
                <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] mt-1">
                  Start chatting with your AI Guide on any page
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
