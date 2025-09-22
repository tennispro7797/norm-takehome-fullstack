export interface Citation {
  source: string;
  text: string;
  page_number?: number;
  parent_section?: string | null;
}

export interface Document {
  docType: string;
  title: string;
  numPages: number;
}
