import { GlobalWindow, MockDocument, MockElement, MockEvent, MockKeyboardEvent } from 'happy-dom';

let initialized = false;
let windowInstance: GlobalWindow;
let documentInstance: MockDocument;

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    get length(): number {
      return store.size;
    },
  };
}

function installGlobals(): void {
  windowInstance = new GlobalWindow();
  documentInstance = windowInstance.document;

  const storageFactory = createStorage;

  Object.assign(globalThis, {
    window: windowInstance,
    document: documentInstance,
    navigator: windowInstance.navigator,
    localStorage: storageFactory(),
    sessionStorage: storageFactory(),
    Event: MockEvent,
    KeyboardEvent: MockKeyboardEvent,
    HTMLElement: MockElement,
    HTMLInputElement: MockElement,
    HTMLButtonElement: MockElement,
    HTMLDivElement: MockElement,
    Image: class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src = '';
      get src(): string {
        return this._src;
      }
      set src(value: string) {
        this._src = value;
        queueMicrotask(() => {
          if (value.includes('fail')) {
            this.onerror?.();
          } else {
            this.onload?.();
          }
        });
      }
    },
    alert: (..._args: unknown[]) => {
      // No-op stub for alert usage in tests
    },
    requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16),
    cancelAnimationFrame: (handle: number) => clearTimeout(handle),
  });
}

export function initTestEnv(): void {
  if (initialized) return;
  installGlobals();
  initialized = true;
}

export function resetDom(): void {
  documentInstance.reset();
  (globalThis.localStorage as ReturnType<typeof createStorage>).clear();
  (globalThis.sessionStorage as ReturnType<typeof createStorage>).clear();
  windowInstance.navigator.languages = [];
  windowInstance.navigator.language = 'en-US';
}

export function getDocument(): MockDocument {
  return documentInstance;
}

export function getWindow(): GlobalWindow {
  return windowInstance;
}

type ElementOptions = {
  id?: string;
  textContent?: string;
  classNames?: string[];
  dataset?: Record<string, string>;
  type?: string;
  value?: string;
  parent?: MockElement;
};

export function createTestElement(tagName: string, options: ElementOptions = {}): MockElement {
  const element = documentInstance.createElement(tagName);
  if (options.id) element.id = options.id;
  if (options.textContent) element.textContent = options.textContent;
  if (options.classNames) element.classList.add(...options.classNames);
  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      element.dataset[key] = value;
    }
  }
  if (options.type) {
    element.type = options.type;
    element.setAttribute('type', options.type);
  }
  if (options.value !== undefined) {
    element.value = options.value;
    element.setAttribute('value', options.value);
  }
  (options.parent ?? documentInstance.body).appendChild(element);
  return element;
}

export { MockElement };
