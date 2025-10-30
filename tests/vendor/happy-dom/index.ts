export type EventListener = (event: any) => void;

class MockClassList {
  private classes = new Set<string>();

  constructor(initial?: string) {
    if (initial) {
      initial
        .split(/\s+/)
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => this.classes.add(c));
    }
  }

  add(...tokens: string[]): void {
    tokens.forEach((token) => {
      if (!token) return;
      this.classes.add(token);
    });
  }

  remove(...tokens: string[]): void {
    tokens.forEach((token) => this.classes.delete(token));
  }

  contains(token: string): boolean {
    return this.classes.has(token);
  }

  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.classes.add(token);
      return true;
    }
    if (force === false) {
      this.classes.delete(token);
      return false;
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    }
    this.classes.add(token);
    return true;
  }

  toString(): string {
    return Array.from(this.classes).join(' ');
  }

  get value(): string {
    return this.toString();
  }
}

export class MockEvent {
  type: string;
  target: any;
  currentTarget: any;
  key?: string;

  constructor(type: string, init: Record<string, any> = {}) {
    this.type = type;
    this.target = init.target ?? null;
    this.currentTarget = init.currentTarget ?? null;
    Object.assign(this, init);
  }
}

export class MockKeyboardEvent extends MockEvent {
  constructor(type: string, init: Record<string, any> = {}) {
    super(type, init);
    this.key = init.key ?? '';
  }
}

export class MockElement {
  readonly tagName: string;
  readonly style: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly classList: MockClassList;
  readonly attributes = new Map<string, string>();
  readonly children: MockElement[] = [];
  value = '';
  type = '';
  private _id = '';
  private _textContent = '';
  private _innerHTML = '';
  private listeners = new Map<string, EventListener[]>();
  private innerHTMLHandler?: (html: string, element: MockElement) => void;
  parentElement: MockElement | null = null;
  private _lang = '';

  constructor(private document: MockDocument, tagName: string) {
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    if (this._id) {
      this.document.unregisterElement(this._id);
    }
    this._id = value;
    if (value) {
      this.document.registerElement(value, this);
    }
  }

  get textContent(): string {
    if (this.children.length === 0) {
      return this._textContent;
    }
    if (this._textContent) {
      return this._textContent;
    }
    return this.children.map((child) => child.textContent).join('');
  }

  set textContent(value: string) {
    this._textContent = value;
  }

  get innerHTML(): string {
    return this._innerHTML;
  }

  set innerHTML(value: string) {
    this._innerHTML = value;
    this.children.splice(0, this.children.length);
    this.innerHTMLHandler?.(value, this);
  }

  get lang(): string {
    const attr = this.getAttribute('lang');
    return attr ?? this._lang;
  }

  set lang(value: string) {
    this._lang = value;
    this.setAttribute('lang', value);
  }

  setInnerHTMLHandler(handler: (html: string, element: MockElement) => void): void {
    this.innerHTMLHandler = handler;
  }

  appendChild(child: MockElement): MockElement {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: MockElement): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentElement = null;
    }
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event: MockEvent): boolean {
    event.target = event.target ?? this;
    event.currentTarget = this;
    const listeners = this.listeners.get(event.type) ?? [];
    listeners.forEach((listener) => listener(event));
    return listeners.length > 0;
  }

  click(): void {
    this.dispatchEvent(new MockEvent('click'));
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'class') {
      this.classList.remove(...this.classList.value.split(/\s+/));
      this.classList.add(...value.split(/\s+/));
    }
    if (name.startsWith('data-')) {
      const dataKey = name.replace('data-', '').replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
      this.dataset[dataKey] = value;
    }
    if (name === 'value') {
      this.value = value;
    }
    if (name === 'type') {
      this.type = value;
    }
  }

  getAttribute(name: string): string | null {
    if (name === 'class') {
      return this.classList.value;
    }
    if (name === 'value') {
      return this.value;
    }
    if (name === 'type') {
      return this.type;
    }
    return this.attributes.get(name) ?? null;
  }

  matches(selector: string): boolean {
    selector = selector.trim();
    if (!selector) return false;

    if (selector === '*') {
      return true;
    }

    if (selector.startsWith('#')) {
      return this.id === selector.slice(1);
    }

    if (selector.startsWith('.')) {
      return this.classList.contains(selector.slice(1));
    }

    if (selector.startsWith('[') && selector.endsWith(']')) {
      const content = selector.slice(1, -1);
      if (content.startsWith('data-')) {
        const key = content
          .replace('data-', '')
          .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
        return Object.prototype.hasOwnProperty.call(this.dataset, key);
      }
      return this.attributes.has(content);
    }

    const [tag, className] = selector.split('.');
    if (className) {
      return this.matches(tag) && this.matches(`.${className}`);
    }

    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelectorAll(selector: string): MockElement[] {
    const matches: MockElement[] = [];

    const search = (element: MockElement) => {
      if (element.matches(selector)) {
        matches.push(element);
      }
      element.children.forEach((child) => search(child));
    };

    this.children.forEach((child) => search(child));
    return matches;
  }

  querySelector(selector: string): MockElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

class MockDocument {
  readonly documentElement: MockElement;
  readonly body: MockElement;
  title = '';
  private elementsById = new Map<string, MockElement>();
  private listeners = new Map<string, EventListener[]>();

  constructor(public readonly defaultView: any) {
    this.documentElement = new MockElement(this, 'html');
    this.documentElement.setAttribute('lang', 'en');
    this.body = new MockElement(this, 'body');
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName: string): MockElement {
    return new MockElement(this, tagName);
  }

  getElementById(id: string): MockElement | null {
    return this.elementsById.get(id) ?? null;
  }

  registerElement(id: string, element: MockElement): void {
    this.elementsById.set(id, element);
  }

  unregisterElement(id: string): void {
    this.elementsById.delete(id);
  }

  querySelectorAll(selector: string): MockElement[] {
    return this.documentElement.querySelectorAll(selector);
  }

  querySelector(selector: string): MockElement | null {
    return this.documentElement.querySelector(selector);
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  }

  dispatchEvent(event: MockEvent): void {
    event.target = event.target ?? this;
    const listeners = this.listeners.get(event.type) ?? [];
    listeners.forEach((listener) => listener(event));
  }

  reset(): void {
    this.body.children.splice(0, this.body.children.length);
    this.elementsById.clear();
    this.title = '';
    this.documentElement.setAttribute('lang', 'en');
  }
}

export class GlobalWindow {
  readonly document: MockDocument;
  readonly navigator: { languages: string[]; language: string };

  constructor() {
    this.navigator = { languages: [], language: 'en-US' };
    this.document = new MockDocument(this);
  }

  setInterval(handler: (...args: any[]) => void, timeout?: number): number {
    return setInterval(handler, timeout) as unknown as number;
  }

  clearInterval(handle: number): void {
    clearInterval(handle);
  }

  setTimeout(handler: (...args: any[]) => void, timeout?: number): number {
    return setTimeout(handler, timeout) as unknown as number;
  }

  clearTimeout(handle: number): void {
    clearTimeout(handle);
  }
}

