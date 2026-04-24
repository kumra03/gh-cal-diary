import { useState, useEffect, useRef } from 'react';
import { CalendarIcon, Utensils, Coffee, Cookie, Moon, Plus, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from './components/Calendar';
import { toast, Toaster } from 'sonner';

interface FoodItem {
  name: string;
  calories: number | null;
  isCalculating?: boolean;
}

interface Meal {
  items: FoodItem[];
}

interface DayData {
  date: string;
  breakfast: Meal;
  lunch: Meal;
  snacks: Meal;
  dinner: Meal;
  supper: Meal;
}

const MEAL_TYPES = [
  { key: 'breakfast' as const, label: 'Breakfast', icon: Coffee },
  { key: 'lunch' as const, label: 'Lunch', icon: Utensils },
  { key: 'snacks' as const, label: 'Snacks', icon: Cookie },
  { key: 'dinner' as const, label: 'Dinner', icon: Utensils },
  { key: 'supper' as const, label: 'Supper', icon: Moon },
];

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [useGroqAPI, setUseGroqAPI] = useState(true);
  const calendarRef = useRef<HTMLDivElement>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  // Load data from localStorage when date changes
  useEffect(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(`diary_${dateKey}`);
      if (stored) {
        setDayData(JSON.parse(stored) as DayData);
      } else {
        // No data for this date, create empty entry
        setDayData({
          date: dateKey,
          breakfast: { items: [{ name: '', calories: null }] },
          lunch: { items: [{ name: '', calories: null }] },
          snacks: { items: [{ name: '', calories: null }] },
          dinner: { items: [{ name: '', calories: null }] },
          supper: { items: [{ name: '', calories: null }] },
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to empty data
      setDayData({
        date: dateKey,
        breakfast: { items: [{ name: '', calories: null }] },
        lunch: { items: [{ name: '', calories: null }] },
        snacks: { items: [{ name: '', calories: null }] },
        dinner: { items: [{ name: '', calories: null }] },
        supper: { items: [{ name: '', calories: null }] },
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateKey]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!dayData || isLoading) return;

    const saveData = () => {
      setIsSaving(true);
      try {
        localStorage.setItem(`diary_${dateKey}`, JSON.stringify(dayData));
      } catch (error) {
        console.error('Error saving data:', error);
        toast.error('Failed to save diary entry');
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [dayData, dateKey, isLoading]);

  const calculateCalories = async (foodName: string): Promise<number> => {
    // Always use mock data for now to avoid rate limits
    return getMockCalories(foodName);
    
    /* Groq API integration disabled due to rate limits
    if (!useGroqAPI) {
      return getMockCalories(foodName);
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert. When given a food or drink item, respond with ONLY a number representing the estimated calories. No explanations, no units, just the number. If you cannot estimate, respond with 0.'
            },
            {
              role: 'user',
              content: `Estimate calories for: ${foodName}`
            }
          ],
          temperature: 0.3,
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', response.status, errorText);
        
        // Handle rate limits specifically
        if (response.status === 429) {
          setUseGroqAPI(false);
          toast.error('API rate limit reached - Switched to offline mode');
          return getMockCalories(foodName);
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const caloriesText = data.choices[0]?.message?.content?.trim();
      const calories = parseInt(caloriesText, 10);

      return isNaN(calories) ? 0 : calories;
    } catch (error) {
      console.error('Error calculating calories:', error);
      
      // Check if it's a network/CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setUseGroqAPI(false);
        toast.error('Network error - Switched to offline mode');
        return getMockCalories(foodName);
      }
      
      // Return mock calorie data as fallback
      return getMockCalories(foodName);
    }
    */
  };

  // Mock calorie calculator as fallback
  const getMockCalories = (foodName: string): number => {
    const name = foodName.toLowerCase();
    
    // Common foods and drinks with approximate calories
    const mockData: Record<string, number> = {
      // Fruits
      'apple': 95, 'banana': 105, 'orange': 62, 'grape': 62, 'strawberry': 50,
      'blueberry': 85, 'mango': 99, 'pineapple': 82, 'watermelon': 46, 'peach': 59,
      'pear': 101, 'plum': 46, 'kiwi': 42, 'cherry': 77,
      
      // Proteins
      'egg': 78, 'chicken': 165, 'beef': 250, 'fish': 206, 'salmon': 206,
      'tuna': 184, 'shrimp': 99, 'pork': 242, 'turkey': 135, 'lamb': 294,
      'bacon': 43, 'sausage': 301, 'ham': 145, 'steak': 271,
      
      // Dairy
      'milk': 149, 'yogurt': 100, 'cheese': 113, 'butter': 102, 'cream': 52,
      'ice cream': 207, 'cottage cheese': 163, 'cheddar': 113,
      
      // Grains & Carbs
      'bread': 79, 'rice': 206, 'pasta': 220, 'oatmeal': 166, 'cereal': 140,
      'bagel': 277, 'tortilla': 104, 'quinoa': 222, 'noodle': 138,
      'croissant': 231, 'muffin': 424, 'pancake': 227, 'waffle': 218,
      
      // Vegetables
      'salad': 50, 'broccoli': 55, 'carrot': 52, 'tomato': 22, 'cucumber': 16,
      'spinach': 23, 'potato': 163, 'corn': 96, 'peas': 81, 'beans': 127,
      'lettuce': 15, 'onion': 44, 'pepper': 30, 'mushroom': 15,
      
      // Fast Food & Meals
      'pizza': 285, 'burger': 354, 'sandwich': 200, 'hot dog': 290, 'taco': 226,
      'burrito': 326, 'fries': 365, 'nugget': 280, 'wrap': 250, 'sub': 410,
      
      // Snacks & Sweets
      'cookie': 150, 'chips': 152, 'chocolate': 235, 'candy': 150, 'popcorn': 31,
      'peanut': 161, 'almond': 164, 'cashew': 157, 'pretzel': 108,
      'donut': 195, 'brownie': 227, 'cake': 257, 'pie': 296,
      
      // Beverages
      'coffee': 2, 'tea': 2, 'water': 0, 'juice': 110, 'soda': 140,
      'beer': 153, 'wine': 125, 'smoothie': 145, 'latte': 190, 'cappuccino': 120,
      'mocha': 260, 'espresso': 3, 'milkshake': 364,
      
      // Soups & Liquids
      'soup': 100, 'broth': 38, 'stew': 220, 'chili': 250,
      
      // Condiments
      'sugar': 49, 'honey': 64, 'ketchup': 15, 'mayo': 94, 'ranch': 73,
      'mustard': 3, 'soy sauce': 8, 'oil': 120, 'vinegar': 3,
      
      // Other
      'tofu': 144, 'hummus': 166, 'guacamole': 234, 'salsa': 36,
    };
    
    // Try to find a match
    for (const [key, value] of Object.entries(mockData)) {
      if (name.includes(key)) {
        return value;
      }
    }
    
    // Default estimate based on common portions
    return 150;
  };

  const handleFoodItemChange = async (
    mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'supper',
    itemIndex: number,
    value: string
  ) => {
    if (!dayData) return;

    const updatedData = { ...dayData };
    updatedData[mealType].items[itemIndex] = {
      name: value,
      calories: null,
      isCalculating: true,
    };
    setDayData(updatedData);

    if (value.trim()) {
      const calories = await calculateCalories(value);
      const finalData = { ...updatedData };
      finalData[mealType].items[itemIndex] = {
        name: value,
        calories,
        isCalculating: false,
      };
      setDayData(finalData);

      if (calories > 0) {
        toast.success(`${value}: ${calories} cal`);
      }
    } else {
      const finalData = { ...updatedData };
      finalData[mealType].items[itemIndex] = {
        name: value,
        calories: null,
        isCalculating: false,
      };
      setDayData(finalData);
    }
  };

  const addFoodItem = (mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'supper') => {
    if (!dayData) return;
    const meal = dayData[mealType];
    if (meal.items.length < 3) {
      setDayData({
        ...dayData,
        [mealType]: {
          items: [...meal.items, { name: '', calories: null }],
        },
      });
    }
  };

  const removeFoodItem = (mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'supper', itemIndex: number) => {
    if (!dayData) return;
    const meal = dayData[mealType];
    if (meal.items.length > 1) {
      setDayData({
        ...dayData,
        [mealType]: {
          items: meal.items.filter((_, index) => index !== itemIndex),
        },
      });
    }
  };

  const getTotalCalories = (): number => {
    if (!dayData) return 0;
    return Object.values(dayData)
      .filter((value): value is Meal => typeof value === 'object' && 'items' in value)
      .reduce((total, meal) => {
        const mealCalories = meal.items.reduce((sum, item) => sum + (item.calories || 0), 0);
        return total + mealCalories;
      }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diary...</p>
        </div>
      </div>
    );
  }

  if (!dayData) return null;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Info */}
          {showInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <Save className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  <strong>Auto-Save Active:</strong> Your diary entries are automatically saved to your browser.
                  {isSaving && <span className="ml-2 text-green-600">Saving...</span>}
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Calories Diary</h1>
                {isSaving && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Saving...
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Calories</p>
                <p className="text-3xl font-bold text-blue-600">{getTotalCalories()}</p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full md:w-auto"
              >
                <CalendarIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </button>

              {showCalendar && (
                <div className="absolute top-full mt-2 z-10 bg-white rounded-lg shadow-lg p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-4">
            {MEAL_TYPES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
                  <div className="ml-auto text-sm text-gray-500">
                    {dayData[key].items.reduce((sum, item) => sum + (item.calories || 0), 0)} cal
                  </div>
                </div>

                <div className="space-y-3">
                  {dayData[key].items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleFoodItemChange(key, index, e.target.value)}
                          placeholder="Enter food or drink item..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {item.isCalculating && (
                          <p className="text-xs text-gray-500 mt-1 ml-1">Calculating calories...</p>
                        )}
                        {item.calories !== null && !item.isCalculating && (
                          <p className="text-xs text-gray-600 mt-1 ml-1 font-medium">
                            {item.calories} calories
                          </p>
                        )}
                      </div>
                      {dayData[key].items.length > 1 && (
                        <button
                          onClick={() => removeFoodItem(key, index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {dayData[key].items.length < 3 && (
                    <button
                      onClick={() => addFoodItem(key)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}