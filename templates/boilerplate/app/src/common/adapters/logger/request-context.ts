import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  requestId?: string;
  userId?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn);
}

function getRequestContext(): RequestContext {
  return requestContextStorage.getStore() ?? {};
}

function setRequestContext(context: Partial<RequestContext>): void {
  const store = requestContextStorage.getStore();
  if (store) {
    Object.assign(store, context);
  }
}

export {
  getRequestContext,
  runWithRequestContext,
  setRequestContext,
  type RequestContext,
};
