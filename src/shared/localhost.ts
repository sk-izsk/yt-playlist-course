export const isLocalhost = (hostname: string) => ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname)

export const isLocalRequest = (request: Request) => {
  // Next can use its internal localhost address in request.url even for a LAN request.
  const host = request.headers.get("host")
  if (!host) {
    return false
  }
  try {
    return isLocalhost(new URL(`http://${host}`).hostname)
  } catch {
    return false
  }
}
