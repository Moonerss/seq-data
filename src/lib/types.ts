export interface RawDatasetRecord {
  id: string;
  title: string;
  summary: string;
  source_type: string;
  accessions: string;
  data_links: string;
  species: string;
  diseases: string;
  tissues: string;
  sequencing_types: string;
  technology_tags: string;
  sample_count: string;
  download_status: string;
  notes: string;
  pmid: string;
  doi: string;
  paper_title: string;
  journal: string;
  year: string;
  corresponding_author: string;
}

export interface DataLink {
  label: string;
  url: string;
}

export interface Publication {
  pmid?: string;
  doi?: string;
  title?: string;
  journal?: string;
  year?: number;
  correspondingAuthor?: string;
}

export interface DatasetRecord {
  id: string;
  title: string;
  summary?: string;
  sourceType: string;
  accessions: string[];
  dataLinks: DataLink[];
  species: string[];
  diseases: string[];
  tissues: string[];
  sequencingTypes: string[];
  technologyTags: string[];
  sampleCount?: number;
  downloadStatus?: string;
  notes?: string;
  publication: Publication;
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  issues: ValidationIssue[];
}
