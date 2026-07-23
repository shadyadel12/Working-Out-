import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { archiveRecipe, listRecipes, type Recipe } from "../../api/recipes";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import RecipeEditor from "./recipes/RecipeEditor";
import LibraryAccessPanel from "../../components/LibraryAccessPanel";

export default function RecipeLibrary() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [editor, setEditor] = useState<Recipe | "new" | null>(null);
  const query = useQuery({
    queryKey: ["recipes", coachId],
    queryFn: () => listRecipes(coachId),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["recipes", coachId] });
  const archive = useMutation({
    mutationFn: archiveRecipe,
    onSuccess: refresh,
  });
  const recipes = useMemo(
    () =>
      (query.data ?? []).filter(
        (recipe) =>
          `${recipe.title} ${recipe.summary ?? ""} ${recipe.categories?.join(" ") ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (status === "active"
            ? recipe.lifecycle !== "archived"
            : recipe.lifecycle === status),
      ),
    [query.data, search, status],
  );
  return (
    <div className="catalog-page recipe-library-page">
      <header className="catalog-heading">
        <div>
          <span className="overview-kicker">Nutrition Library</span>
          <h1>Recipes</h1>
          <p>
            Build reusable meals with ingredients, instructions and nutrition
            per serving.
          </p>
        </div>
        <button onClick={() => setEditor("new")}>+ Create recipe</button>
      </header>
      <LibraryAccessPanel kind="recipes" coachId={coachId} />
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span className="sr-only">Search recipes</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recipes"
          />
        </label>
        <div className="catalog-tabs">
          {["active", "draft", "published"].map((value) => (
            <button
              key={value}
              className={status === value ? "active" : ""}
              onClick={() => setStatus(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {query.isLoading && <LoadingSkeleton rows={5} />}
      <div className="recipe-card-grid">
        {recipes.map((recipe) => (
          <article className="recipe-library-card" key={recipe.id}>
            {recipe.cover_url ? (
              <img src={recipe.cover_url} alt="" />
            ) : (
              <div className="recipe-cover-placeholder">
                {recipe.title.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className={`catalog-status ${recipe.lifecycle}`}>
                {recipe.lifecycle}
              </span>
              <h2>{recipe.title}</h2>
              <p>{recipe.summary || "No description yet."}</p>
              <small>
                {recipe.servings} serving{recipe.servings === 1 ? "" : "s"} ·{" "}
                {(recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)} min ·{" "}
                {recipe.categories?.join(", ") || "Uncategorized"}
              </small>
              <footer>
                <button className="secondary" onClick={() => setEditor(recipe)}>
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    confirm(`Archive ${recipe.title}?`) &&
                    archive.mutate(recipe.id)
                  }
                >
                  Archive
                </button>
              </footer>
            </div>
          </article>
        ))}
      </div>
      {!query.isLoading && recipes.length === 0 && (
        <div className="catalog-empty">
          <h2>No recipes found</h2>
          <p>
            Create a structured recipe to use in meal plans and player diets.
          </p>
          <button onClick={() => setEditor("new")}>Create recipe</button>
        </div>
      )}
      {editor && (
        <RecipeEditor
          coachId={coachId}
          recipe={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await refresh();
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
