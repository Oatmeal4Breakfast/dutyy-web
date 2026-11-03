import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { createProject } from '../api/projects';
import { ApiError } from '../api/client';

export default function CreateProjectForm() {
  const [projectName, setProjectName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await createProject();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to create new project');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}></form>
    </div>
  );
}
