class NullAdapter {
    async query<T>(query: string, params?: any[]): Promise<T[]> {
      return [];
    }
  
    async close(): Promise<void> {
      // Do nothing
    }
  }
  
  export default NullAdapter;