import { test, expect, type Locator, type Page } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };

const COLUMN_ORDER = [
  'todo',
  'in_progress',
  'review',
  'blocked',
  'done',
] as const;

type ColumnStatus = (typeof COLUMN_ORDER)[number];

async function dragTask(
  page: Page,
  sourceTask: Locator,
  targetDropzone: Locator,
) {
  const sourceBox = await sourceTask.boundingBox();
  const targetBox = await targetDropzone.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Cannot drag task: source or target is not visible.');
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + Math.min(targetBox.height / 2, 220);

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move((sourceX + targetX) / 2, (sourceY + targetY) / 2, {
    steps: 8,
  });
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();
}

function columnTasks(page: Page, status: ColumnStatus) {
  return page.locator(
    `[data-testid="kanban-column-${status}"] [data-testid^="kanban-task-"]`,
  );
}

test.describe('Operations drag and drop', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('can move a task between columns and restore it', async ({ page }) => {
    await page.goto('/operations', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });
    await page.waitForTimeout(800);

    await expect(page).not.toHaveURL(/\/auth(?:$|\?)/);

    let sourceStatus: ColumnStatus | null = null;
    let sourceTask: Locator | null = null;

    for (const status of COLUMN_ORDER) {
      const tasks = columnTasks(page, status);
      if ((await tasks.count()) > 0) {
        sourceStatus = status;
        sourceTask = tasks.first();
        break;
      }
    }

    expect(
      sourceStatus,
      'No tasks available for drag-and-drop test. Seed at least one task in /operations.',
    ).toBeTruthy();

    expect(sourceTask).toBeTruthy();

    const targetStatus =
      sourceStatus === 'in_progress' ? 'review' : 'in_progress';

    const taskTestId = await sourceTask!.getAttribute('data-testid');
    const taskId = taskTestId?.replace('kanban-task-', '');
    expect(taskId, 'Dragged task id should be available.').toBeTruthy();

    await dragTask(
      page,
      sourceTask!,
      page.locator(`[data-testid="kanban-dropzone-${targetStatus}"]`),
    );
    await page.waitForTimeout(700);

    await expect(
      page.locator(
        `[data-testid="kanban-column-${targetStatus}"] [data-testid="kanban-task-${taskId}"]`,
      ),
    ).toBeVisible();

    const movedTask = page.locator(
      `[data-testid="kanban-column-${targetStatus}"] [data-testid="kanban-task-${taskId}"]`,
    );

    await dragTask(
      page,
      movedTask,
      page.locator(`[data-testid="kanban-dropzone-${sourceStatus}"]`),
    );
    await page.waitForTimeout(700);

    await expect(
      page.locator(
        `[data-testid="kanban-column-${sourceStatus}"] [data-testid="kanban-task-${taskId}"]`,
      ),
    ).toBeVisible();
  });
});
