import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Doubt, DoubtReply } from "@/types/doubt-types";

export const DOUBTS_QUERY_KEY = ["doubts"];

export function useLiveDoubts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const q = query(collection(db, "doubts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doubts: Doubt[] = [];
      snapshot.forEach((doc) => {
        doubts.push({ id: doc.id, ...doc.data() } as Doubt);
      });
      queryClient.setQueryData(DOUBTS_QUERY_KEY, doubts);
    }, (error) => {
      console.error("Live Doubts Error:", error);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: DOUBTS_QUERY_KEY,
    queryFn: async () => {
      // Fallback if snapshot hasn't populated yet
      return [];
    },
    staleTime: Infinity, // Realtime listener handles staleness
  });
}

export function useLiveDoubtReplies(doubtId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["doubtReplies", doubtId];

  useEffect(() => {
    if (!doubtId) return;
    const q = query(collection(db, `doubts/${doubtId}/replies`), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const replies: DoubtReply[] = [];
      snapshot.forEach((doc) => {
        replies.push({ id: doc.id, ...doc.data() } as DoubtReply);
      });
      queryClient.setQueryData(queryKey, replies);
    });

    return () => unsubscribe();
  }, [doubtId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => [],
    staleTime: Infinity,
  });
}
