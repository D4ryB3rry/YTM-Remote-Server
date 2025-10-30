import type { MockElement, MockEvent, MockKeyboardEvent } from 'happy-dom';

type Matcher = string | RegExp;

type ByRoleOptions = {
  name?: Matcher;
};

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function matches(text: string, matcher?: Matcher): boolean {
  if (!matcher) return true;
  if (typeof matcher === 'string') {
    return normalize(text) === normalize(matcher);
  }
  return matcher.test(text);
}

function getAccessibleName(element: MockElement): string {
  return normalize(element.textContent || '');
}

function inferRole(element: MockElement): string | null {
  const explicit = element.getAttribute('role');
  if (explicit) return explicit;

  switch (element.tagName.toLowerCase()) {
    case 'button':
      return 'button';
    case 'input':
      if (element.type === 'range') return 'slider';
      if (element.type === 'text' || element.type === 'search') return 'textbox';
      return null;
    case 'select':
      return 'combobox';
    case 'a':
      return element.getAttribute('href') ? 'link' : null;
    case 'img':
      return 'img';
    case 'textarea':
      return 'textbox';
    default:
      return null;
  }
}

function traverse(element: MockElement, callback: (node: MockElement) => void): void {
  callback(element);
  element.children.forEach((child) => traverse(child, callback));
}

function queryAllByRole(container: MockElement, role: string, options: ByRoleOptions = {}): MockElement[] {
  const results: MockElement[] = [];
  traverse(container, (node) => {
    const nodeRole = inferRole(node);
    if (nodeRole === role && matches(getAccessibleName(node), options.name)) {
      results.push(node);
    }
  });
  return results;
}

function getAllByRole(container: MockElement, role: string, options?: ByRoleOptions): MockElement[] {
  const results = queryAllByRole(container, role, options);
  if (results.length === 0) {
    throw new Error(`Unable to find role "${role}"`);
  }
  return results;
}

function getByRole(container: MockElement, role: string, options?: ByRoleOptions): MockElement {
  const results = getAllByRole(container, role, options);
  if (results.length > 1) {
    throw new Error(`Found multiple elements with role "${role}"`);
  }
  return results[0];
}

function queryAllByText(container: MockElement, matcher: Matcher): MockElement[] {
  const results: MockElement[] = [];
  traverse(container, (node) => {
    if (matches(node.textContent || '', matcher)) {
      results.push(node);
    }
  });
  return results;
}

function getByText(container: MockElement, matcher: Matcher): MockElement {
  const results = queryAllByText(container, matcher);
  if (results.length === 0) {
    throw new Error('Unable to find text');
  }
  if (results.length > 1) {
    throw new Error('Found multiple elements with the given text');
  }
  return results[0];
}

function queryByText(container: MockElement, matcher: Matcher): MockElement | null {
  return queryAllByText(container, matcher)[0] ?? null;
}

type FireEventInit = {
  target?: Partial<MockElement>;
  key?: string;
};

function dispatch(element: MockElement, type: string, init: FireEventInit = {}): MockEvent {
  if (init.target && init.target.value !== undefined) {
    element.value = String(init.target.value);
  }
  const event: MockEvent = {
    type,
    target: element,
    currentTarget: element,
    ...init,
  } as MockEvent;
  element.dispatchEvent(event);
  return event;
}

function dispatchKeyboard(element: MockElement, type: string, init: FireEventInit = {}): MockKeyboardEvent {
  const event: MockKeyboardEvent = {
    type,
    target: element,
    currentTarget: element,
    key: init.key ?? '',
    ...init,
  } as MockKeyboardEvent;
  element.dispatchEvent(event);
  return event;
}

export const fireEvent = {
  click(element: MockElement): MockEvent {
    return dispatch(element, 'click');
  },
  input(element: MockElement, init: FireEventInit = {}): MockEvent {
    return dispatch(element, 'input', init);
  },
  change(element: MockElement, init: FireEventInit = {}): MockEvent {
    return dispatch(element, 'change', init);
  },
  keyPress(element: MockElement, init: FireEventInit = {}): MockKeyboardEvent {
    return dispatchKeyboard(element, 'keypress', init);
  },
  keyDown(element: MockElement, init: FireEventInit = {}): MockKeyboardEvent {
    return dispatchKeyboard(element, 'keydown', init);
  },
  keyUp(element: MockElement, init: FireEventInit = {}): MockKeyboardEvent {
    return dispatchKeyboard(element, 'keyup', init);
  },
};

function getDocumentBody(): MockElement {
  const doc = (globalThis.document as any);
  if (!doc || !doc.body) {
    throw new Error('Test environment does not provide a document body');
  }
  return doc.body;
}

export const screen = {
  getByRole(role: string, options?: ByRoleOptions): MockElement {
    return getByRole(getDocumentBody(), role, options);
  },
  getByText(matcher: Matcher): MockElement {
    return getByText(getDocumentBody(), matcher);
  },
  queryByText(matcher: Matcher): MockElement | null {
    return queryByText(getDocumentBody(), matcher);
  },
};

export function within(container: MockElement) {
  return {
    getByRole(role: string, options?: ByRoleOptions): MockElement {
      return getByRole(container, role, options);
    },
    queryByText(matcher: Matcher): MockElement | null {
      return queryByText(container, matcher);
    },
    getByText(matcher: Matcher): MockElement {
      return getByText(container, matcher);
    },
  };
}

export { getByRole, getByText, queryByText };
