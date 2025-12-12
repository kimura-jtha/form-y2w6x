export interface Template {
  id: string;
  content: string;
  versionHistory: {
    version: string;
    publishedAt: string;
    publishedBy: string;
  }[];
}
