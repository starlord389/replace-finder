export type ArticleType = "faq" | "doc";

export interface ArticleFeedback {
  id: string;
  user_id: string;
  article_id: string;
  article_type: string;
  article_title: string;
  helpful: boolean;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/** Stable identifiers so the same article is tracked across the FAQ/Guide views and search results. */
export const faqArticleId = (question: string) => `faq:${question}`;
export const docArticleId = (docId: string) => `doc:${docId}`;
