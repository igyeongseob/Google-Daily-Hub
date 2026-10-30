import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';

type TodoTask = {
  id: string;
  title: string;
  completed: boolean;
};

const STORAGE_KEY = 'daily-start-todos-v1';

const DEFAULT_TASKS: TodoTask[] = [
  { id: 'spring-study', title: 'Java Spring 기초 공부하기', completed: false },
  { id: 'exercise', title: '운동 하기', completed: false },
  { id: 'reading', title: '독서 하기', completed: false },
];

function isTodoTask(value: unknown): value is TodoTask {
  if (typeof value !== 'object' || value === null) return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean'
  );
}

function parseTasks(value: string | null): TodoTask[] {
  if (value === null) return DEFAULT_TASKS;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isTodoTask) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function loadTasks(): TodoTask[] {
  try {
    return parseTasks(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_TASKS;
  }
}

export default function TodoList() {
  const [tasks, setTasks] = useState<TodoTask[]>(loadTasks);
  const [draft, setDraft] = useState('');
  const [storageWarning, setStorageWarning] = useState('');

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );
  const remainingCount = tasks.length - completedCount;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setStorageWarning('');
    } catch {
      setStorageWarning('이 브라우저에서는 할 일 목록을 저장할 수 없어요.');
    }
  }, [tasks]);

  useEffect(() => {
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setTasks(parseTasks(event.newValue));
    }

    window.addEventListener('storage', syncAcrossTabs);
    return () => window.removeEventListener('storage', syncAcrossTabs);
  }, []);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    setTasks((current) => [
      ...current,
      { id: crypto.randomUUID(), title, completed: false },
    ]);
    setDraft('');
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  return (
    <section className="todo-section" aria-labelledby="todo-heading">
      <header className="todo-heading-row">
        <div>
          <p className="eyebrow">오늘의 작은 목표</p>
          <h2 id="todo-heading">오늘의 할 일</h2>
        </div>
        <div className="todo-counts" aria-live="polite" data-testid="todo-counts">
          <span><strong>{remainingCount}</strong> 남음</span>
          <span className="todo-count-divider" aria-hidden="true" />
          <span><strong>{completedCount}</strong> 완료</span>
        </div>
      </header>

      <form className="todo-form" onSubmit={addTask}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="새로운 할 일을 적어보세요"
          aria-label="새로운 할 일"
          maxLength={120}
          data-testid="input-new-todo"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          data-testid="button-add-todo"
        >
          <Plus size={17} aria-hidden="true" />
          <span>추가</span>
        </button>
      </form>

      {storageWarning && (
        <p className="todo-storage-warning" role="status">
          {storageWarning}
        </p>
      )}

      {tasks.length > 0 ? (
        <ul className="todo-list">
          {tasks.map((task) => (
            <li
              className={`todo-row${task.completed ? ' is-completed' : ''}`}
              key={task.id}
              data-testid={`todo-item-${task.id}`}
            >
              <label className="todo-label">
                <input
                  className="todo-checkbox"
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  aria-label={`${task.title} 완료`}
                  data-testid={`checkbox-todo-${task.id}`}
                />
                <span
                  className="todo-title"
                  data-testid={`text-todo-title-${task.id}`}
                >
                  {task.title}
                </span>
              </label>
              <span className="todo-check-mark" aria-hidden="true">
                {task.completed ? '완료' : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="todo-empty" role="status">
          오늘의 할 일을 모두 마쳤어요.
        </p>
      )}
    </section>
  );
}
