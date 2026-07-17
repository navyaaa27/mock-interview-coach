# Git Commit Rules

These rules apply to every commit made in this project. Follow them strictly, without exception.

## 1. One concern per commit
Never bundle unrelated changes into one commit. Break work into the smallest logical, working unit and commit each one separately. If a change touches more than one concern, tell the user it should be split into multiple commits instead of committing it all together.

## 2. Always confirm before committing
Before running `git commit`, show the user:
- A summary of the staged diff
- The proposed commit message

Then **wait for explicit confirmation** before proceeding.

## 3. Conventional Commits format
Commit messages must follow Conventional Commits:

```
<type>(<scope>): <short description>
```

- One line, under 72 characters
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Example: `feat(feedback): replace frosted glass with gradient borders`

## 4. No changelog-style messages
Do not write multi-bullet changelog-style commit messages. One short description line only.

## 5. Never commit generated or temporary files
Do not commit:
- Log files (`*.log`)
- Test output dumps (`*.txt`)
- Build artifacts (`dist/`)

Add these to `.gitignore` instead if they are not already covered.
