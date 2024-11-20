import { useState, useEffect } from "react";
import { TabRow } from "./supabaseService";

// custom hook, pass a function that tries to fetch something (fn)
const useSupabase = (fn: () => Promise<TabRow[] | null>) => {
  const [data, setData] = useState<TabRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // we do this because you can't use async code directly within a useEffect
  // a new function has to be created and called within

//   Type '{ description: string | null; favicon_url: string | null; id: number; inserted_at: string; parsed_url: string | null; position: number | null; tab_group_id: number | null; updated_at: string; url: string; user_id: string; }[] | null' 
// must have a '[Symbol.iterator]()' method that returns an iterator.ts(2488)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fn();
      if (response) {
        setData([...response]);
      } else {
        setData([])
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return { data, isLoading, refetch};
};

export default useSupabase;