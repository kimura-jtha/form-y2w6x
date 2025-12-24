export interface Template {
  id: string;
  subject: string;
  content: string;
  versionHistory: {
    version: string;
    publishedAt: string;
    publishedBy: string;
  }[];
}
