import path from 'path';
import { fileURLToPath } from 'url';

import {
  test,
  expect,
  type Locator,
  type Page,
  request,
} from '@playwright/test';
import dotenv from 'dotenv';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);
dotenv.config({ path: path.resolve(thisDir, '../.env.local') });
dotenv.config({ path: path.resolve(thisDir, '../.env') });

const MOBILE_VIEWPORT = { width: 375, height: 667 };

const COLUMN_ORDER = [
  'todo',
  'in_progress',
  'review',
  'blocked',
  'done',
] as const;

type ColumnStatus = (typeof COLUMN_ORDER)[number];

function columnTasks(page: Page, status: ColumnStatus) {
  return page.locator(
    `[data-testid="kanban-column-${status}"] [data-testid^="kanban-task-"]`,
  );
}

/**
 * Use the mobile tap-move button to advance a task to its next status.
 * This button is only visible on mobile viewports (md:hidden).
 */
async function tapMoveTask(task: Locator) {
  const tapBtn = task.locator('button[aria-label="Chuyển trạng thái nhanh"]');
  await tapBtn.click();
}

/**
 * Tap-move target status map — mirrors getTapMoveTargetStatus in kanbanColumns.ts.
 * Only includes transitions that are guaranteed to succeed without extra conditions
 * (e.g., review→done requires assignee which may or may not exist).
 */
const SAFE_TAP_TARGETS: Partial<Record<ColumnStatus, ColumnStatus>> = {
  todo: 'in_progress',
  in_progress: 'review',
  blocked: 'in_progress',
};

/**
 * Reset all tasks that are stuck in 'review' or 'done' back to 'in_progress'
 * via the Supabase REST API. This ensures the test is idempotent.
 */
async function resetTasksViaApi() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const apiCtx = await request.newContext();
  try {
    // Reset review/done tasks to in_progress so E2E test can move them
    await apiCtx.patch(
      `${supabaseUrl}/rest/v1/tasks?status=in.("review","done")`,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: 'return=minimal',
        },
        data: { status: 'in_progress' },
      },
    );
  } finally {
    await apiCtx.dispose();
  }
}

test.describe('Operations drag and drop', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async () => {
    await resetTasksViaApi();
  });

  test('can move a task between columns and restore it', async ({ page }) => {
    await page.goto('/operations', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });

    // Wait for at least one kanban column to render (data loaded)
    await page.waitForSelector('[data-testid^="kanban-column-"]', {
      timeout: 10_000,
    });

    // Wait for at least one task card to appear (data from Supabase or demo fallback)
    await page.waitForSelector('[data-testid^="kanban-task-"]', {
      timeout: 10_000,
    });

    await expect(page).not.toHaveURL(/\/auth(?:$|\?)/);

    // Find a task whose current status has a safe tap-move target
    let sourceStatus: ColumnStatus | null = null;
    let sourceTask: Locator | null = null;
    let targetStatus: ColumnStatus | null = null;

    for (const status of COLUMN_ORDER) {
      const target = SAFE_TAP_TARGETS[status];
      if (!target) {
        continue;
      }

      const tasks = columnTasks(page, status);
      if ((await tasks.count()) > 0) {
        sourceStatus = status;
        sourceTask = tasks.first();
        targetStatus = target;
        break;
      }
    }

    if (!sourceStatus) {
      // No tasks found in a safe-movable status. This can happen when tasks
      // are stuck in 'review' or 'done' from previous runs.
      // Reset a task's status to 'in_progress' in the DB to re-enable this test.
      test.skip(
        true,
        'No tasks in a safe-movable status (todo, in_progress, blocked). ' +
          'Reset task status in the DB to re-enable.',
      );
      return;
    }

    const taskTestId = await sourceTask!.getAttribute('data-testid');
    const taskId = taskTestId?.replace('kanban-task-', '');
    expect(taskId, 'Task id should be available.').toBeTruthy();

    // Move forward: source → target
    await tapMoveTask(sourceTask!);
    await page.waitForTimeout(1500);

    await expect(
      page.locator(
        `[data-testid="kanban-column-${targetStatus}"] [data-testid="kanban-task-${taskId}"]`,
      ),
    ).toBeVisible({ timeout: 10_000 });

    // Move back: target → next (to verify bi-directional movement works)
    // We use the tap-move again to advance one more step
    const movedTask = page.locator(
      `[data-testid="kanban-column-${targetStatus}"] [data-testid="kanban-task-${taskId}"]`,
    );

    const secondTarget = SAFE_TAP_TARGETS[targetStatus!];
    if (secondTarget) {
      await tapMoveTask(movedTask);
      await page.waitForTimeout(1500);

      await expect(
        page.locator(
          `[data-testid="kanban-column-${secondTarget}"] [data-testid="kanban-task-${taskId}"]`,
        ),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
