import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

const CoachSearchDebug: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testExactSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log('Searching for coach with name:', searchTerm);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .eq('role', 'coach');

      if (error) {
        console.error('Error searching for coach:', error);
        setError(`Error searching for coach: ${error.message}`);
        return;
      }

      console.log('Search results:', data);
      setResults(data as Profile[]);
      
      if (data.length === 0) {
        setError(`No coach found with name containing "${searchTerm}"`);
      }
    } catch (e) {
      console.error('Exception while searching:', e);
      setError(`An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllProfiles = async () => {
    setIsLoading(true);
    setError(null);
    setRawData([]);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        setError(`Error fetching profiles: ${error.message}`);
        return;
      }

      console.log('All profiles:', data);
      setRawData(data as Profile[]);
      
      if (data.length === 0) {
        setError('No profiles found in the database');
      }
    } catch (e) {
      console.error('Exception while fetching profiles:', e);
      setError(`An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Coach Search Debug Tool</h1>
      
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Test Coach Search</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter coach name to search"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={testExactSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={getAllProfiles}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
          >
            {isLoading ? 'Loading...' : 'Get All Profiles'}
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Search Results:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Role</th>
                    <th className="border p-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((profile) => (
                    <tr key={profile.id}>
                      <td className="border p-2 font-mono text-xs">{profile.id}</td>
                      <td className="border p-2">{profile.full_name}</td>
                      <td className="border p-2">{profile.email}</td>
                      <td className="border p-2">{profile.role}</td>
                      <td className="border p-2">{new Date(profile.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rawData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">All Profiles:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Role</th>
                    <th className="border p-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((profile) => (
                    <tr key={profile.id} className={profile.role === 'coach' ? 'bg-blue-50' : ''}>
                      <td className="border p-2 font-mono text-xs">{profile.id}</td>
                      <td className="border p-2">{profile.full_name}</td>
                      <td className="border p-2">{profile.email}</td>
                      <td className="border p-2">{profile.role}</td>
                      <td className="border p-2">{new Date(profile.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachSearchDebug; 