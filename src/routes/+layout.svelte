<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
  import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

  let {children} = $props();
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const persister = createAsyncStoragePersister({
    storage: browser ? window.localStorage : null,
  })
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  <main>
    {@render children()}
  </main>
  <footer>
    Ez lesz majd a footer egyszer
  </footer>
  <SvelteQueryDevtools />
</PersistQueryClientProvider>