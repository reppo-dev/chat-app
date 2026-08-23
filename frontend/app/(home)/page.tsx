import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Home = () => {
  return (
    <div className=" w-full h-full">
      <div className="mx-4 mt-4 flex flex-col gap-2">
        <div className="flex flex-col gap-3 bg-white dark:bg-primary-foreground h-16 justify-center p-4 rounded-sm">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage>dd</AvatarImage>
              <AvatarFallback>d</AvatarFallback>
            </Avatar>
            <Input type="text" />
          </div>
          <Separator />
        </div>
      </div>
    </div>
  );
};

export default Home;
