# Knowledge Graph Focus Follow Click Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the knowledge graph focus follow the user's clicked node and remove the entity breakdown caption so the overview only shows the total entity count.

**Architecture:** Keep the change source as the initial entry node, but promote the page's focus node into mutable UI state that updates whenever the user selects or expands a node. Remove the entity metric caption at the sidebar layer so the count display remains centralized in the existing display-metrics helper.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library

---

### Task 1: Lock The Desired Page Behavior With Tests

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing tests**

- Update the initial render test to assert the entity breakdown caption is absent.
- Update the selection test to assert the left “当前焦点” card follows the clicked `Battery Pack` node.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: FAIL because the sidebar still renders the breakdown caption and focus still stays on `CPU Module`.

**Step 3: Write minimal implementation**

- Remove the entity caption from the overview metric card.
- Make page focus state mutable and update it on node selection / expansion.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-30-knowledge-graph-focus-follow-click-design.md docs/plans/2026-03-30-knowledge-graph-focus-follow-click.md src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/features/knowledge-graph/KnowledgeGraphSidebar.tsx
git commit -m "feat: make knowledge graph focus follow selection"
```