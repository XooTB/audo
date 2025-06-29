interface Book {
  id: number;
  title: string;
  chapters: any;
  narrator: string;
  series: string;
  description: string;
  author: string;
  cover: string;
}

export interface LibBook {
  id: number;
  title: string;
  narrator: string;
  series: string;
  author: string;
  description: string;
  status: "completed" | "reading" | "paused" | "dropped" | "new";
}


export default Book;
