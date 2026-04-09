## Git Workflow

- Default branch for new work: `development`
- Branch from another feature branch only when there is a dependency on unmerged work.
  Merge back to the same branch you started from.
- Branch naming:
  - `feature/<human-readable-name>` for new features
  - `fix/<human-readable-name>` for bug fixes
- All commits use Conventional Commits:
  - `feat(scope): description` for new features
  - `fix(scope): description` for bug fixes
  - `refactor(scope): description` for restructuring
  - `test(scope): description` for test changes
  - `docs(scope): description` for documentation
  - `chore(scope): description` for maintenance
- Never commit as "Claude" — use the project's git user config.


## Pull Requests

<!-- ADAPT: Configure your issue tracker link format -->
- Every PR description must include a link to the related issue(s) in the project tracker.
- Format:
```
  ## Related Tasks
  - [Task name](<issue-tracker-url>/<task-id>)
```
- If the PR covers a parent issue with subtasks, link the parent issue.
- If the PR covers multiple standalone issues, link all of them.

## Boy Scout Rule

Leave every file you touch cleaner than you found it. When working on a task, if you encounter code in the files you are already modifying that violates the conventions in this document (imperative loops that should be functional, tests with weak assertions, missing `describe` groups, mutable state that should be immutable, etc.), fix it as part of the same change. Keep the scope reasonable — refactor what you touch, don't go hunting across the entire codebase. Over time, this ensures the codebase converges to the agreed standards incrementally.

## Architecture

<!-- ADAPT: Replace with your project's architecture. Below is a Clean Architecture example. -->
This project follows Clean Architecture with strict layered dependency rules:

```
Domain (entities, repository interfaces, use cases)
    ^
    | depends on
    |
Data (concrete repository implementations)
    ^
    | wired via
    |
API / Presentation (routes, UI, CLI → dependencies → use cases → repositories)
```

### Hard Rules

- **Dependency Rule**: outer layers depend on inner layers, never the reverse. Domain has zero infrastructure dependencies.
- **Repository pattern**: all external data access (APIs, databases, filesystems) goes through repository interfaces defined in the domain layer, with concrete implementations in the data layer.
- **Presentation is wiring only.** Route handlers / CLI commands parse input, call the application layer, and return results. No business logic, no direct I/O.
- **No duplicated logic across components.** If two components share identical behavior, extract it into a shared utility immediately — not in a follow-up.

<!-- ADAPT: Add project-specific hard rules (e.g., ApiDependencies, DTO locations, hook conventions) -->

## Code Style

### Functional Programming and Immutability

Prefer declarative, functional patterns over imperative loops with mutable state:

- Use `array.flatMap(...)` instead of `for...of` + `results.push(...)` with a mutable accumulator.
- Use `array.find(...)` instead of `for...of` loops that search and break.
- Use `Array.from(...).reduce(...)` instead of `for` loops with manual index tracking and mutable variables.
- Avoid mutating function arguments or shared state in place — return new objects/arrays instead.
- When a loop body is a pure transformation, express it as `map`/`flatMap`/`filter`/`reduce`.
- Apply immutability comprehensively at the file level, not just per-function. Use `Readonly<T>` for data structures that should not be mutated after creation.
- Prefer composition over inheritance when structuring modules and behavior. Build functionality by composing small, focused functions rather than deep class hierarchies.

### TypeScript

- **Derive union types from const arrays.** When a union type also needs runtime values (e.g., for iteration or validation), define a `const` array first and derive the type from it. Never use unsafe `as Type[]` casts.
  ```ts
  // Good
  const statuses = ["pending", "active", "done"] as const;
  type Status = (typeof statuses)[number];

  // Bad
  type Status = "pending" | "active" | "done";
  const statuses = ["pending", "active", "done"] as Status[];
  ```

### Test Quality

Write tests that validate behavior precisely and are easy to maintain:

- **Assert concrete values.** Never write `expect(result).toBeDefined()` or `expect(value).toBeTruthy()` when you can assert the exact expected value (e.g., `expect(result).toEqual({ startLine: 2, endLine: 5 })`).
- **Group with `describe`.** Organize related tests under `describe` blocks by feature or scenario.
- **Use helpers to reduce repetition.** Extract common setup into helper functions so each test only specifies what varies.
- **Extract constants for repeated strings.** Class names, paths, error messages, and other repeated literals should be constants, not duplicated strings.
- **Remove redundant tests.** If a behavior is already covered by another test, don't add a weaker test that only checks a subset. Either make it a distinct contract test with a comment explaining why, or remove it.

## CI / Automated Checks

- When CI workflows are added, do not restrict the `pull_request` trigger to specific branches — leave it unrestricted so all PRs get checked regardless of branch naming. Listing patterns like `feature/**` is fragile and misses other conventions (`fix/**`, `hotfix/**`, etc.). Keep `push` triggers limited to `master` and `development`.
- Every PR should get automated feedback (lint, type-check, tests) before merge.

## After Every Feature Change

After implementing any feature addition, modification, or bug fix, always update **all** of the following before considering the work done:

<!-- ADAPT: Adjust this checklist to your project's artifacts -->
1. **README.md** — Update command docs, examples, and feature list if the change affects user-facing behavior.
2. **PR description** — Check for an open PR on the current branch (`gh pr view`). If one exists, update its summary and test plan to reflect the latest changes (`gh pr edit`).
3. **OpenSpec specs** — If the change relates to an existing spec in `openspec/specs/`, update the relevant requirements and scenarios. Also update the archived copy in `openspec/changes/archive/` if it exists.
4. **UI designs** — If the change adds or modifies UI components, create or update the `.pen` files in Pencil and re-export PNGs.

This checklist applies to every code change, not just the initial implementation.

## Pre-Commit Self-Review

Before every commit, verify the following against the changed files. Do not commit until all items pass:

<!-- ADAPT: Adjust these items to match your project's architecture and conventions -->
1. **Architecture** — Does the code respect the dependency rule? Is there any direct I/O bypassing the proper layers?
2. **Patterns** — Does new code follow the same patterns as existing code in the same layer? (Check at least one existing sibling file for reference.)
3. **Functional style** — Are there any `for` loops with mutable accumulators that should be `map`/`flatMap`/`filter`/`reduce`/`Object.fromEntries`?
4. **Test assertions** — Are all assertions concrete values (`toEqual`, `toBe`)? No `toBeDefined`, `toBeTruthy`, `toHaveProperty` when an exact value is knowable?
5. **No duplication** — Is any logic copy-pasted between files? Extract it.
6. **Separation of concerns** — Is business logic properly separated from presentation/wiring?
7. **Immutability** — Are new data structures using `Readonly<T>` / `ReadonlyArray<T>` where appropriate?
8. **Boy Scout Rule** — In the files you touched, are there pre-existing violations of these rules? Fix them.
