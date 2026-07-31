"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Circle, Clock, Plus, Trash2, Loader2 } from "lucide-react";

interface RhythmItem {
  id: string;
  workspace_id: string;
  user_id: string;
  category: "daily" | "weekly" | "monthly";
  title: string;
  frequency: "daily" | "weekly" | "monthly";
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

interface RhythmSection {
  title: string;
  category: "daily" | "weekly" | "monthly";
  icon: "daily" | "weekly" | "monthly";
  items: RhythmItem[];
}

const sectionColors = {
  daily: "#4a9b9b",
  weekly: "#7b6b8d",
  monthly: "#c9a227",
};

interface OperatingRhythmProps {
  workspaceId?: string;
}

export function OperatingRhythm({ workspaceId }: OperatingRhythmProps) {
  const [items, setItems] = useState<RhythmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<"daily" | "weekly" | "monthly">("daily");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Fetch rhythm items
  const fetchItems = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/operating-rhythm?workspace_id=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rhythm items');
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rhythm items');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Toggle item completion
  const toggleItem = async (id: string, currentCompleted: boolean) => {
    try {
      const response = await fetch('/api/operating-rhythm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !currentCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      // Optimistically update UI
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, completed: !currentCompleted } : item
      ));
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  // Add new item
  const addItem = async () => {
    if (!newItemTitle.trim() || !workspaceId) return;

    setAddingItem(true);
    try {
      const response = await fetch('/api/operating-rhythm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          category: newItemCategory,
          title: newItemTitle.trim(),
          frequency: newItemCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const data = await response.json();
      setItems(prev => [...prev, data.item]);
      setNewItemTitle("");
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/operating-rhythm?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Group items by category
  const sections: RhythmSection[] = [
    {
      title: "Daily",
      category: "daily",
      icon: "daily",
      items: items.filter(item => item.category === "daily"),
    },
    {
      title: "Weekly",
      category: "weekly",
      icon: "weekly",
      items: items.filter(item => item.category === "weekly"),
    },
    {
      title: "Monthly",
      category: "monthly",
      icon: "monthly",
      items: items.filter(item => item.category === "monthly"),
    },
  ];

  // Calculate stats
  const totalItems = items.length;
  const completedItems = items.filter(item => item.completed).length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate streak (consecutive days with at least one completion)
  const calculateStreak = () => {
    if (items.length === 0) return 0;
    
    const dailyItems = items.filter(item => item.category === 'daily');
    if (dailyItems.length === 0) return 0;
    
    const completedToday = dailyItems.filter(item => {
      if (!item.completed_at) return false;
      const completedDate = new Date(item.completed_at);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length;
    
    return completedToday > 0 ? Math.min(completedToday, dailyItems.length) : 0;
  };

  const streak = calculateStreak();

  if (loading) {
    return (
      <Card className="h-full border-[#c9a227]/30">
        <CardHeader>
          <CardTitle>Operating Rhythm</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-[#4a9b9b]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-[#c9a227]/30">
        <CardHeader>
          <CardTitle>Operating Rhythm</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-red-600">{error}</p>
          <Button 
            variant="secondary" 
            className="mt-4" 
            onClick={fetchItems}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader>
        <CardTitle>Operating Rhythm</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <Clock
                  className="w-4 h-4"
                  style={{ color: sectionColors[section.icon] }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: sectionColors[section.icon] }}
                >
                  {section.title}
                </h3>
                <span className="text-xs text-[#b8a898]">
                  ({section.items.filter(i => i.completed).length}/{section.items.length})
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5 pl-6">
                {section.items.length === 0 ? (
                  <p className="text-xs text-[#b8a898] italic">No items yet</p>
                ) : (
                  section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm group"
                    >
                      <button
                        onClick={() => toggleItem(item.id, item.completed)}
                        className="flex-shrink-0 transition-colors"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4a9b9b]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#b8a898] hover:text-[#4a9b9b]" />
                        )}
                      </button>
                      <span
                        className={`flex-1 ${
                          item.completed
                            ? "text-[#1a2b4a]/60 dark:text-[#F8F5F0]/60 line-through"
                            : "text-[#1a2b4a] dark:text-[#F8F5F0]"
                        }`}
                      >
                        {item.title}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#b8a898] hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new item form */}
        {showAddForm ? (
          <div className="mt-4 p-3 bg-[#F8F5F0]/50 dark:bg-[#1a2b4a]/20 rounded-lg">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 text-sm border border-[#c9a227]/30 rounded-md bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] placeholder-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#4a9b9b]"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as "daily" | "weekly" | "monthly")}
                className="px-3 py-1.5 text-sm border border-[#c9a227]/30 rounded-md bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={addItem}
                disabled={!newItemTitle.trim() || addingItem}
              >
                {addingItem ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 flex items-center gap-1 text-sm text-[#4a9b9b] hover:text-[#4a9b9b]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        )}

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t border-[#c9a227]/20">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#7b6b8d] dark:text-[#e8e4f0]">
              {completedItems} of {totalItems} completed ({completionRate}%)
            </span>
            {streak > 0 && (
              <span className="text-[#c9a227] font-medium">
                🔥 {streak} today
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#c9a227]/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4a9b9b] transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}