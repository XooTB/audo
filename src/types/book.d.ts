export type Book = {
  id: number;
  name: string;
  file_location: string;
  cover_image: string;
  author: string;
  narrator: string;
  duration: number;
  size: number;
  description?: string;
  content_id: string | null;
  identity_method: string | null;
  asin: string | null;
  isbn: string | null;
};
