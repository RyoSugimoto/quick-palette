const MINIMUM_NODE_MAJOR = 22;

export function assertSupportedNodeVersion(version = process.versions.node): void {
  const major = Number.parseInt(version.split(".")[0] ?? "", 10);
  if (!Number.isInteger(major) || major < MINIMUM_NODE_MAJOR) {
    throw new Error(
      `Node.js ${MINIMUM_NODE_MAJOR} or later is required (current: ${version}).`,
    );
  }
}
