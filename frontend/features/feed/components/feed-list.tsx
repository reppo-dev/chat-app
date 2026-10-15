"use client";

import React, { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CreatePostCard } from "./create-post-card";
import { PostCard } from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";
import postApi from "@/lib/api/post.api";
import { Post } from "@/lib/types";

export const FeedList: React.FC = () => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => postApi.getFeed(10, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const posts: Post[] = lastPage?.data?.data?.posts || [];
      if (posts.length < 10) return undefined;
      return allPages.length * 10;
    },
  });

  // Intersection observer for auto infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts: Post[] =
    data?.pages.flatMap((page) => page.data?.data?.posts || []) || [];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto py-4 px-3 sm:px-4">
      {/* Create Post Card */}
      <CreatePostCard />

      {/* Loading Skeletons for Initial Load */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg bg-card space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
          Failed to load posts feed. Please check your backend connection.
        </div>
      )}

      {/* Posts List */}
      {!isLoading && allPosts.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          <p className="text-base font-semibold">No posts in your feed yet!</p>
          <p className="text-xs mt-1">
            Create a post above or connect with friends to see their updates here.
          </p>
        </div>
      )}

      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Infinite Scroll Load Trigger */}
      <div ref={loadMoreRef} className="py-2 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading more posts...
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-xs text-muted-foreground py-4">
            You&apos;ve seen all current posts.
          </p>
        )}
      </div>
    </div>
  );
};
