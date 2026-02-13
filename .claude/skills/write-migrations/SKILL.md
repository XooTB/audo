---
name: write-migrations
description: Writes a new migration for the app depending on the user instructions and needs of the app.
---

When writing a migration:
- Always try to keep things consistent between the different tables.
- Things like date-time column type and formats, colum name formats etc should be consistent in general. 

Before writing a migration, try to figure out what's the minimum change that can be used to achieve the desired result.

Always try to use the different features that the database offers to write up the most optimum table structure. 