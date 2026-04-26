# Use Case Diagram

```mermaid
usecaseDiagram
    actor "System Admin/User" as User
    
    package "Video Summarization System" {
        usecase "Upload Surveillance Video" as UC1
        usecase "Process Video Pipeline" as UC2
        usecase "Detect Weapons" as UC3
        usecase "Detect Loitering" as UC4
        usecase "Generate Optimized Summary" as UC5
        usecase "View Analytics Dashboard" as UC6
    }
    
    User --> UC1
    User --> UC6
    
    UC1 --> UC2 : "Triggers"
    UC2 ..> UC3 : "<<includes>>"
    UC2 ..> UC4 : "<<includes>>"
    UC2 ..> UC5 : "<<includes>>"
```
