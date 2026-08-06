import { BaseRepository } from "./base.repository";

import { Submission } from "@/types/homework-types";

class SubmissionRepository extends BaseRepository<Submission> {
  constructor() {
    super("homeworkSubmissions");
  }
}

export const submissionRepository = new SubmissionRepository();
