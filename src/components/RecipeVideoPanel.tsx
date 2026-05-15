import type { PlatoReceta } from "../lib/nutritionPlan";
import { TutorialVideoPanel } from "./TutorialVideoPanel";

type Props = {
  plato: Pick<PlatoReceta, "titulo" | "videoQuery" | "videoUrl" | "youtubeVideoId">;
  dietaHint?: string;
};

/** Vídeo embebido para recetas del cronograma. */
export function RecipeVideoPanel({ plato, dietaHint }: Props) {
  return (
    <TutorialVideoPanel
      source={{
        titulo: plato.titulo,
        videoQuery: plato.videoQuery,
        videoUrl: plato.videoUrl ?? undefined,
        youtubeVideoId: plato.youtubeVideoId ?? undefined
      }}
      contexto="receta"
      queryExtra={dietaHint ? `${plato.videoQuery ?? ""} ${dietaHint}`.trim() : plato.videoQuery}
    />
  );
}
