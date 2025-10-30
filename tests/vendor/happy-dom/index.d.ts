export type EventListener = (event: any) => void;

export class MockEvent {
  constructor(type: string, init?: Record<string, any>);
  type: string;
  target: any;
  currentTarget: any;
  key?: string;
}

export class MockKeyboardEvent extends MockEvent {
  constructor(type: string, init?: Record<string, any>);
}

export class MockElement {
  readonly tagName: string;
  readonly style: Record<string, string>;
  readonly dataset: Record<string, string>;
  readonly classList: { add: (...tokens: string[]) => void; remove: (...tokens: string[]) => void; contains: (token: string) => boolean; toggle: (token: string, force?: boolean) => boolean; value: string };
  readonly attributes: Map<string, string>;
  readonly children: MockElement[];
  value: string;
  type: string;
  id: string;
  textContent: string;
  innerHTML: string;
  parentElement: MockElement | null;
  setInnerHTMLHandler(handler: (html: string, element: MockElement) => void): void;
  appendChild(child: MockElement): MockElement;
  removeChild(child: MockElement): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: MockEvent): boolean;
  click(): void;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  matches(selector: string): boolean;
  querySelectorAll(selector: string): MockElement[];
  querySelector(selector: string): MockElement | null;
}

export class MockDocument {
  readonly documentElement: MockElement;
  readonly body: MockElement;
  title: string;
  constructor(defaultView: any);
  createElement(tagName: string): MockElement;
  getElementById(id: string): MockElement | null;
  registerElement(id: string, element: MockElement): void;
  unregisterElement(id: string): void;
  querySelectorAll(selector: string): MockElement[];
  querySelector(selector: string): MockElement | null;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: MockEvent): void;
  reset(): void;
}

export class GlobalWindow {
  readonly document: MockDocument;
  readonly navigator: { languages: string[]; language: string };
  constructor();
  setInterval(handler: (...args: any[]) => void, timeout?: number): number;
  clearInterval(handle: number): void;
  setTimeout(handler: (...args: any[]) => void, timeout?: number): number;
  clearTimeout(handle: number): void;
}
