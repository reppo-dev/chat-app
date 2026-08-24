"use client";

import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRef } from "react";

const SearchBox = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-center rounded-md border-2 dark:bg-gray-700/80">
      <Search className="ml-2" onClick={() => inputRef.current?.focus()} />

      <Input
        ref={inputRef}
        className="border-none bg-transparent dark:bg-transparent focus:shadow-none focus:border-none focus:ring-0 focus-visible:ring-0"
      />
    </div>
  );
};

export default SearchBox;
