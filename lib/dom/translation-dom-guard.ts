const GUARD_INSTALLED = Symbol.for("lcw.translationDomGuard");

type GuardedNodePrototype = typeof Node.prototype & {
  [GUARD_INSTALLED]?: true;
};

/**
 * Browser page translation (for example Chrome's built-in Google Translate)
 * replaces text nodes with its own `<font>` wrappers. React still holds the
 * original text nodes, so when it later removes one, `removeChild` throws
 * `NotFoundError` and the commit aborts.
 *
 * This patch skips the removal when the node already left this parent, which
 * is the result React wanted. See https://github.com/facebook/react/issues/11538.
 *
 * @param nodePrototype - Prototype to patch (default `Node.prototype`)
 */
export function installTranslationDomGuard(
  nodePrototype: GuardedNodePrototype = Node.prototype,
) {
  if (nodePrototype[GUARD_INSTALLED]) return;
  nodePrototype[GUARD_INSTALLED] = true;

  const originalRemoveChild = nodePrototype.removeChild;
  nodePrototype.removeChild = function removeChild<T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (child.parentNode !== this) {
      console.warn(
        "removeChild skipped: node is no longer a child of this parent (page translation or an extension changed the DOM).",
      );
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}
