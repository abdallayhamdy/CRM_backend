export interface Workspace {
  id: string
  name: string
}

/**
 * Standalone mock: returns a fake workspace.
 */
export async function resolveWorkspace(_orgId: string): Promise<Workspace | null> {
  return {
    id: 'ws_mock_001',
    name: 'Mock Workspace',
  }
}

/**
 * Standalone mock: returns null (no admin client needed).
 */
export function createAdminClient() {
  return null as any
}
