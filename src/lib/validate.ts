import type { VocabularyEntry } from './vocab';

export interface CatalogVocabularies {
  species: VocabularyEntry[];
  diseases: VocabularyEntry[];
  tissues: VocabularyEntry[];
  sequencingTypes: VocabularyEntry[];
  sourceTypes: VocabularyEntry[];
  downloadStatuses: VocabularyEntry[];
}

export const defaultVocabularies: CatalogVocabularies = {
  species: [
    { label: 'Homo sapiens', aliases: ['human', '人类'], ontologyId: 'NCBITaxon:9606' },
    { label: 'Mus musculus', aliases: ['mouse', '小鼠'], ontologyId: 'NCBITaxon:10090' },
    { label: 'Rattus norvegicus', aliases: ['rat', '大鼠'], ontologyId: 'NCBITaxon:10116' },
  ],
  diseases: [
    { label: 'normal control', aliases: ['control', 'healthy'] },
    { label: 'idiopathic pulmonary fibrosis', aliases: ['IPF'] },
    { label: 'lung adenocarcinoma', aliases: ['LUAD', 'TCGA-LUAD'] },
    { label: 'liver injury', aliases: [] },
    { label: 'breast invasive carcinoma', aliases: ['BRCA', 'TCGA-BRCA', 'breast cancer'] },
    { label: 'lung squamous cell carcinoma', aliases: ['LUSC', 'TCGA-LUSC'] },
    { label: 'colon adenocarcinoma', aliases: ['COAD', 'TCGA-COAD', 'colon cancer'] },
    { label: 'rectum adenocarcinoma', aliases: ['READ', 'TCGA-READ', 'rectal cancer'] },
    { label: 'prostate adenocarcinoma', aliases: ['PRAD', 'TCGA-PRAD', 'prostate cancer'] },
    { label: 'ovarian serous cystadenocarcinoma', aliases: ['OV', 'TCGA-OV', 'ovarian cancer'] },
    { label: 'glioblastoma multiforme', aliases: ['GBM', 'TCGA-GBM', 'glioblastoma'] },
    { label: 'skin cutaneous melanoma', aliases: ['SKCM', 'TCGA-SKCM', 'melanoma'] },
    { label: 'kidney renal clear cell carcinoma', aliases: ['KIRC', 'TCGA-KIRC', 'clear cell renal carcinoma'] },
  ],
  tissues: [
    { label: 'lung', aliases: [] },
    { label: 'peripheral blood', aliases: ['blood', 'PBMC'] },
    { label: 'liver', aliases: [] },
    { label: 'tumor', aliases: ['tumour'] },
  ],
  sequencingTypes: [
    { label: 'bulk RNA-seq', aliases: ['RNA-seq', 'bulk transcriptomics'] },
    { label: 'scRNA-seq', aliases: ['single-cell RNA-seq', 'single cell RNA-seq'] },
    { label: 'snRNA-seq', aliases: ['single-nucleus RNA-seq', 'single nucleus RNA-seq'] },
    { label: 'spatial transcriptomics', aliases: ['spatial RNA-seq', 'Visium', 'Stereo-seq'] },
    { label: 'WGS', aliases: ['whole-genome sequencing'] },
    { label: 'WES', aliases: ['whole-exome sequencing'] },
    { label: 'ATAC-seq', aliases: ['bulk ATAC-seq'] },
    { label: 'scATAC-seq', aliases: ['single-cell ATAC-seq'] },
    { label: 'ChIP-seq', aliases: ['chromatin immunoprecipitation sequencing'] },
    { label: 'CUT&Tag', aliases: ['cleavage under targets and tagmentation'] },
    { label: 'CUT&RUN', aliases: ['cleavage under targets and release using nuclease'] },
    { label: 'miRNA-seq', aliases: ['microRNA sequencing'] },
    { label: 'metagenomics', aliases: ['metagenomic sequencing'] },
    { label: 'long-read RNA-seq', aliases: ['Iso-Seq', 'Nanopore direct RNA'] },
    { label: 'long-read WGS', aliases: ['PacBio HiFi WGS', 'ONT WGS'] },
    { label: 'other', aliases: [] },
  ],
  sourceTypes: [
    { label: 'GEO', aliases: ['Gene Expression Omnibus'] },
    { label: 'SRA', aliases: ['Sequence Read Archive'] },
    { label: 'ENA', aliases: ['European Nucleotide Archive'] },
    { label: 'TCGA', aliases: ['The Cancer Genome Atlas'] },
    { label: 'Publication', aliases: ['Paper', 'Article'] },
    { label: 'Zenodo', aliases: [] },
    { label: 'Figshare', aliases: [] },
    { label: 'Other', aliases: [] },
  ],
  downloadStatuses: [
    { label: 'not downloaded', aliases: ['missing', 'todo'] },
    { label: 'downloaded', aliases: ['done'] },
    { label: 'partial', aliases: ['partially downloaded'] },
    { label: 'unavailable', aliases: ['link dead', 'not available'] },
    { label: 'unknown', aliases: [] },
  ],
};
