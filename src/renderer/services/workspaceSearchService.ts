import type { WorkspaceSearchOptions, WorkspaceSearchResult } from '../../types';

export async function searchWorkspace(
  options: WorkspaceSearchOptions
): Promise<WorkspaceSearchResult[]> {
  if (window.electronAPI?.searchWorkspace) {
    try {
      return await window.electronAPI.searchWorkspace(options);
    } catch (error) {
      console.error('Failed to search workspace via electronAPI:', error);
      return [];
    }
  }
  return [];
}
