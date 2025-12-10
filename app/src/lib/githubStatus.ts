export interface PRStatus {
  state: "open" | "merged" | "closed";
  title: string;
  author: string;
  mergedAt?: string;
  closedAt?: string;
}

export async function fetchPRStatus(repo: string, prNumber: number): Promise<PRStatus | null> {
  try {
    const [owner, repoName] = repo.split("/");
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`);
    if (!res.ok) return null;
    const pr = await res.json();
    return {
      state: pr.merged ? "merged" : pr.state === "closed" ? "closed" : "open",
      title: pr.title,
      author: pr.user?.login || "unknown",
      mergedAt: pr.merged_at,
      closedAt: pr.closed_at,
    };
  } catch {
    return null;
  }
}
