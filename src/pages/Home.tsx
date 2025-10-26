import { Button } from "@/components/ui/button";

type Props = {};

const Home = ({}: Props) => {
  return (
    <main className="container">
      <Button className="hover:cursor-pointer">Click me</Button>
    </main>
  );
};

export default Home;
