import { convertFileSrc } from "@tauri-apps/api/core";
import PosterPlaceholder from "@/assets/poster_placeholder.png";

export function getCoverImageSrc(coverImage: string | undefined | null): string {
  if (coverImage && coverImage.trim() !== "") {
    return convertFileSrc(coverImage);
  }
  return PosterPlaceholder;
}
