# DFD Level 0 (Context Diagram)

```mermaid
graph TD
    User([System User/Admin])
    System((Video Summarization \n & Suspicious Activity \n Detection System))
    Dashboard([React Dashboard View])
    
    User -- "Uploads Raw Video" --> System
    System -- "Summarized Video & Text" --> Dashboard
    System -- "Alert Statistics" --> Dashboard
```
