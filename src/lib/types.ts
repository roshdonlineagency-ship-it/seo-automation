export interface Section {
  id: string;
  h2: string;
  content: string;
  needs_image: boolean;
  image_priority: string;
  image_suggestion: string;
}

export interface ArticleData {
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  slug: string;
  h1: string;
  intro: string;
  sections: Section[];
  faq: { question: string; answer: string }[];
  conclusion: string;
  cta: { text: string; anchor_text: string; target_url: string };
}

export interface ImageIdeaSet {
  sectionId: string;
  heading: string;
  ideas: string[];
  selectedIdea: string;
  generatedPrompt: string;
  fileName: string;
  altText: string;
  file?: File;
}

export interface Prompt {
  id: number | string;
  project_id?: number | string;
  name: string;
  text: string; // <-- این خط رو حتماً اضافه کن
  // هر فیلد دیگه‌ای که داری...
}
