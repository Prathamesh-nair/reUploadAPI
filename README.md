# reUploadAPI

## Author
Prathamesh Nair

## Overview
This project utilizes APIs to handle ReUpload Queries and fetch Fulfilment Data. The system employs JWT Authentication to verify users based on their roles and utilizes Winston for logging user updates.

## API Usage

### 1. JWT Authentication
- The system uses JWT Authentication to verify users based on their roles.

### 2. Logging with Winston
- Winston is employed to log updates made by users.

### 3. Fulfilment Data
#### Endpoint: `/checkApplication/:id`
- This route is used to fetch Fulfilment Data.
- It takes the client code as a query parameter.
- Example: `/checkApplication/123456`

### 4. ReUpload Queries
#### Endpoint: `/application/:id`
- This route is used to fetch and handle ReUpload Queries.
- It takes the application number as a query parameter.
- Example: `/application/789012`


---
Feel free to reach out if you have any questions or issues related to the project. Happy coding!
