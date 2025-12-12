import React, { useState } from "react";
import { ChefHat, Plus, X, Loader2, Clock, Users } from "lucide-react";

const RecipeCreatorApp = () => {
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addIngredient = () => {
    if (
      currentIngredient.trim() &&
      !ingredients.includes(currentIngredient.trim())
    ) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient("");
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setError("Gemini API key is missing. Please set it in the .env file.");
      return;
    }

    if (ingredients.length === 0) {
      setError("Please add at least one ingredient");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = `Create a delicious and practical recipe using primarily these ingredients: ${ingredients.join(
        ", "
      )}.

You must respond with ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "title": "Recipe Name",
  "description": "Brief appetizing description (2-3 sentences)",
  "prep_time": "X minutes",
  "cook_time": "X minutes", 
  "servings": "X",
  "ingredients": [
    "specific ingredient with measurements",
    "another ingredient with measurements"
  ],
  "instructions": [
    "Detailed step 1 with specific actions",
    "Detailed step 2 with cooking technique",
    "Detailed step 3 with timing and temperature"
  ]
}

Make it a realistic, delicious recipe that highlights the provided ingredients. Include common pantry staples with proper measurements. Provide clear, detailed cooking instructions.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 500,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          throw new Error("Invalid API key or request.");
        } else if (response.status === 403) {
          throw new Error("API key access denied.");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded.");
        }
        throw new Error(
          `API Error: ${response.status} - ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      let parsedRecipe;
      try {
        const cleanedText = generatedText
          .replace(/```json\n?|\n?```/g, "")
          .replace(/```\n?|\n?```/g, "")
          .trim();

        parsedRecipe = JSON.parse(cleanedText);

        if (
          !parsedRecipe.title ||
          !parsedRecipe.ingredients ||
          !parsedRecipe.instructions
        ) {
          throw new Error("Incomplete recipe data");
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.log("Raw response:", generatedText);
        throw new Error("Failed to parse recipe from AI response.");
      }

      setRecipe(parsedRecipe);
    } catch (err) {
      console.error("Recipe generation error:", err);
      setError(err.message || "Failed to generate recipe.");
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setIngredients([]);
    setRecipe(null);
    setError("");
    setCurrentIngredient("");
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-12 w-12 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              AI Recipe Creator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Add your ingredients and let Gemini AI create a delicious recipe for
            you!
          </p>
        </div>

        {/* Main App Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ingredients Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Your Ingredients
              </h2>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addIngredient()}
                placeholder="Enter an ingredient..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
              />
              <button
                onClick={addIngredient}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-orange-100 px-3 py-2 rounded-lg"
                >
                  <span className="text-gray-700">{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={generateRecipe}
                disabled={loading || ingredients.length === 0}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Recipe with AI"
                )}
              </button>

              <button
                onClick={resetApp}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Recipe Display Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              AI Generated Recipe
            </h2>

            {recipe ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {recipe.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{recipe.description}</p>

                  <div className="flex gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Prep: {recipe.prep_time}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Cook: {recipe.cook_time}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Serves: {recipe.servings}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Ingredients:
                  </h4>
                  <ul className="space-y-1">
                    {recipe.ingredients?.map((ingredient, index) => (
                      <li key={index} className="text-gray-700">
                        • {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Instructions:
                  </h4>
                  <ol className="space-y-2">
                    {recipe.instructions?.map((instruction, index) => (
                      <li key={index} className="text-gray-700">
                        <span className="font-medium text-orange-600">
                          {index + 1}.
                        </span>{" "}
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✨ Recipe generated by Gemini AI based on your ingredients!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Add ingredients and click "Generate Recipe" to see your
                  AI-created recipe here!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">
              Powered by Google Gemini AI
            </p>
            <p>
              This app generates real recipes using Google's Gemini 2.0 Flash
              model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCreatorApp;
