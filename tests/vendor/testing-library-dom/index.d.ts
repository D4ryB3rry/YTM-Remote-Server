import type { MockElement, MockEvent, MockKeyboardEvent } from 'happy-dom';

type Matcher = string | RegExp;

type ByRoleOptions = {
  name?: Matcher;
};

type FireEventInit = {
  target?: Partial<MockElement>;
  key?: string;
};

export declare const fireEvent: {
  click(element: MockElement): MockEvent;
  input(element: MockElement, init?: FireEventInit): MockEvent;
  change(element: MockElement, init?: FireEventInit): MockEvent;
  keyPress(element: MockElement, init?: FireEventInit): MockKeyboardEvent;
  keyDown(element: MockElement, init?: FireEventInit): MockKeyboardEvent;
  keyUp(element: MockElement, init?: FireEventInit): MockKeyboardEvent;
};

export declare const screen: {
  getByRole(role: string, options?: ByRoleOptions): MockElement;
  getByText(matcher: Matcher): MockElement;
  queryByText(matcher: Matcher): MockElement | null;
};

export declare function within(container: MockElement): {
  getByRole(role: string, options?: ByRoleOptions): MockElement;
  getByText(matcher: Matcher): MockElement;
  queryByText(matcher: Matcher): MockElement | null;
};

export declare function getByRole(container: MockElement, role: string, options?: ByRoleOptions): MockElement;
export declare function getByText(container: MockElement, matcher: Matcher): MockElement;
export declare function queryByText(container: MockElement, matcher: Matcher): MockElement | null;
