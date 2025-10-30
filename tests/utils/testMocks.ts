export type MockFn<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => ReturnType<T>) & {
  mock: {
    calls: Array<Parameters<T>>;
  };
  mockImplementation: (impl: T) => MockFn<T>;
  mockReturnValue: (value: ReturnType<T>) => MockFn<T>;
  mockReturnValueOnce: (value: ReturnType<T>) => MockFn<T>;
  mockResolvedValue: (value: any) => MockFn<T>;
  mockResolvedValueOnce: (value: any) => MockFn<T>;
  mockRejectedValue: (value: any) => MockFn<T>;
  mockRejectedValueOnce: (value: any) => MockFn<T>;
  mockClear: () => void;
};

const activeSpies: Array<() => void> = [];

export function createMockFn<T extends (...args: any[]) => any>(implementation?: T): MockFn<T> {
  const queue: Array<(...args: Parameters<T>) => ReturnType<T>> = [];
  let defaultImpl = implementation;

  const fn = ((...args: Parameters<T>) => {
    (fn as MockFn<T>).mock.calls.push(args);
    if (queue.length > 0) {
      const next = queue.shift()!;
      return next(...args);
    }
    if (defaultImpl) {
      return defaultImpl(...args);
    }
    return undefined as ReturnType<T>;
  }) as MockFn<T>;

  fn.mock = { calls: [] as Array<Parameters<T>> };

  fn.mockImplementation = (impl: T) => {
    defaultImpl = impl;
    return fn;
  };

  fn.mockReturnValue = (value: ReturnType<T>) => {
    defaultImpl = ((() => value) as unknown) as T;
    return fn;
  };

  fn.mockReturnValueOnce = (value: ReturnType<T>) => {
    queue.push((() => value) as (...args: Parameters<T>) => ReturnType<T>);
    return fn;
  };

  fn.mockResolvedValue = (value: any) => {
    defaultImpl = ((() => Promise.resolve(value)) as unknown) as T;
    return fn;
  };

  fn.mockResolvedValueOnce = (value: any) => {
    queue.push((() => Promise.resolve(value)) as (...args: Parameters<T>) => ReturnType<T>);
    return fn;
  };

  fn.mockRejectedValue = (value: any) => {
    defaultImpl = ((() => Promise.reject(value)) as unknown) as T;
    return fn;
  };

  fn.mockRejectedValueOnce = (value: any) => {
    queue.push((() => Promise.reject(value)) as (...args: Parameters<T>) => ReturnType<T>);
    return fn;
  };

  fn.mockClear = () => {
    fn.mock.calls = [];
    queue.length = 0;
    defaultImpl = implementation;
  };

  return fn;
}

export function spyOn<T extends object, K extends keyof T>(target: T, key: K): MockFn<T[K]> {
  const original = target[key];
  const mockFn = createMockFn(original as unknown as (...args: any[]) => any) as MockFn<T[K]>;
  (target as Record<string, unknown>)[key as string] = mockFn as unknown as T[K];
  activeSpies.push(() => {
    (target as Record<string, unknown>)[key as string] = original;
  });
  return mockFn;
}

export function restoreAllSpies(): void {
  while (activeSpies.length > 0) {
    const restore = activeSpies.pop();
    restore?.();
  }
}
