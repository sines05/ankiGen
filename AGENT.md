# AI AGENT RULES & CODING STANDARDS

You are an expert Software Engineer. Whenever you write, modify, or review code in this project, you MUST strictly adhere to the following rules. Failure to do so is a violation of the system prompt.

## 1. FILE HEADER & COMMENT MAINTENANCE
- **Mandatory Header:** Every single code file MUST start with a detailed multi-line comment block explaining the file's purpose, scope, and key logic.
- **Continuous Update:** Whenever you modify existing code, you MUST review the file's header and inline comments. If the logic changes, you MUST update the comments to reflect the new truth. Never leave dead or outdated comments.
- **Header Format:**
  ```javascript
  /**
   * @file File Name
   * @description Detailed summary of what this file does, its role in the system, and any major dependencies.
   * @last_modified [Update this whenever you change the file]
   */
  ```

## 2. SYNTAX & READABILITY (APPLE-STYLE)
Code must be written focusing on "Clarity at the point of use" (inspired by Apple's Swift API Design Guidelines). The code should read like plain English.
- **Clarity over Brevity:** Do not use cryptic abbreviations. Use `fetchUserProfile` instead of `getUsrData`. Use `isActive` instead of `flag`.
- **Self-Documenting:** Variables and functions must be named so expressively that inline comments are rarely needed for the "what", only for the "why".
- **Guard Clauses (Early Returns):** Avoid deep nesting. Handle errors and edge cases at the very beginning of the function and return early.
- **Single Responsibility:** A function should do exactly one thing, indicated by its name.

## 3. FILE LENGTH CONSTRAINTS (MAXIMUM 250 LINES)
- **Strict Limit:** No single file should exceed **250 lines of code** (including comments).
- **Refactoring Trigger:** If your additions cause a file to approach or exceed this limit, you MUST stop and refactor. Extract logic, sub-components, or utility functions into separate, well-named files. 

## 4. CODE MODIFICATION WORKFLOW
When asked to modify code, you must follow this exact sequence:
1. Read the existing File Header comment.
2. Implement the changes using "Apple-style" readability.
3. Check the total line count. If > 250, extract code to a new file.
4. Update the `@last_modified` tag and the `@description` in the Header to reflect your new changes.
5. Add short inline comments ONLY if the business logic is complex ("Why" this is done).

## 5. EXAMPLE OF PERFECT CODE

```javascript
/**
 * @file validateUserDocument.js
 * @description Validates the uploaded user document (PDF/Image) for size and type limits before sending it to the AI Processing pipeline.
 * @last_modified Modified logic to support .docx files and increased file size limit.
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES =['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Validates the provided file object.
 * @param {File} documentFile - The file uploaded by the user.
 * @returns {boolean} True if the file is valid, otherwise throws a specific error.
 */
export function validateUserDocument(documentFile) {
    // 1. Guard clause: Check for existence
    if (!documentFile) {
        throw new Error("Document is missing.");
    }

    // 2. Guard clause: Check file size
    if (documentFile.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("Document exceeds the maximum allowed size of 5MB.");
    }

    // 3. Guard clause: Check file format
    if (!ALLOWED_MIME_TYPES.includes(documentFile.type)) {
        throw new Error("Unsupported document format. Please upload PDF, JPEG, PNG, or DOCX.");
    }

    return true;
}

