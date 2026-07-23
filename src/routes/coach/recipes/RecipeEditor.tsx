import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getRecipe,
  saveRecipe,
  type Recipe,
  type RecipeIngredient,
  type RecipeStep,
} from "../../../api/recipes";
import { listIngredients } from "../../../api/ingredients";
import IngredientEditor from "../ingredients/IngredientEditor";
import IngredientUnitSelect from "../ingredients/IngredientUnitSelect";
import VisibilitySelect from "../../../components/VisibilitySelect";
import {
  publishCatalogItem,
  type LibraryVisibility,
} from "../../../api/publicLibrary";

const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Soup",
  "Salad / Bowl",
  "Other",
];
const dietaryLabels = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Keto",
  "Paleo",
  "High protein",
  "Low carb",
];
const emptyStep = (): RecipeStep => ({ text: "", imageUrl: "" });
const numberOrNull = (value: string) => (value === "" ? null : Number(value));

export default function RecipeEditor({
  coachId,
  recipe,
  onClose,
  onSaved,
}: {
  coachId: string;
  recipe: Recipe | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const detail = useQuery({
    queryKey: ["recipe-editor", recipe?.id],
    queryFn: () => getRecipe(recipe!.id),
    enabled: !!recipe,
  });
  const ingredientsQuery = useQuery({
    queryKey: ["ingredients", coachId],
    queryFn: () => listIngredients(coachId),
  });
  const source = detail.data ?? recipe;
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [summary, setSummary] = useState(recipe?.summary ?? "");
  const [coverUrl, setCoverUrl] = useState(recipe?.cover_url ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    recipe?.categories ?? [],
  );
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [prepMinutes, setPrepMinutes] = useState<number | null>(
    recipe?.prep_minutes ?? null,
  );
  const [cookMinutes, setCookMinutes] = useState<number | null>(
    recipe?.cook_minutes ?? null,
  );
  const [labels, setLabels] = useState<string[]>(recipe?.dietary_labels ?? []);
  const [videoUrl, setVideoUrl] = useState(recipe?.instruction_video_url ?? "");
  const [manualInstructions, setManualInstructions] = useState(
    Boolean(
      recipe?.instruction_video_url ||
      recipe?.preparation_steps?.length ||
      recipe?.cooking_steps?.length,
    ),
  );
  const [preparationSteps, setPreparationSteps] = useState<RecipeStep[]>(
    recipe?.preparation_steps?.length
      ? recipe.preparation_steps
      : [emptyStep()],
  );
  const [cookingSteps, setCookingSteps] = useState<RecipeStep[]>(
    recipe?.cooking_steps?.length ? recipe.cooking_steps : [emptyStep()],
  );
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [newIngredient, setNewIngredient] = useState(false);
  const [nutrition, setNutrition] = useState({
    calories: null as number | null,
    protein_g: null as number | null,
    carbs_g: null as number | null,
    fat_g: null as number | null,
    saturated_fat_g: null as number | null,
    sugar_g: null as number | null,
    fiber_g: null as number | null,
  });
  const [includeNutrition, setIncludeNutrition] = useState(
    Boolean(
      recipe &&
      [
        recipe.calories,
        recipe.protein_g,
        recipe.carbs_g,
        recipe.fat_g,
        recipe.saturated_fat_g,
        recipe.sugar_g,
        recipe.fiber_g,
      ].some((value) => value !== null),
    ),
  );
  const [visibility, setVisibility] = useState<LibraryVisibility>(
    recipe?.visibility ?? "private",
  );
  useEffect(() => {
    if (!detail.data) return;
    const value = detail.data;
    setTitle(value.title);
    setSummary(value.summary ?? "");
    setCoverUrl(value.cover_url ?? "");
    setSelectedCategories(value.categories ?? []);
    setServings(value.servings);
    setPrepMinutes(value.prep_minutes);
    setCookMinutes(value.cook_minutes);
    setLabels(value.dietary_labels ?? []);
    setVideoUrl(value.instruction_video_url ?? "");
    setPreparationSteps(
      value.preparation_steps?.length ? value.preparation_steps : [emptyStep()],
    );
    setCookingSteps(
      value.cooking_steps?.length ? value.cooking_steps : [emptyStep()],
    );
    setManualInstructions(
      Boolean(
        value.instruction_video_url ||
        value.preparation_steps?.length ||
        value.cooking_steps?.length,
      ),
    );
    setIngredients(value.ingredients);
    setNutrition({
      calories: value.calories,
      protein_g: value.protein_g,
      carbs_g: value.carbs_g,
      fat_g: value.fat_g,
      saturated_fat_g: value.saturated_fat_g,
      sugar_g: value.sugar_g,
      fiber_g: value.fiber_g,
    });
    setIncludeNutrition(
      [
        value.calories,
        value.protein_g,
        value.carbs_g,
        value.fat_g,
        value.saturated_fat_g,
        value.sugar_g,
        value.fiber_g,
      ].some((item) => item !== null),
    );
  }, [detail.data]);
  const publishReady =
    title.trim() &&
    selectedCategories.length &&
    (prepMinutes !== null || cookMinutes !== null) &&
    servings > 0 &&
    ingredients.length > 0 &&
    ingredients.every((item) => item.quantity > 0);
  const emptyNutrition = {
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    saturated_fat_g: null,
    sugar_g: null,
    fiber_g: null,
  };
  const save = useMutation({
    mutationFn: async (lifecycle: "draft" | "published") => {
      const id = await saveRecipe(coachId, recipe?.id ?? null, {
        title,
        summary,
        cover_url: coverUrl || null,
        servings,
        categories: selectedCategories,
        prep_minutes: prepMinutes,
        cook_minutes: cookMinutes,
        dietary_labels: labels,
        instruction_video_url: manualInstructions ? videoUrl || null : null,
        preparation_steps: manualInstructions
          ? preparationSteps.filter((step) => step.text.trim())
          : [],
        cooking_steps: manualInstructions
          ? cookingSteps.filter((step) => step.text.trim())
          : [],
        ...(includeNutrition ? nutrition : emptyNutrition),
        lifecycle,
        ingredients,
      });
      if (
        lifecycle === "published" &&
        (!recipe ||
          recipe.visibility !== visibility ||
          recipe.lifecycle !== "published")
      )
        await publishCatalogItem("recipes", id, visibility);
      return id;
    },
    onSuccess: onSaved,
  });
  const toggle = (
    value: string,
    values: string[],
    setter: (values: string[]) => void,
  ) =>
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  const patchStep = (
    setter: React.Dispatch<React.SetStateAction<RecipeStep[]>>,
    index: number,
    patch: Partial<RecipeStep>,
  ) =>
    setter((steps) =>
      steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    );
  const addIngredient = (foodItemId: string, name: string, unit: string) =>
    setIngredients((items) =>
      items.some((item) => item.foodItemId === foodItemId)
        ? items
        : [...items, { foodItemId, name, quantity: 1, unit }],
    );
  const available = (ingredientsQuery.data ?? []).filter((item) =>
    item.name.toLowerCase().includes(ingredientSearch.toLowerCase()),
  );
  if (recipe && !source) return null;
  return (
    <div className="catalog-dialog-backdrop">
      <section
        className="catalog-dialog recipe-editor"
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <span className="overview-kicker">
              {recipe ? "Edit" : "Create"}
            </span>
            <h2>Recipe</h2>
          </div>
          <button
            className="secondary catalog-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="recipe-editor-body">
          <section className="recipe-editor-section">
            <h3>Recipe details</h3>
            <VisibilitySelect value={visibility} onChange={setVisibility} />
            <div className="recipe-details-grid">
              <label>
                Name *
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                Cover image URL
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(event) => setCoverUrl(event.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="recipe-wide">
                Description
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </label>
              <label>
                Prep time (minutes)
                <input
                  type="number"
                  min="0"
                  value={prepMinutes ?? ""}
                  onChange={(event) =>
                    setPrepMinutes(numberOrNull(event.target.value))
                  }
                />
              </label>
              <label>
                Cooking time (minutes)
                <input
                  type="number"
                  min="0"
                  value={cookMinutes ?? ""}
                  onChange={(event) =>
                    setCookMinutes(numberOrNull(event.target.value))
                  }
                />
              </label>
              <label>
                Servings *
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(event) => setServings(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="recipe-chip-group">
              <strong>Categories *</strong>
              {categories.map((item) => (
                <button
                  type="button"
                  className={
                    selectedCategories.includes(item) ? "selected" : ""
                  }
                  onClick={() =>
                    toggle(item, selectedCategories, setSelectedCategories)
                  }
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="recipe-chip-group">
              <strong>Dietary information</strong>
              {dietaryLabels.map((item) => (
                <button
                  type="button"
                  className={labels.includes(item) ? "selected" : ""}
                  onClick={() => toggle(item, labels, setLabels)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
          <section className="recipe-editor-section">
            <div className="recipe-section-heading">
              <div>
                <h3>Ingredients</h3>
                <p>Add quantities for every selected ingredient.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIngredientPicker(true)}
              >
                + Add ingredients
              </button>
            </div>
            <div className="recipe-ingredient-list">
              {ingredients.map((item, index) => (
                <div key={item.foodItemId}>
                  <strong>{item.name}</strong>
                  <input
                    aria-label={`${item.name} quantity`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) =>
                      setIngredients((items) =>
                        items.map((value, itemIndex) =>
                          itemIndex === index
                            ? { ...value, quantity: Number(event.target.value) }
                            : value,
                        ),
                      )
                    }
                  />
                  <IngredientUnitSelect
                    value={item.unit}
                    onChange={(unit) =>
                      setIngredients((items) =>
                        items.map((value, itemIndex) =>
                          itemIndex === index ? { ...value, unit } : value,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setIngredients((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="recipe-editor-section recipe-optional-section">
            <label className="recipe-section-toggle">
              <input
                type="checkbox"
                checked={manualInstructions}
                onChange={(event) =>
                  setManualInstructions(event.target.checked)
                }
              />
              <span>
                <strong>Add manual instructions</strong>
                <small>
                  Optional video, preparation steps and cooking steps
                </small>
              </span>
            </label>
            {manualInstructions && (
              <div className="recipe-optional-fields">
                <label>
                  Optional YouTube or Vimeo video
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                  />
                </label>
                <StepEditor
                  title="Preparation steps"
                  steps={preparationSteps}
                  setSteps={setPreparationSteps}
                  patchStep={patchStep}
                />
                <StepEditor
                  title="Cooking steps"
                  steps={cookingSteps}
                  setSteps={setCookingSteps}
                  patchStep={patchStep}
                />
              </div>
            )}
          </section>
          <section className="recipe-editor-section recipe-optional-section">
            <label className="recipe-section-toggle">
              <input
                type="checkbox"
                checked={includeNutrition}
                onChange={(event) => setIncludeNutrition(event.target.checked)}
              />
              <span>
                <strong>Add calories and nutrition</strong>
                <small>Optional nutrition values per serving</small>
              </span>
            </label>
            {includeNutrition && (
              <div className="recipe-optional-fields">
                <div className="recipe-nutrition-grid">
                  {(
                    [
                      ["calories", "Calories"],
                      ["protein_g", "Protein (g)"],
                      ["carbs_g", "Carbs (g)"],
                      ["fat_g", "Fat (g)"],
                      ["saturated_fat_g", "Saturated fat (g)"],
                      ["sugar_g", "Sugar (g)"],
                      ["fiber_g", "Fiber (g)"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition[key] ?? ""}
                        onChange={(event) =>
                          setNutrition((value) => ({
                            ...value,
                            [key]: numberOrNull(event.target.value),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
          {save.error && (
            <p className="error">{(save.error as Error).message}</p>
          )}
        </div>
        <footer className="recipe-editor-footer">
          <span>
            {publishReady
              ? "Ready to publish"
              : "Complete required fields to publish"}
          </span>
          <div>
            <button
              className="secondary"
              onClick={() => save.mutate("draft")}
              disabled={!title.trim() || save.isPending}
            >
              Save draft
            </button>
            <button
              onClick={() => save.mutate("published")}
              disabled={!publishReady || save.isPending}
            >
              Publish recipe
            </button>
          </div>
        </footer>
        {showIngredientPicker && (
          <div className="recipe-picker-overlay">
            <section>
              <header>
                <h3>Add ingredients</h3>
                <button
                  className="secondary"
                  onClick={() => setShowIngredientPicker(false)}
                >
                  Done
                </button>
              </header>
              <input
                type="search"
                value={ingredientSearch}
                onChange={(event) => setIngredientSearch(event.target.value)}
                placeholder="Search ingredient or category"
              />
              <div>
                {available.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      addIngredient(item.id, item.name, item.default_unit)
                    }
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.category || "Uncategorized"}</small>
                    </span>
                    <span>
                      {ingredients.some((value) => value.foodItemId === item.id)
                        ? "Added"
                        : "Add"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="secondary"
                onClick={() => setNewIngredient(true)}
              >
                + Create custom ingredient
              </button>
            </section>
          </div>
        )}
        {newIngredient && (
          <IngredientEditor
            coachId={coachId}
            mode="single"
            onClose={() => setNewIngredient(false)}
            onSaved={async () => {
              await ingredientsQuery.refetch();
              setNewIngredient(false);
            }}
          />
        )}
      </section>
    </div>
  );
}

function StepEditor({
  title,
  steps,
  setSteps,
  patchStep,
}: {
  title: string;
  steps: RecipeStep[];
  setSteps: React.Dispatch<React.SetStateAction<RecipeStep[]>>;
  patchStep: (
    setter: React.Dispatch<React.SetStateAction<RecipeStep[]>>,
    index: number,
    patch: Partial<RecipeStep>,
  ) => void;
}) {
  return (
    <div className="recipe-steps">
      <div>
        <strong>{title}</strong>
        <button
          type="button"
          className="secondary"
          onClick={() => setSteps((values) => [...values, emptyStep()])}
        >
          + Add step
        </button>
      </div>
      {steps.map((step, index) => (
        <div key={index}>
          <span>{index + 1}</span>
          <textarea
            rows={2}
            value={step.text}
            onChange={(event) =>
              patchStep(setSteps, index, { text: event.target.value })
            }
            placeholder="Describe this step"
          />
          <input
            type="url"
            value={step.imageUrl}
            onChange={(event) =>
              patchStep(setSteps, index, { imageUrl: event.target.value })
            }
            placeholder="Optional step image URL"
          />
          <button
            type="button"
            className="danger"
            onClick={() =>
              setSteps((values) =>
                values.filter((_, stepIndex) => stepIndex !== index),
              )
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
