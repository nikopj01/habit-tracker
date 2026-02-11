# AGENTS.md - System Instructions & Architectural Guidelines

## 1. Project Context & Tech Stack
You are working on a full-stack web application. All code generation must adhere strictly to the following stack and architectural decisions.

* **Backend:** .NET 8 Web API
* **Frontend:** React (v18+) with TypeScript
* **Database:** Supabase (PostgreSQL), accessed via Entity Framework Core and Supabase MCP Context.
* **Styling:** Tailwind CSS

---

## 2. Architectural Rules (Strict Enforcement)

### 2.1 Backend Architecture (.NET 8)
The backend **MUST** follow a strict **3-Layer Architecture**. Do not place business logic in Controllers.

1.  **Presentation Layer (Controllers):**
    * Entry point for API requests.
    * Handles DTO mapping and basic input validation.
    * Calls Services.
2.  **Business Logic Layer (Services):**
    * Contains all business rules and complex logic.
    * Calls Repositories.
3.  **Data Access Layer (Repositories):**
    * Handles direct database interactions via Entity Framework Core.
    * Returns Entities to the Service layer.

#### Critical DTO Rule
* **NEVER** expose Database Entities (e.g., `UserEntity`, `OrderEntity`) to the Controller or Client.
* You **MUST** use DTOs (Data Transfer Objects) for all API inputs and outputs.
* *Flow:* Controller receives `CreateUserDto` -> Service converts to `User` entity -> Repository saves `User` -> Service converts result to `UserResponseDto` -> Controller returns `UserResponseDto`.

#### Asynchronous Operations
* All I/O-bound operations (Database calls, External API calls, File I/O) **MUST** use `async` / `await`.
* Controller actions must return `Task<IActionResult>` or `Task<ActionResult<T>>`.

#### Error Handling
* **DO NOT** use `try-catch` blocks in every controller method.
* Implement and use a **Global Exception Handler Middleware** to catch unhandled exceptions and return standardized JSON error responses (RFC 7807 Problem Details).

### 2.2 Frontend Architecture (React + TS)

#### Component Structure
* Use **Functional Components** only. Class components are strictly forbidden.
* Use React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) for logic.
* Keep components small and single-responsibility.

#### Styling & Responsiveness
* **Primary:** Use **Tailwind CSS** utility classes for 99% of styling.
* **Secondary:** Avoid `.css` or `.module.css` files unless implementing complex keyframe animations that Tailwind cannot handle.
* **Responsive Design:** The UI **MUST** be fully responsive.
    * Use Tailwind breakpoints (`md:`, `lg:`) to support both Phone and PC layouts dynamically.
    * Avoid fixed widths (e.g., `width: 500px`) that break on mobile.

#### State Management
* **Preferred:** React Context API (for theme/auth) or Zustand (for complex global state).
* **Forbidden:** Do not use Redux unless the complexity implies a deeply nested state that Zustand cannot handle efficiently.

#### Robustness
* Implement **Error Boundaries** around major layout sections to prevent white-screen crashes.

---

## 3. Data & Security

### 3.1 Database Access (Supabase)
* Use **Entity Framework Core** for data access.
* Utilize the **MCP Supabase Context** tools when context about the database schema or current data is required.

### 3.2 Security
* **Authorization:** Implement Policy-based or Role-based authorization on Controllers using `[Authorize]`.
* **Secrets:**
    * **NEVER** hardcode connection strings, API keys, or secrets in the source code.
    * Always retrieve configuration from `appsettings.json` or Environment Variables using `IConfiguration`.

---

## 4. Coding Standards & Conventions

### 4.1 Naming Conventions
* **C# Classes/Methods/Properties:** `PascalCase`
    * Example: `public class UserService`, `public void GetUserById()`
* **C# Local Variables/Parameters:** `camelCase`
* **TypeScript Components:** `PascalCase`
    * Example: `UserProfile.tsx`
* **TypeScript Variables/Functions/Props:** `camelCase`
    * Example: `const handleClick = () => {}`
* **Interfaces:**
    * C#: Prefix with I (e.g., `IUserService`).
    * TS: No prefix preference, but be consistent (e.g., `UserProps`).

### 4.2 Documentation & Comments
* **Intent over Implementation:** Comments should explain **WHY** code exists or **WHY** a specific decision was made.
* **Self-Documenting:** Prioritize clear variable and method names over redundant comments.
    * *Bad:* `// Check if user is active`
    * *Good:* `if (user.IsActive)`

---

## 5. Definition of Done
When generating code, ensure:
1.  The project builds without errors.
2.  Linter warnings (ESLint/Roslyn) are addressed.
3.  The architectural layers are respected (No DB logic in Controllers).
4.  Secrets are abstracted.