// Helper server-side per chiamare proxy.royaleapi.dev con la chiave dal runtimeConfig.
// Mai esporre crApiKey al client.
export async function crFetch<T>(path: string): Promise<T> {
  const config = useRuntimeConfig()
  const url = `${config.crProxyUrl}${path}`
  return await $fetch<T>(url, {
    headers: { Authorization: `Bearer ${config.crApiKey}` },
  })
}
