import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PosterPlaceholder from "@/assets/poster_placeholder.png";
import { Button } from "@/components/ui/button";

type Props = {};

const Library = ({}: Props) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 py-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-[2/3] relative">
            <img
              src={PosterPlaceholder}
              alt="Audiobook Cover"
              className="w-full h-full object-cover"
            />
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="text-base line-clamp-2">Book Name</CardTitle>
            <CardDescription className="text-sm">Author Name</CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full">
              Listen
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Library;
