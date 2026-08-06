import { BaseRepository } from "./base.repository";
import { FirestoreService } from "../firebase/firestore.service";
import type { Doubt } from "@/types/doubt-types";

class DoubtRepository extends BaseRepository<Doubt> {
  constructor() {
    super("doubts");
  }

  async createReply(doubtId: string, reply: any): Promise<void> {
    const sanitized = this.sanitizeData(reply);
    await FirestoreService.set(`doubts/${doubtId}/replies`, [reply.id], sanitized);
  }

  async updateReply(doubtId: string, replyId: string, data: any): Promise<void> {
    const sanitized = this.sanitizeData(data);
    await FirestoreService.update(`doubts/${doubtId}/replies`, [replyId], sanitized);
  }
}

export const doubtRepository = new DoubtRepository();
