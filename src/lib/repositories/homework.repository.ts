import { BaseRepository } from "./base.repository";

export interface Homework {
  id: string;
  title: string;
  type: string;
  status: "draft" | "uploading" | "published";
  description: string;
  createdAt: string;
  updatedAt: string;
  attachments?: any[];
  [key: string]: any;
}

class HomeworkRepository extends BaseRepository<Homework> {
  constructor() {
    super("homeworks");
  }
}

export const homeworkRepository = new HomeworkRepository();
