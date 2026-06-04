# 数据管理面板与模板参考

面向当前 sequencing dataset catalog，建议重点参考“数据门户 + 管理后台 + 表格筛选组件”三类，而不是单纯营销型 dashboard。

## 1. 生物医学 / 组学数据门户

### GDC Data Portal
- URL: https://portal.gdc.cancer.gov/
- 适合参考：癌症数据门户、facet 筛选、repository explorer、项目/病例/文件分层。
- 可借鉴：左侧或顶部 facet、多维筛选 chips、数据表与下载队列结合。
- 对本项目启发：如果未来加入 TCGA cohort 或 controlled-access 数据，可借鉴其“项目级 → 数据文件级”的层次，但 MVP 仍保持 dataset-level。

### cBioPortal
- URL: https://www.cbioportal.org/
- 适合参考：癌症研究数据集入口、study selection、临床/组学变量组织。
- 可借鉴：study card/list、疾病/癌种分类、搜索优先的研究选择界面。
- 对本项目启发：左侧 disease/category sidebar + 右侧 dataset list 是合理方向。

### CELLxGENE Discover
- URL: https://cellxgene.cziscience.com/
- 适合参考：单细胞数据集 catalog、organism/tissue/disease/assay 等筛选。
- 可借鉴：dataset-level curated catalog 的布局、标签、细胞/组织/疾病 facet。
- 对本项目启发：你的 scRNA-seq/snRNA-seq 数据记录可参考其 tissue、disease、organism 的展示方式。

### Expression Atlas
- URL: https://www.ebi.ac.uk/gxa/home
- 适合参考：实验、基因表达、物种和疾病入口。
- 可借鉴：生物实体检索、实验数据集入口、物种分组。

### GEO Browse
- URL: https://www.ncbi.nlm.nih.gov/geo/browse/
- 适合参考：朴素但高信息密度的 accession 浏览方式。
- 可借鉴：accession-first 的字段组织和紧凑表格。
- 对本项目启发：表格字段不要过度视觉化，accession、title、organism、sample count 要稳定可扫读。

## 2. 通用数据管理后台 / Dashboard 模板

### MUI Dashboard Template
- URL: https://mui.com/material-ui/getting-started/templates/dashboard/
- 适合参考：现代 React dashboard 的页面结构。
- 可借鉴：顶部统计卡、图表卡片、表格区、响应式布局。

### shadcn/ui Dashboard Example
- URL: https://ui.shadcn.com/examples/dashboard
- 适合参考：干净现代的 dashboard + data table。
- 可借鉴：统计卡片、table toolbar、分页、状态 badge、简洁层级。
- 对本项目启发：如果想要更“现代 SaaS”，可用 shadcn 风格替代彩色表头。

### Tabler
- URL: https://preview.tabler.io/
- 适合参考：轻量后台模板，适合静态站。
- 可借鉴：卡片密度、sidebar、按钮、表格、badge。

### AdminLTE
- URL: https://adminlte.io/themes/v3/
- 适合参考：经典管理后台布局。
- 可借鉴：sidebar + content layout、信息卡片、表格。
- 注意：视觉较传统，适合结构参考，不建议完全照搬。

### Sakai Vue / PrimeVue Admin
- URL: https://www.primefaces.org/sakai-vue/
- 适合参考：企业级后台 UI。
- 可借鉴：筛选表单、组件密度、侧边栏导航。

## 3. 表格与筛选组件参考

### TanStack Table Filters Example
- URL: https://tanstack.com/table/latest/docs/framework/react/examples/filters
- 适合参考：列过滤、排序、分页、范围筛选。
- 可借鉴：每列 filter variant、分页工具条、客户端过滤模型。
- 对本项目启发：后续如果数据超过几百条，可以加入分页、列排序和列级筛选。

### Mantine DataTable
- URL: https://mantine.dev/x/data-table/
- 适合参考：紧凑数据表、分页、排序、行选择。
- 可借鉴：表格密度、hover、分页、空状态。

### CoreUI Smart Table
- URL: https://coreui.io/react/docs/components/smart-table/
- 适合参考：后台管理表格。
- 可借鉴：列过滤、排序、分页、可操作行。

### React Table Library
- URL: https://react-table-library.com/
- 适合参考：React 表格状态管理。
- 可借鉴：搜索、排序、树状数据、选择状态。

## 4. 对当前项目的设计建议

优先融合这三类参考：

1. **结构参考 cBioPortal / GDC**
   - 左侧 disease/category sidebar
   - 右侧 dataset list
   - 顶部统计信息

2. **数据集字段参考 CELLxGENE / GEO**
   - organism/species
   - disease
   - tissue
   - assay/sequencing type
   - accession
   - publication
   - sample count

3. **表格交互参考 shadcn / TanStack Table**
   - table toolbar
   - 搜索框
   - facet filters
   - status badge
   - row hover
   - 后续可加入分页、排序、列显示控制

## 5. 最值得模仿的 3 个

### 首选：CELLxGENE Discover
原因：与你的项目同属 dataset-level biological catalog，字段语义最接近。

### 第二：GDC Data Portal
原因：癌症/组学数据门户成熟，facet 和数据 repository 设计值得借鉴。

### 第三：shadcn/ui Dashboard
原因：视觉现代、表格与统计卡片简洁，适合改造成 GitHub Pages 静态站。
